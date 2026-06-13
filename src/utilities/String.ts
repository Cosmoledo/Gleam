/**
 * Trim `str` and collapse internal whitespace runs to a single space.
 */
export function compact(str: string): string {
	return str.trim().replace(/\s+/g, " ");
}

/**
 * Replace the single character at `index` in `str`. Indexes by code point, so emoji and other supplementary-plane characters count as one. Throws on out-of-range index or multi-character `char`.
 */
export function replaceCharAt(
	str: string,
	index: number,
	char: string,
): string {
	const codePoints = Array.from(str);

	if (index < 0 || index >= codePoints.length) {
		throw new Error(
			`replaceCharAt index out of range: ${index} (length ${codePoints.length})`,
		);
	}

	const charPoints = Array.from(char);
	if (charPoints.length !== 1) {
		throw new Error(
			`replaceCharAt requires a single character, got length ${charPoints.length}`,
		);
	}

	codePoints[index] = char;
	return codePoints.join("");
}
