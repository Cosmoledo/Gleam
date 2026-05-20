/**
 * Check if a value parses as a finite number.
 * Accepts numeric strings ("3", "3.5") and rejects "3abc", "", NaN, Infinity.
 */
export function isNumeric(value: unknown): boolean {
	const n = parseFloat(value as string);
	return Number.isFinite(n) && String(n) === String(value).trim();
}

/**
 * Generate a random angle between 0 and 2-PI in radians
 */
export function random2Pi(): number {
	return Math.random() * Math.PI * 2;
}

/**
 * Generate a random float between two values
 */
export function randomBeetweenFloat(min: number, max: number): number {
	return min + Math.random() * (max - min);
}

/**
 * Generate a random integer between two values
 */
export function randomBeetweenInt(min: number, max: number): number {
	return Math.floor(randomBeetweenFloat(min, max));
}

/**
 * Generate a random boolean value
 */
export function randomBoolean(): boolean {
	return Math.random() >= 0.5;
}

/**
 * Generate a random sign (1 or -1)
 */
export function randomSign(): number {
	return randomBoolean() ? 1 : -1;
}

/**
 * Format time in seconds as HH:MM:SS string
 */
export function toHHMMSS(time: number): string {
	time = Math.floor(time);

	const h = Math.floor(time / 3600);
	const m = Math.floor((time - h * 3600) / 60);
	const s = time - h * 3600 - m * 60;

	const hours = h < 10 ? "0" + h : "" + h;
	const minutes = m < 10 ? "0" + m : "" + m;
	const seconds = s < 10 ? "0" + s : "" + s;

	if (h === 0) {
		return `${minutes}m:${seconds}s`;
	}

	return `${hours}h:${minutes}m:${seconds}s`;
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
	return (radians * 180) / Math.PI;
}

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

/**
 * Round a number to a specified number of decimal places
 */
export function roundTo(number: number, digitsAfterPoint: number): number {
	const power = Math.pow(10, digitsAfterPoint);

	return Math.round(number * power) / power;
}

/**
 * Calculate factorial of a non-negative integer
 */
const factorialsCache: Record<number, number> = {};
factorialsCache[0] = 1;

export function getFactorial(n: number): number {
	const intN = Math.floor(n);

	if (intN < 0 || !Number.isFinite(intN)) {
		throw new Error("getFactorial requires non-negative integer");
	}

	if (factorialsCache[intN] !== undefined) {
		return factorialsCache[intN];
	}

	let result = 1;
	for (let i = 2; i <= intN; i++) {
		result *= i;
		factorialsCache[i] = result;
	}

	return result;
}
