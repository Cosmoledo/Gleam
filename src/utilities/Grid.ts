import type { Vector2 } from "@/math/Vec2";

/**
 * Clone a 2D grid; the outer array and each row become independent copies.
 * Row cells are kept as-is (suitable for primitive cells; for nested structures use `deepClone`).
 */
export function cloneGrid<T>(grid: ReadonlyArray<ReadonlyArray<T>>): T[][] {
	return grid.map(row => row.slice());
}

/**
 * Convert a 1D index to `{x, y}` for a 2D grid of the given row width.
 */
export function convert1DTo2D(index: number, width: number): Vector2 {
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

	return Array.from({ length: height }, (_, y) =>
		Array.from({ length: width }, (_, x) =>
			isFactory
				? (valueOrFactory as (x: number, y: number) => T)(x, y)
				: valueOrFactory,
		),
	);
}
