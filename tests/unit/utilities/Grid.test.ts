import { describe, it, expect, vi } from "vitest";

// ==================== Imports ====================

import {
	cloneGrid,
	convert1DTo2D,
	convert2DTo1D,
	generateGrid,
} from "@/utilities/Grid";

// ==================== cloneGrid ====================

describe("cloneGrid", () => {
	it("returns a new outer array", () => {
		const input: number[][] = [
			[1, 2],
			[3, 4],
		];
		const result = cloneGrid(input);
		expect(result).not.toBe(input);
	});

	it("returns new inner arrays", () => {
		const input: number[][] = [
			[1, 2],
			[3, 4],
		];
		const result = cloneGrid(input);
		expect(result[0]).not.toBe(input[0]);
		expect(result[1]).not.toBe(input[1]);
	});

	it("preserves cell values", () => {
		const input: number[][] = [
			[1, 2],
			[3, 4],
		];
		const result = cloneGrid(input);
		expect(result).toEqual([
			[1, 2],
			[3, 4],
		]);
	});

	it("allows independent mutation of outer array", () => {
		const input: number[][] = [
			[1, 2],
			[3, 4],
		];
		const result = cloneGrid(input);
		result.push([5, 6]);
		expect(input.length).toBe(2);
		expect(result.length).toBe(3);
	});

	it("allows independent mutation of inner arrays", () => {
		const input: number[][] = [
			[1, 2],
			[3, 4],
		];
		const result = cloneGrid(input);
		result[0].push(3);
		expect(input[0]).toEqual([1, 2]);
		expect(result[0]).toEqual([1, 2, 3]);
	});

	it("works with string values", () => {
		const input: string[][] = [
			["a", "b"],
			["c", "d"],
		];
		const result = cloneGrid(input);
		expect(result).toEqual([
			["a", "b"],
			["c", "d"],
		]);
	});

	it("works with object values (stored by reference)", () => {
		const obj = { id: 1 };
		const input: any[][] = [[obj], [obj]];
		const result = cloneGrid(input);
		expect(result[0][0]).toBe(obj);
		expect(result[1][0]).toBe(obj);
	});

	it("handles empty grid", () => {
		const input: number[][] = [];
		const result = cloneGrid(input);
		expect(result).toEqual([]);
		expect(result).not.toBe(input);
	});

	it("handles grid with empty rows", () => {
		const input: number[][] = [[], [1, 2], []];
		const result = cloneGrid(input);
		expect(result).toEqual([[], [1, 2], []]);
		expect(result[0]).not.toBe(input[0]);
		expect(result[2]).not.toBe(input[2]);
	});

	it("handles single row", () => {
		const input: number[][] = [[1, 2, 3]];
		const result = cloneGrid(input);
		expect(result).toEqual([[1, 2, 3]]);
		expect(result[0]).not.toBe(input[0]);
	});

	it("handles single cell", () => {
		const input: number[][] = [[42]];
		const result = cloneGrid(input);
		expect(result).toEqual([[42]]);
	});
});

// ==================== convert1DTo2D ====================

describe("convert1DTo2D", () => {
	it("converts index 0 to {x: 0, y: 0}", () => {
		expect(convert1DTo2D(0, 5)).toEqual({ x: 0, y: 0 });
	});

	it("converts index within first row", () => {
		expect(convert1DTo2D(3, 5)).toEqual({ x: 3, y: 0 });
	});

	it("converts last index of first row", () => {
		expect(convert1DTo2D(4, 5)).toEqual({ x: 4, y: 0 });
	});

	it("converts first index of second row", () => {
		expect(convert1DTo2D(5, 5)).toEqual({ x: 0, y: 1 });
	});

	it("converts index in middle of second row", () => {
		expect(convert1DTo2D(7, 5)).toEqual({ x: 2, y: 1 });
	});

	it("converts last index of second row", () => {
		expect(convert1DTo2D(9, 5)).toEqual({ x: 4, y: 1 });
	});

	it("converts index in third row", () => {
		expect(convert1DTo2D(10, 5)).toEqual({ x: 0, y: 2 });
	});

	it("handles width of 1", () => {
		expect(convert1DTo2D(0, 1)).toEqual({ x: 0, y: 0 });
		expect(convert1DTo2D(5, 1)).toEqual({ x: 0, y: 5 });
	});

	it("handles width of 2", () => {
		expect(convert1DTo2D(0, 2)).toEqual({ x: 0, y: 0 });
		expect(convert1DTo2D(1, 2)).toEqual({ x: 1, y: 0 });
		expect(convert1DTo2D(2, 2)).toEqual({ x: 0, y: 1 });
		expect(convert1DTo2D(3, 2)).toEqual({ x: 1, y: 1 });
	});

	it("handles large width", () => {
		expect(convert1DTo2D(99, 100)).toEqual({ x: 99, y: 0 });
		expect(convert1DTo2D(100, 100)).toEqual({ x: 0, y: 1 });
	});

	it("handles index equal to width", () => {
		expect(convert1DTo2D(5, 5)).toEqual({ x: 0, y: 1 });
	});

	it("handles index beyond width", () => {
		expect(convert1DTo2D(14, 5)).toEqual({ x: 4, y: 2 });
	});
});

// ==================== convert2DTo1D ====================

