/**
 * Clamp values between two values
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/**
 * Map value from one range to another
 */
export function mapUnclamped(
	value: number,
	low1: number,
	high1: number,
	low2: number,
	high2: number,
): number {
	return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
}

/**
 * Map value from one range to another (with clamping)
 */
export function map(
	value: number,
	low1: number,
	high1: number,
	low2: number,
	high2: number,
): number {
	return clamp(mapUnclamped(value, low1, high1, low2, high2), low2, high2);
}

/**
 * Apply threshold function - returns 0 if below threshold, otherwise input value
 */
export function threshold(value: number, threshold: number): number {
	if (Math.abs(value) < threshold) {
		return 0;
	}

	return value;
}

/**
 * Format number with dot separators (e.g., 1.000.000)
 */
export function toDotted(value: number): string {
	return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Wrap `value` so it stays in `[min, max)`, repeatedly adding/subtracting `adjustBy`
 * (defaults to `max`). Useful for cyclic ranges like angles.
 */
export function wrapValue(
	value: number,
	min: number,
	max: number,
	adjustBy: number = max,
): number {
	while (value < min) {
		value += adjustBy;
	}

	while (value >= max) {
		value -= adjustBy;
	}

	return value;
}

/**
 * Convert number to Roman numeral
 */
export function toRoman(value: number): string {
	const v = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
	const r = [
		"M",
		"CM",
		"D",
		"CD",
		"C",
		"XC",
		"L",
		"XL",
		"X",
		"IX",
		"V",
		"IV",
		"I",
	];

	let out = "";
	for (let i = 0; i < v.length; i++) {
		for (let k = 0; k < ((value / v[i]) | 0); k++) {
			out += r[i];
		}
		value = value % v[i];
	}

	return out;
}
