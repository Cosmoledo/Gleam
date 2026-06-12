import type ControllerCursor from "@/input/ControllerCursor";
import type Mouse from "@/input/Mouse";
import { throttleByKey } from "@/utilities/Functions";

export interface GameEventMap {
	gameloopStopped: [];
	inputControllerConnected: [buttons: boolean[], cursors: ControllerCursor[]];
	inputControllerDisconnected: [];
	inputKeyboard: [keys: Record<string, boolean>, code: string];
	inputMouse: [mouse: Mouse];
	resized: [];
}

export interface EventSystemOptions {
	once?: boolean;
	signal?: AbortSignal;
}

type GameEventListener<K extends keyof GameEventMap> = {
	callback: (...args: GameEventMap[K]) => void;
	dispose: () => void;
	options: { once: boolean; signal?: AbortSignal };
};

export default class EventSystem {
	private static eventListener: {
		[K in keyof GameEventMap]?: Map<number, GameEventListener<K>>;
	} = {};

	// Monotonic counter — each listener gets an id assigned at registration.
	// `dispatchEvent` captures the value at start as a boundary so listeners
	// registered mid-dispatch (id > maxId) are deferred to the next dispatch.
	private static nextId = 0;

	private static logListenerError = throttleByKey(
		(count: number, eventName: string, err: unknown) => {
			const suffix = count > 1 ? ` (x${count} since last log)` : "";

			console.error(
				`EventSystem listener for "${eventName}" threw${suffix}:`,
				err,
			);
		},
		1000,
	);

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
			options: { once: options.once ?? false, signal: options.signal },
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

		// Map.forEach is safe under mid-iteration mutation:
		//   - entries deleted during the walk are skipped natively, so a callback
		//     calling dispose() on itself, a sibling, or via nested dispatch needs
		//     no extra bookkeeping;
		//   - entries added during the walk would otherwise be visited, but the
		//     `id > maxId` filter excludes them;
		//   - nested forEach on the same Map keeps its own position, so recursive
		//     dispatch works without depth tracking.
		bucket.forEach((entry, id) => {
			if (id > maxId) {
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
		});
	}
}
