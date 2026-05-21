/**
 * Convert a 1D index to `{x, y}` for a 2D grid of the given row width.
 */
export function convert1DTo2D(index: number, width: number): GameLIB.Vector2 {
	return {
		x: index % width,
		y: (index / width) | 0,
	};
}

/**
 * Convert 2D `(x, y)` coordinates to a 1D index for a grid of the given row width.
 */
export function convert2DTo1D(
	indexX: number,
	indexY: number,
	width: number,
): number {
	return indexX + width * indexY;
}
