/**
 * Returns a debounced wrapper that runs `callback` only after `delay` ms of silence (trailing edge).
 */
export function debounce<T extends unknown[]>(
	callback: (...args: T) => void,
	delay: number,
): (...args: T) => void {
	let timer: ReturnType<typeof setTimeout> | undefined;

	return (...args: T) => {
		clearTimeout(timer);
		timer = setTimeout(() => callback(...args), delay);
	};
}

/**
 * Promise that resolves after `time` milliseconds.
 */
export function delay(time: number): Promise<void> {
	return new Promise(res => setTimeout(res, time));
}

/**
 * Returns `true` when touch is the primary input right now (game-UI question: show touch controls?).
 * Mode-aware: a convertible in laptop mode returns `false`, in tablet mode returns `true`.
 * Snapshot at call time — won't auto-update if the user switches modes mid-game.
 */
export function isTouchPrimary(): boolean {
	return matchMedia("(pointer: coarse)").matches;
}

/**
 * Run `tick(dt)` on every animation frame; `dt` is seconds since the previous
 * frame (0 on the first call). Returns a cancel function that stops the loop —
 * no further ticks fire after it's called, even if one was already queued.
 */
export function rafLoop(tick: (dt: number) => void): () => void {
	let lastTime = 0;
	let running = true;
	let handle = 0;

	const wrapped = (now: number): void => {
		const dt = lastTime === 0 ? 0 : (now - lastTime) / 1000;
		lastTime = now;

		tick(dt);

		// `running` covers stop-from-inside-tick: after tick returns, skip the requeue.
		if (running) {
			handle = requestAnimationFrame(wrapped);
		}
	};

	handle = requestAnimationFrame(wrapped);

	return () => {
		running = false;
		cancelAnimationFrame(handle);
	};
}

/**
 * Returns a throttled wrapper that runs `callback` at most once per `delay` ms (leading edge).
 * The callback receives the number of wrapper calls since the previous firing (inclusive of this one).
 */
export function throttle(
	callback: (callCount: number) => void,
	delay: number,
): () => void {
	let lastCalled = -Infinity;
	let callCount = 0;

	return () => {
		callCount++;

		const now = performance.now();

		if (now - lastCalled > delay) {
			lastCalled = now;
			const count = callCount;
			callCount = 0;
			callback(count);
		}
	};
}

/**
 * Like `throttle`, but tracks the last firing independently per `key` —
 * different keys never throttle each other. Use for de-duplicating repeated
 * error/warning logs by message identity. When the throttle fires, args from
 * the most recent call for that key are passed through alongside `callCount`.
 */
export function throttleByKey<T extends unknown[]>(
	callback: (callCount: number, ...args: T) => void,
	delay: number,
): (key: string, ...args: T) => void {
	const wrappers = new Map<string, (...args: T) => void>();

	return (key, ...args) => {
		let wrapper = wrappers.get(key);

		if (!wrapper) {
			let latest: T;
			const throttled = throttle(
				count => callback(count, ...latest),
				delay,
			);
			wrapper = (...a: T) => {
				latest = a;
				throttled();
			};
			wrappers.set(key, wrapper);
		}

		wrapper(...args);
	};
}

/**
 * Filename component of a URL/path, without directory, extension, or query string.
 * Returns `null` when no usable name can be derived: a path ending in `/`, or a stem containing a malformed percent-escape that `decodeURIComponent` rejects.
 */
export function urlBasename(path: string): string | null {
	const url = new URL(path, "http://_/");
	const base = url.pathname.split("/").pop()!;
	const dot = base.lastIndexOf(".");
	const stem = dot > 0 ? base.slice(0, dot) : base;

	if (!stem) {
		return null;
	}

	try {
		return decodeURIComponent(stem);
	} catch {
		return null;
	}
}