describe("convert2DTo1D", () => {
	it("converts {0, 0} to index 0", () => {
		expect(convert2DTo1D(0, 0, 5)).toBe(0);
	});

	it("converts within first row", () => {
		expect(convert2DTo1D(3, 0, 5)).toBe(3);
	});

	it("converts last column of first row", () => {
		expect(convert2DTo1D(4, 0, 5)).toBe(4);
	});

	it("converts first column of second row", () => {
		expect(convert2DTo1D(0, 1, 5)).toBe(5);
	});

	it("converts within second row", () => {
		expect(convert2DTo1D(2, 1, 5)).toBe(7);
	});

	it("converts last column of second row", () => {
		expect(convert2DTo1D(4, 1, 5)).toBe(9);
	});

	it("converts third row", () => {
		expect(convert2DTo1D(0, 2, 5)).toBe(10);
	});

	it("handles width of 1", () => {
		expect(convert2DTo1D(0, 0, 1)).toBe(0);
		expect(convert2DTo1D(0, 5, 1)).toBe(5);
	});

	it("handles width of 2", () => {
		expect(convert2DTo1D(0, 0, 2)).toBe(0);
		expect(convert2DTo1D(1, 0, 2)).toBe(1);
		expect(convert2DTo1D(0, 1, 2)).toBe(2);
		expect(convert2DTo1D(1, 1, 2)).toBe(3);
	});

	it("handles large width", () => {
		expect(convert2DTo1D(99, 0, 100)).toBe(99);
		expect(convert2DTo1D(0, 1, 100)).toBe(100);
	});

	it("is inverse of convert1DTo2D", () => {
		for (let i = 0; i < 50; i++) {
			const width = 5;
			const pos = convert1DTo2D(i, width);
			expect(convert2DTo1D(pos.x, pos.y, width)).toBe(i);
		}
	});
});

// ==================== generateGrid (default value) ====================

describe("generateGrid (default value)", () => {
	it("creates a grid with the given dimensions", () => {
		const result = generateGrid(3, 4, 0);
		expect(result.length).toBe(3);
		expect(result[0].length).toBe(4);
	});

	it("fills all cells with the default value", () => {
		const result = generateGrid(3, 4, 0);
		expect(result).toEqual([
			[0, 0, 0, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
		]);
	});

	it("stores the default value by reference", () => {
		const obj = { id: 1 };
		const result = generateGrid(2, 3, obj);
		expect(result[0][0]).toBe(obj);
		expect(result[1][2]).toBe(obj);
	});

	it("creates empty grid for height 0", () => {
		const result = generateGrid(0, 3, 0);
		expect(result).toEqual([]);
	});

	it("creates empty grid for width 0", () => {
		const result = generateGrid(3, 0, 0);
		expect(result.length).toBe(3);
		expect(result[0]).toEqual([]);
	});

	it("creates single cell grid", () => {
		const result = generateGrid(1, 1, 42);
		expect(result).toEqual([[42]]);
	});

	it("works with string default value", () => {
		const result = generateGrid(2, 2, "x");
		expect(result).toEqual([
			["x", "x"],
			["x", "x"],
		]);
	});

	it("works with null default value", () => {
		const result = generateGrid(2, 2, null as any);
		expect(result).toEqual([
			[null, null],
			[null, null],
		]);
	});

	it("works with undefined default value", () => {
		const result = generateGrid(2, 2, undefined as any);
		expect(result).toEqual([
			[undefined, undefined],
			[undefined, undefined],
		]);
	});

	it("works with false default value", () => {
		const result = generateGrid(2, 2, false);
		expect(result).toEqual([
			[false, false],
			[false, false],
		]);
	});
});

// ==================== generateGrid (factory) ====================

describe("generateGrid (factory)", () => {
	it("calls factory for each cell", () => {
		const fn = vi.fn((x: number, y: number) => x + y);
		const result = generateGrid(3, 3, fn);
		expect(result).toEqual([
			[0, 1, 2],
			[1, 2, 3],
			[2, 3, 4],
		]);
	});

	it("passes correct x and y to factory", () => {
		const coords: [number, number][] = [];
		const factory = (x: number, y: number) => {
			coords.push([x, y]);
			return x + y;
		};
		generateGrid(2, 3, factory);
		expect(coords).toEqual([
			[0, 0],
			[1, 0],
			[2, 0],
			[0, 1],
			[1, 1],
			[2, 1],
		]);
	});

	it("creates independent objects per cell", () => {
		const result = generateGrid(2, 3, () => ({ value: 0 }));
		expect(result[0][0]).not.toBe(result[0][1]);
		expect(result[1][2]).not.toBe(result[0][0]);
	});

	it("handles width 0 with factory", () => {
		const fn = vi.fn();
		const result = generateGrid(2, 0, fn);
		expect(result.length).toBe(2);
		expect(result[0]).toEqual([]);
		expect(fn).not.toHaveBeenCalled();
	});

	it("handles height 0 with factory", () => {
		const fn = vi.fn();
		const result = generateGrid(0, 3, fn);
		expect(result).toEqual([]);
		expect(fn).not.toHaveBeenCalled();
	});

	it("works with string return values", () => {
		const result = generateGrid(2, 2, (x, y) => `(${x},${y})`);
		expect(result).toEqual([
			["(0,0)", "(1,0)"],
			["(0,1)", "(1,1)"],
		]);
	});
});
