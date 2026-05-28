import { describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import { colorShifter } from "@/color/ColorShifter";

// ==================== colorShifter ====================

describe("colorShifter", () => {
	it("returns the CSS filter chain without the 'filter:' prefix or trailing ';'", () => {
		const result = colorShifter([255, 0, 0]);
		expect(result.startsWith("filter:")).toBe(false);
		expect(result.endsWith(";")).toBe(false);
	});

	it("includes every CSS filter function used by the solver", () => {
		const result = colorShifter([200, 50, 100]);
		expect(result).toContain("invert(");
		expect(result).toContain("sepia(");
		expect(result).toContain("saturate(");
		expect(result).toContain("hue-rotate(");
		expect(result).toContain("brightness(");
		expect(result).toContain("contrast(");
	});

	it("formats invert/sepia/saturate/brightness/contrast as integer percentages", () => {
		const result = colorShifter([10, 20, 30]);
		expect(result).toMatch(/invert\(\d+%\)/);
		expect(result).toMatch(/sepia\(\d+%\)/);
		expect(result).toMatch(/saturate\(\d+%\)/);
		expect(result).toMatch(/brightness\(\d+%\)/);
		expect(result).toMatch(/contrast\(\d+%\)/);
	});

	it("formats hue-rotate as an integer degree value", () => {
		const result = colorShifter([10, 20, 30]);
		expect(result).toMatch(/hue-rotate\(-?\d+deg\)/);
	});

	it("returns a filter even when the SPSA solver can't converge below the threshold", () => {
		// With deterministic Math.random, SPSA stops exploring and the solver
		// can't reach loss <= 25 in one pass — exercises the retry loop in
		// solveWide where the second iteration matches the first's best loss.
		const spy = vi.spyOn(Math, "random").mockReturnValue(0);
		try {
			const result = colorShifter([255, 0, 255]);
			expect(result).toContain("invert(");
			expect(result).toContain("hue-rotate(");
		} finally {
			spy.mockRestore();
		}
	});
});
