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
