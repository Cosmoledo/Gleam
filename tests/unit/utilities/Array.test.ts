import { describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import { chunk, randomItem, remove, shuffle } from "@/utilities/Array";

// ==================== chunk ====================

describe("chunk", () => {
	it("splits an array into chunks of the given maxLength", () => {
		expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
	});

	it("returns single chunk when maxLength >= array length", () => {
		expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
	});

	it("returns each element as its own chunk when maxLength is 1", () => {
		expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
	});

	it("returns empty array for empty input", () => {
		expect(chunk([], 3)).toEqual([]);
	});

	it("handles maxLength equal to array length", () => {
		expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
	});

	it("works with non-number types", () => {
		const result = chunk(["a", "b", "c", "d"], 3);
		expect(result).toEqual([["a", "b", "c"], ["d"]]);
	});

	it("does not mutate the input array", () => {
		const input = [1, 2, 3, 4];
		chunk(input, 2);
		expect(input).toEqual([1, 2, 3, 4]);
	});

	it("throws on maxLength < 1", () => {
		expect(() => chunk([1, 2, 3], 0)).toThrow(RangeError);
		expect(() => chunk([1, 2, 3], -1)).toThrow(RangeError);
		expect(() => chunk([1, 2, 3], -5)).toThrow(RangeError);
	});

	it("throws on NaN maxLength", () => {
		expect(() => chunk([1, 2, 3], NaN)).toThrow(RangeError);
	});
});

// ==================== randomItem ====================

describe("randomItem", () => {
	it("returns an element from the array", () => {
		const items = [10, 20, 30];
		const result = randomItem(items);
		expect(items).toContain(result);
	});

	it("throws on empty array", () => {
		expect(() => randomItem([])).toThrow(
			"randomItem called on empty array",
		);
	});

	it("can return any element given enough trials", () => {
		const items = [1, 2, 3, 4, 5];
		const results = new Set<number>();

		for (let i = 0; i < 500; i++) {
			results.add(randomItem(items));
		}

		// With 500 draws from 5 items, we should see all of them
		expect(results.size).toBe(5);
	});

	it("works with non-number types", () => {
		const items = ["x", "y", "z"];
		const result = randomItem(items);
		expect(items).toContain(result);
	});
});

// ==================== remove ====================

describe("remove", () => {
	it("removes the first occurrence of the item", () => {
		const arr = [1, 2, 3, 2, 4];
		remove(arr, 2);
		expect(arr).toEqual([1, 3, 2, 4]);
	});

	it("does nothing when item is not present", () => {
		const arr = [1, 2, 3];
		remove(arr, 99);
		expect(arr).toEqual([1, 2, 3]);
	});

	it("works with objects by reference", () => {
		const obj = { id: 1 };
		const arr = [obj, { id: 2 }];
		remove(arr, obj);
		expect(arr).toEqual([{ id: 2 }]);
	});

	it("works with strings", () => {
		const arr = ["a", "b", "c", "b"];
		remove(arr, "b");
		expect(arr).toEqual(["a", "c", "b"]);
	});

	it("handles empty array", () => {
		const arr: number[] = [];
		remove(arr, 1);
		expect(arr).toEqual([]);
	});

	it("handles removing the last element", () => {
		const arr = [1, 2, 3];
		remove(arr, 3);
		expect(arr).toEqual([1, 2]);
	});

	it("handles removing the first element", () => {
		const arr = [1, 2, 3];
		remove(arr, 1);
		expect(arr).toEqual([2, 3]);
	});
});

// ==================== shuffle ====================

describe("shuffle", () => {
	it("returns an array with the same elements", () => {
		const input = [1, 2, 3, 4, 5];
		const result = shuffle(input);
		expect(result.sort((a, b) => a - b)).toEqual(input);
	});

	it("returns a new array (does not mutate input)", () => {
		const input = [1, 2, 3, 4, 5];
		const original = [...input];
		shuffle(input);
		expect(input).toEqual(original);
	});

	it("returns different order when called multiple times", () => {
		const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		let differentCount = 0;

		for (let i = 0; i < 100; i++) {
			const result = shuffle(input);
			if (result.some((v, idx) => v !== input[idx])) {
				differentCount++;
			}
		}

		// Should have some variation (not guaranteed but extremely unlikely to fail)
		expect(differentCount).toBeGreaterThan(50);
	});

	it("returns single element unchanged", () => {
		expect(shuffle([42])).toEqual([42]);
	});

	it("returns empty array for empty input", () => {
		expect(shuffle([])).toEqual([]);
	});

	it("works with non-number types", () => {
		const input = ["a", "b", "c"];
		const result = shuffle(input);
		expect(result.sort()).toEqual(input.sort());
	});

	it("uses Fisher-Yates correctly (deterministic with fixed RNG)", () => {
		vi.useFakeTimers();
		vi.spyOn(Math, "random").mockReturnValue(0.5);

		const result = shuffle([1, 2, 3, 4, 5]);
		expect(result).toEqual([1, 4, 2, 5, 3]);

		vi.useRealTimers();
		vi.restoreAllMocks();
	});
});
