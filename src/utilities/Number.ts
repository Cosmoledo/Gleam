import { approxEqual } from "./Math";

/**
 * Clamp values between two values
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/**
 * Map value from one range to another. Returns `low2` when the source range is degenerate (`low1 === high1`).
 */
export function mapUnclamped(
	value: number,
	low1: number,
	high1: number,
	low2: number,
	high2: number,
): number {
	if (low1 === high1) {
		return low2;
	}

	return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
}

/**
 * Map value from one range to another (with clamping). Output range allows to be inverted (`high2 < low2`).
 */
export function map(
	value: number,
	low1: number,
	high1: number,
	low2: number,
	high2: number,
): number {
	return clamp(
		mapUnclamped(value, low1, high1, low2, high2),
		Math.min(low2, high2),
		Math.max(low2, high2),
	);
}

/**
 * Zero out values with `|value| < cutoff`; pass the rest through unchanged.
 */
export function threshold(value: number, cutoff: number): number {
	if (Math.abs(value) < cutoff) {
		return 0;
	}

	return value;
}

/**
 * Format number with dot separators (e.g., 1.000.000). Rounds to the nearest integer via `Math.round`; non-finite values pass through as their `toString()` form.
 */
export function toDotted(value: number): string {
	return Math.round(value)
		.toString()
		.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Wrap `value` into `[min, max)` modulo the range size. Useful for cyclic ranges like angles.
 * Caller steps via `value + n`; this function handles the wrap-around.
 * Bounds are swapped if passed in reverse order. Throws when `min ≈ max` (degenerate range, via `approxEqual`).
 */
export function wrapValue(value: number, min: number, max: number): number {
	if (approxEqual(min, max)) {
		throw new RangeError(`wrapValue: min and max must differ (got ${min})`);
	}

	if (min > max) {
		[min, max] = [max, min];
	}

	const range = max - min;
	return ((((value - min) % range) + range) % range) + min;
}
