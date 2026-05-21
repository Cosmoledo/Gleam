/**
 * Clone a 2D grid; the outer array and each row become independent copies.
 * Row cells are kept as-is (suitable for primitive cells; for nested structures use `deepClone`).
 */
export function cloneGrid<T>(grid: ReadonlyArray<ReadonlyArray<T>>): T[][] {
	const result: T[][] = [];

	for (let y = 0; y < grid.length; y++) {
		result[y] = grid[y].slice();
	}

	return result;
}

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

/**
 * Generate a `height × width` 2D grid; every cell holds `defaultValue` (stored by reference).
 */
export function generateGrid<T>(
	height: number,
	width: number,
	defaultValue: T,
): T[][];
/**
 * Generate a `height × width` 2D grid by invoking `factory(x, y)` for each cell.
 */
export function generateGrid<T>(
	height: number,
	width: number,
	factory: (x: number, y: number) => T,
): T[][];
export function generateGrid<T>(
	height: number,
	width: number,
	valueOrFactory: T | ((x: number, y: number) => T),
): T[][] {
	const isFactory = typeof valueOrFactory === "function";
	const grid: T[][] = [];

	for (let y = 0; y < height; y++) {
		grid[y] = [];

		for (let x = 0; x < width; x++) {
			grid[y][x] = isFactory
				? (valueOrFactory as (x: number, y: number) => T)(x, y)
				: valueOrFactory;
		}
	}

	return grid;
}
