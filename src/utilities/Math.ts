import { wrapValue } from "./Number";

const NUMERIC_PATTERN = /^-?\d+(\.\d+)?$/;

/**
 * Check if a value is a finite number or a string holding one in plain decimal form.
 */
export function isNumeric(value: unknown): boolean {
	if (typeof value === "number") {
		return Number.isFinite(value);
	}

	if (typeof value === "string") {
		return NUMERIC_PATTERN.test(value.trim());
	}

	return false;
}

/**
 * Generate a random angle between 0 and 2-PI in radians
 */
export function random2Pi(): number {
	return Math.random() * Math.PI * 2;
}

/**
 * Generate a random float between two values. Bounds may be passed in either order.
 */
export function randomBetweenFloat(min: number, max: number): number {
	if (min > max) {
		[min, max] = [max, min];
	}

	return min + Math.random() * (max - min);
}

/**
 * Generate a random integer in `[min, max]` (both bounds inclusive). Bounds may be passed in either order.
 */
export function randomBetweenInt(min: number, max: number): number {
	if (min > max) {
		[min, max] = [max, min];
	}

	return Math.floor(min + Math.random() * (max - min + 1));
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
		return `${minutes}:${seconds}`;
	}

	return `${hours}:${minutes}:${seconds}`;
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
	return (radians * 180) / Math.PI;
}

/**
 * Wrap an angle in radians into `[-PI, PI)`.
 */
export function wrapRadians(angle: number): number {
	return wrapValue(angle, -Math.PI, Math.PI);
}

/**
 * Wrap an angle in degrees into `[-180, 180)`.
 */
export function wrapDegrees(angle: number): number {
	return wrapValue(angle, -180, 180);
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

const factorialsCache: Record<number, number> = { 0: 1 };
let largestCachedFactorial = 0;
let factorialOverflowAt = Infinity;

/**
 * Calculate factorial of a non-negative integer. Memoized — repeat calls reuse cached intermediates.
 * Returns `Infinity` once `n!` overflows the IEEE 754 double range (around `n = 171`).
 */
export function getFactorial(n: number): number {
	const intN = Math.floor(n);

	if (intN < 0 || !Number.isFinite(intN)) {
		throw new Error("getFactorial requires non-negative integer");
	}

	if (intN >= factorialOverflowAt) {
		return Infinity;
	}

	if (factorialsCache[intN] !== undefined) {
		return factorialsCache[intN];
	}

	let result = factorialsCache[largestCachedFactorial];
	for (let i = largestCachedFactorial + 1; i <= intN; i++) {
		result *= i;

		if (!Number.isFinite(result)) {
			factorialOverflowAt = i;
			return Infinity;
		}

		factorialsCache[i] = result;
		largestCachedFactorial = i;
	}

	return result;
}
