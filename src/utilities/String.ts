/**
 * Compact string by removing whitespace and trimming
 */
export function compact(str: string): string {
	return str.trim().replace(/\t|\n/g, "").trim();
}

/**
 * Replace character at specific index in string
 */
export function replaceCharAt(
	str: string,
	index: number,
	char: string,
): string {
	if (index > str.length - 1) {
		return str;
	}

	return str.slice(0, index) + char + str.slice(index + 1);
}
