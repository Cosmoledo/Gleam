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
