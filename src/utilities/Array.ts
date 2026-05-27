/**
 * Split an array into chunks of at most `maxLength` elements each.
 */
export function chunk<T>(array: ReadonlyArray<T>, maxLength: number): T[][] {
	const result: T[][] = [];
	let part: T[] = [];

	array.forEach((item, i) => {
		part.push(item);

		if (part.length === maxLength || i === array.length - 1) {
			result.push(part);
			part = [];
		}
	});

	return result;
}

/**
 * Pick a uniformly random element from `array`. Throws if `array` is empty — guard at the call site if that's possible.
 */
export function randomItem<T>(array: ReadonlyArray<T>): T {
	if (array.length === 0) {
		throw new Error("randomItem called on empty array");
	}

	return array[(Math.random() * array.length) | 0];
}

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
export function shuffle<T>(arr: ReadonlyArray<T>): T[] {
	const result = arr.slice();

	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}

	return result;
}
