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
 * frame (0 on the first call). Returns a cancel function that ends the loop
 * after the current tick.
 */
export function rafLoop(tick: (dt: number) => void): () => void {
	let lastTime = 0;
	let running = true;

	const wrapped = (now: number): void => {
		const dt = lastTime === 0 ? 0 : (now - lastTime) / 1000;
		lastTime = now;

		tick(dt);

		if (running) {
			requestAnimationFrame(wrapped);
		}
	};

	requestAnimationFrame(wrapped);

	return () => {
		running = false;
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
	let lastCalled = 0;
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
 * Filename component of a URL/path, without directory, extension, or query string.
 * Returns `null` when no usable name can be derived (e.g. a path ending in `/`).
 */
export function urlBasename(path: string): string | null {
	const url = new URL(path, "http://_/");
	const base = url.pathname.split("/").pop()!;
	const dot = base.lastIndexOf(".");
	const stem = dot > 0 ? base.slice(0, dot) : base;

	if (!stem) {
		return null;
	}

	return decodeURIComponent(stem);
}
