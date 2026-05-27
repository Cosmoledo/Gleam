import { describe, expect, it } from "vitest";

// ==================== Imports ====================

import {
	clamp,
	map,
	mapUnclamped,
	threshold,
	toDotted,
	wrapValue,
} from "@/utilities/Number";

// ==================== clamp ====================

describe("clamp", () => {
	it("returns value when within range", () => {
		expect(clamp(5, 1, 10)).toBe(5);
	});

	it("returns min when value is below range", () => {
		expect(clamp(-5, 0, 10)).toBe(0);
	});

	it("returns max when value is above range", () => {
		expect(clamp(15, 0, 10)).toBe(10);
	});

	it("returns min when value equals min", () => {
		expect(clamp(0, 0, 10)).toBe(0);
	});

	it("returns max when value equals max", () => {
		expect(clamp(10, 0, 10)).toBe(10);
	});

	it("handles inverted range (min > max)", () => {
		expect(clamp(5, 10, 0)).toBe(0);
	});

	it("handles negative values", () => {
		expect(clamp(-5, -10, -1)).toBe(-5);
	});

	it("handles zero range", () => {
		expect(clamp(5, 3, 3)).toBe(3);
	});

	it("handles negative min and positive max", () => {
		expect(clamp(0, -5, 5)).toBe(0);
	});
});

// ==================== mapUnclamped ====================

describe("mapUnclamped", () => {
	it("maps value from one range to another", () => {
		expect(mapUnclamped(5, 0, 10, 0, 100)).toBe(50);
	});

	it("maps midpoint correctly", () => {
		expect(mapUnclamped(50, 0, 100, 0, 10)).toBe(5);
	});

	it("returns low2 when source range is degenerate", () => {
		expect(mapUnclamped(5, 3, 3, 10, 20)).toBe(10);
	});

	it("handles inverted output range", () => {
		expect(mapUnclamped(0, 0, 10, 100, 0)).toBe(100);
		expect(mapUnclamped(10, 0, 10, 100, 0)).toBe(0);
	});

	it("handles negative ranges", () => {
		expect(mapUnclamped(-5, -10, 0, 0, 100)).toBe(50);
	});

	it("maps value below source range", () => {
		expect(mapUnclamped(-5, 0, 10, 0, 100)).toBe(-50);
	});

	it("maps value above source range", () => {
		expect(mapUnclamped(15, 0, 10, 0, 100)).toBe(150);
	});

	it("handles equal source and target ranges", () => {
		expect(mapUnclamped(7, 0, 10, 0, 10)).toBe(7);
	});

	it("handles negative source with positive target", () => {
		expect(mapUnclamped(-5, -10, 0, 0, 100)).toBe(50);
	});

	it("handles positive source with negative target", () => {
		expect(mapUnclamped(5, 0, 10, -100, 0)).toBe(-50);
	});
});

// ==================== map ====================

describe("map", () => {
	it("maps value from one range to another", () => {
		expect(map(5, 0, 10, 0, 100)).toBe(50);
	});

	it("clamps output when value is below source range", () => {
		expect(map(-5, 0, 10, 0, 100)).toBe(0);
	});

	it("clamps output when value is above source range", () => {
		expect(map(15, 0, 10, 0, 100)).toBe(100);
	});

	it("handles inverted output range", () => {
		expect(map(0, 0, 10, 100, 0)).toBe(100);
		expect(map(10, 0, 10, 100, 0)).toBe(0);
	});

	it("clamps output for inverted range", () => {
		expect(map(-5, 0, 10, 100, 0)).toBe(100);
		expect(map(15, 0, 10, 100, 0)).toBe(0);
	});

	it("returns low2 when source range is degenerate", () => {
		expect(map(5, 3, 3, 10, 20)).toBe(10);
	});

	it("handles negative ranges", () => {
		expect(map(-5, -10, 0, 0, 100)).toBe(50);
	});

	it("maps boundary values", () => {
		expect(map(0, 0, 10, 0, 100)).toBe(0);
		expect(map(10, 0, 10, 0, 100)).toBe(100);
	});

	it("handles equal source and target ranges", () => {
		expect(map(7, 0, 10, 0, 10)).toBe(7);
	});
});

