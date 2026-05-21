/**
 * Promise that resolves after `time` milliseconds.
 */
export function delay(time: number): Promise<void> {
	return new Promise(res => setTimeout(res, time));
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
