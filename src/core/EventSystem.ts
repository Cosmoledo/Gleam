import type Pointer from "@/input/Pointer";
import { throttleByKey } from "@/utilities/Functions";

/**
 * Type-safe registry of engine events and their payload tuples. Both {@link EventSystem.addEventListener} and {@link EventSystem.dispatchEvent} are generic over this map, so the listener callback and dispatched args are checked against the declared shape.
 */
export interface GameEventMap {
	/** Fired by {@link Gameloop} once teardown completes, after `stopLoop()` is called. */
	gameloopStopped: [];
	/** Fired by {@link Controller} when a gamepad is connected. Payload is the native `Gamepad`. */
	inputControllerConnected: [event: Gamepad];
	/** Fired by {@link Controller} when *our* tracked gamepad disconnects. Other gamepads disconnecting are logged but don't dispatch. */
	inputControllerDisconnected: [];
	/** Fired by {@link Keyboard} on every key down/up with the live `keys` map, the `code` that changed, and its new pressed state. */
	inputKeyboard: [
		keys: Record<string, boolean>,
		code: string,
		pressed: boolean,
	];
	/** Fired by {@link Pointer} on every move and button transition. Payload is the `Pointer` instance — read `posScaled`/`pressed` from it. */
	inputPointer: [pointer: Pointer];
	/** Fired by {@link Game.preInit} once at startup and on every debounced `window.resize` thereafter. The canonical "viewport changed" signal. */
	resized: [];
}

/** Options for {@link EventSystem.addEventListener}. */
export interface EventSystemOptions {
	/** Index signature for forward-compatible options: extra fields are accepted and preserved verbatim on the stored listener, so callers can attach metadata without a type change here. */
	[key: string]: unknown;
	/** Auto-dispose the listener after the first dispatch. */
	once?: boolean;
	/** Fire this listener before non-priority listeners on every dispatch, regardless of when it was registered. Reserved for engine-internal wiring so the engine's own reaction (e.g. canvas resize) always precedes user listeners for the same event. */
	priority?: boolean;
	/** Dispose the listener when the signal aborts. Already-aborted signals make `addEventListener` a no-op. */
	signal?: AbortSignal;
}

type GameEventListener<K extends keyof GameEventMap> = {
	callback: (...args: GameEventMap[K]) => void;
	dispose: () => void;
	options: { once: boolean; priority: boolean; signal?: AbortSignal };
};

/**
 * Synchronous, type-safe pub/sub for engine-wide events. Static-only — call as `EventSystem.addEventListener(...)` / `EventSystem.dispatchEvent(...)`. Event names and payloads are constrained by {@link GameEventMap}.
 *
 * Guarantees:
 *
 * - `priority` listeners (engine-internal wiring) run before non-priority ones on every dispatch, independent of registration order; within each tier, registration order (FIFO) is preserved.
 * - Listeners registered during a dispatch are deferred to the next dispatch (won't fire in the round that registered them).
 * - `once` listeners are removed *before* their callback runs, so nested dispatches and throwing callbacks can't double-fire them.
 * - A throwing callback is caught and logged (throttled per `eventName:message`); siblings still receive the event.
 */
export default class EventSystem {
	private static eventListener: {
		[K in keyof GameEventMap]?: Map<number, GameEventListener<K>>;
	} = {};

	private static logListenerError = throttleByKey<[string, unknown]>(
		(count, eventName, err) => {
			const suffix = count > 1 ? ` (x${count} since last log)` : "";

			console.error(
				`EventSystem listener for "${eventName}" threw${suffix}:`,
				err,
			);
		},
	);

	// Monotonic counter — each listener gets an id assigned at registration.
	// `dispatchEvent` captures the value at start as a boundary so listeners
	// registered mid-dispatch (id > maxId) are deferred to the next dispatch.
	private static nextId = 0;

	/**
	 * Register a listener for `eventName`. Returns a dispose function — the primary teardown path. Multiple disposers (returned, `once`, `signal.abort`) are idempotent. Use {@link EventSystemOptions} for `once` and `signal` behavior.
	 */
	public static addEventListener<K extends keyof GameEventMap>(
		eventName: K,
		callback: (...args: GameEventMap[K]) => void,
		options: EventSystemOptions = {},
	): () => void {
		if (options.signal?.aborted) {
			return function dispose(): void {};
		}

		const id = ++this.nextId;

		// `function` declaration (not arrow) so it's hoisted and can reference
		// the `listener` constant defined below — both close over the same id.
		// Used by: user-returned disposer, the once-path in dispatchEvent, and
		// the signal's abort handler. Idempotent via Map.delete's false return.
		function dispose(): void {
			const bucket = EventSystem.eventListener[eventName];

			if (!bucket?.delete(id)) {
				return;
			}

			// Drop the bucket entry when empty so `eventListener` doesn't grow
			// monotonically and `dispatchEvent` can short-circuit on `!bucket`
			// without a per-dispatch size check.
			if (bucket.size === 0) {
				delete EventSystem.eventListener[eventName];
			}

			if (listener.options.signal) {
				listener.options.signal.removeEventListener("abort", dispose);
			}
		}

		const listener: GameEventListener<K> = {
			callback,
			dispose,
			options: {
				...options,
				once: options.once ?? false,
				priority: options.priority ?? false,
				signal: options.signal,
			},
		};

		let bucket = this.eventListener[eventName];

		if (!bucket) {
			bucket = new Map();
			this.eventListener[eventName] = bucket;
		}

		bucket.set(id, listener);

		if (options.signal) {
			options.signal.addEventListener("abort", dispose, { once: true });
		}

		return dispose;
	}

	/** Synchronously fire `eventName` with the typed payload. `priority` (engine-internal) listeners run first, then the rest; within each tier registration order is preserved. Nested dispatches and self-disposing listeners are handled safely. */
	public static dispatchEvent<K extends keyof GameEventMap>(
		eventName: K,
		...params: GameEventMap[K]
	): void {
		const bucket = this.eventListener[eventName];

		if (!bucket) {
			return;
		}

		// Snapshot the id boundary — listeners registered during this dispatch
		// (which would have ids > maxId) are skipped this round.
		const maxId = this.nextId;

		// Invoke one entry, filtering out mid-dispatch registrations and entries
		// belonging to the tier not currently being walked.
		const invoke = (
			entry: GameEventListener<K>,
			id: number,
			priority: boolean,
		): void => {
			if (id > maxId || entry.options.priority !== priority) {
				return;
			}

			// Remove the once-listener *before* invoking the callback so a nested
			// dispatch of the same event can't fire it a second time, and so a
			// throwing callback still leaves the bucket clean.
			if (entry.options.once) {
				entry.dispose();
			}

			try {
				entry.callback(...params);
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				this.logListenerError(`${eventName}:${msg}`, eventName, err);
			}
		};

		// Two passes over the same Map — priority (engine-internal) listeners
		// first, then the rest — rather than a sorted snapshot, so Map.forEach's
		// native mid-iteration mutation safety is retained:
		//   - entries deleted during the walk are skipped natively, so a callback
		//     calling dispose() on itself, a sibling, or via nested dispatch needs
		//     no extra bookkeeping;
		//   - entries added during the walk would otherwise be visited, but the
		//     `id > maxId` filter excludes them;
		//   - nested forEach on the same Map keeps its own position, so recursive
		//     dispatch works without depth tracking.
		bucket.forEach((entry, id) => invoke(entry, id, true));
		bucket.forEach((entry, id) => invoke(entry, id, false));
	}
}
