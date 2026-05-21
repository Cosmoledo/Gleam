/**
 * Promise that resolves after `time` milliseconds.
 */
export function delay(time: number): Promise<void> {
	return new Promise(res => setTimeout(res, time));
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
 * Heuristic: returns `true` if the user-agent looks mobile or the page exposes `window.orientation`.
 */
export function isMobile(): boolean {
	const mobileTest1 =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		);

	// https://coderwall.com/p/i817wa/one-line-function-to-detect-mobile-devices-with-javascript
	const mobileTest2 =
		typeof window.orientation !== "undefined" ||
		navigator.userAgent.indexOf("IEMobile") !== -1;

	return mobileTest1 || mobileTest2;
}
