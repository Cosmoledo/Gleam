/**
 * Trim `str` and collapse internal whitespace runs to a single space.
 */
export function compact(str: string): string {
	return str.trim().replace(/\s+/g, " ");
}

/**
 * Replace the single character at `index` in `str`. Throws on out-of-range index or multi-char `char`.
 */
export function replaceCharAt(
	str: string,
	index: number,
	char: string,
): string {
	if (index < 0 || index >= str.length) {
		throw new Error(
			`replaceCharAt index out of range: ${index} (length ${str.length})`,
		);
	}

	if (char.length !== 1) {
		throw new Error(
			`replaceCharAt requires a single character, got length ${char.length}`,
		);
	}

	return str.slice(0, index) + char + str.slice(index + 1);
}