// ==================== threshold ====================

describe("threshold", () => {
	it("returns 0 when value magnitude is below cutoff", () => {
		expect(threshold(2, 5)).toBe(0);
	});

	it("returns 0 when negative value magnitude is below cutoff", () => {
		expect(threshold(-2, 5)).toBe(0);
	});

	it("returns value when above cutoff", () => {
		expect(threshold(10, 5)).toBe(10);
	});

	it("returns negative value when below negative cutoff", () => {
		expect(threshold(-10, 5)).toBe(-10);
	});

	it("returns value when value equals cutoff (strict <)", () => {
		expect(threshold(5, 5)).toBe(5);
	});

	it("returns value when absolute value equals cutoff (strict <)", () => {
		expect(threshold(-5, 5)).toBe(-5);
	});

	it("handles negative cutoff (Math.abs always non-negative)", () => {
		expect(threshold(3, -5)).toBe(3);
		expect(threshold(10, -5)).toBe(10);
	});

	it("handles zero cutoff", () => {
		expect(threshold(0, 0)).toBe(0);
	});

	it("handles zero value", () => {
		expect(threshold(0, 5)).toBe(0);
	});
});

// ==================== toDotted ====================

describe("toDotted", () => {
	it("formats small numbers without dots", () => {
		expect(toDotted(1)).toBe("1");
		expect(toDotted(99)).toBe("99");
	});

	it("adds dot for thousands", () => {
		expect(toDotted(1000)).toBe("1.000");
	});

	it("formats millions correctly", () => {
		expect(toDotted(1000000)).toBe("1.000.000");
	});

	it("formats billions correctly", () => {
		expect(toDotted(1000000000)).toBe("1.000.000.000");
	});

	it("handles negative numbers", () => {
		expect(toDotted(-1000)).toBe("-1.000");
		expect(toDotted(-1234567)).toBe("-1.234.567");
	});

	it("handles zero", () => {
		expect(toDotted(0)).toBe("0");
	});

	it("handles numbers with partial groups", () => {
		expect(toDotted(12345)).toBe("12.345");
		expect(toDotted(999)).toBe("999");
	});

	it("handles decimal numbers (only integer part dotted)", () => {
		expect(toDotted(1234.56)).toBe("1.234.56");
	});
});

// ==================== wrapValue ====================

describe("wrapValue", () => {
	it("wraps value into [min, max) range", () => {
		expect(wrapValue(15, 0, 10)).toBe(5);
	});

	it("passes through value already in range", () => {
		expect(wrapValue(5, 0, 10)).toBe(5);
	});

	it("wraps negative values", () => {
		expect(wrapValue(-5, 0, 10)).toBe(5);
	});

	it("handles negative range", () => {
		expect(wrapValue(-15, -20, -10)).toBe(-15);
	});

	it("wraps large positive values", () => {
		expect(wrapValue(25, 0, 10)).toBe(5);
	});

	it("wraps large negative values", () => {
		expect(wrapValue(-25, 0, 10)).toBe(5);
	});

	it("handles value at min boundary", () => {
		expect(wrapValue(0, 0, 10)).toBe(0);
	});

	it("handles value at max boundary (wraps to min)", () => {
		expect(wrapValue(10, 0, 10)).toBe(0);
	});

	it("handles equal min and max (range = 0, produces NaN)", () => {
		expect(wrapValue(5, 3, 3)).toBe(NaN);
	});

	it("works with negative min", () => {
		expect(wrapValue(5, -10, 0)).toBe(-5);
		expect(wrapValue(15, -10, 0)).toBe(-5);
	});
});
