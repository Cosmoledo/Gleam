/**
 * Remove an entry of an Array
 */
export function remove<T>(arr: T[], item: T): void {
	const index = arr.indexOf(item);
	if (index >= 0) {
		arr.splice(index, 1);
	}
}

/**
 * Shuffle array using Fisher-Yates algorithm with custom random signer
 */
export function shuffle<T>(arr: T[]): T[] {
	const result = arr.slice();

	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}

	return result;
}

/**
 * Clone array of objects/arrays - returns nested array structure
 * Note: Returns T[] if all items are primitives, T[][] if nested arrays
 */
export function clone<T extends Array<any>>(arr: T[]): (T | T[])[] {
	const result: any[] = [];

	for (let i = 0; i < arr.length; i++) {
		result[i] = Array.isArray(arr[i]) ? arr[i].slice() : arr[i];
	}

	return result;
}

/**
 * Split an array into chunks of at most `maxLength` elements each.
 */
export function splitArray<T = any>(array: T[], maxLength: number): T[][] {
	const result: T[][] = [];
	let part: T[] = [];

	for (let i = 0; i < array.length; i++) {
		part.push(array[i]);

		if (part.length === maxLength || i === array.length - 1) {
			result.push(part);
			part = [];
		}
	}

	return result;
}

/**
 * Pick a uniformly random element from `array`.
 */
export function randomItem<T>(array: T[]): T {
	return array[(Math.random() * array.length) | 0];
}

/**
 * Generate a `height × width` 2D array filled with `defaultValue`.
 * If `defaultValue` is a function it is invoked per cell.
 */
export function generateArray<T>(
	height: number,
	width: number,
	defaultValue: T,
): T[][] {
	const array: T[][] = [];

	for (let y = 0; y < height; y++) {
		array[y] = [];

		for (let x = 0; x < width; x++) {
			array[y][x] =
				typeof defaultValue === "function"
					? defaultValue()
					: defaultValue;
		}
	}

	return array;
}
