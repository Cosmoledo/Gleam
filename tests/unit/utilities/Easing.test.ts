import { describe, expect, it } from "vitest";

// ==================== Imports ====================

import {
	easeIn,
	easeInOut,
	easeOut,
	EASINGS,
	linear,
} from "@/utilities/Easing";

// ==================== Endpoint invariants ====================

describe("easing endpoint invariants", () => {
	it("all easings map 0 → 0", () => {
		expect(easeIn(0)).toBe(0);
		expect(easeInOut(0)).toBe(0);
		expect(easeOut(0)).toBe(0);
		expect(linear(0)).toBe(0);
	});

	it("all easings map 1 → 1", () => {
		expect(easeIn(1)).toBe(1);
		expect(easeInOut(1)).toBe(1);
		expect(easeOut(1)).toBe(1);
		expect(linear(1)).toBe(1);
	});
});

// ==================== linear ====================

describe("linear", () => {
	it("is the identity", () => {
		expect(linear(0.25)).toBe(0.25);
		expect(linear(0.5)).toBe(0.5);
		expect(linear(0.75)).toBe(0.75);
	});
});

// ==================== easeIn ====================

describe("easeIn", () => {
	it("computes t²", () => {
		expect(easeIn(0.5)).toBe(0.25);
		expect(easeIn(0.1)).toBeCloseTo(0.01);
	});

	it("stays below linear in (0, 1) — slow start", () => {
		for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) {
			expect(easeIn(t)).toBeLessThan(t);
		}
	});
});

// ==================== easeOut ====================

describe("easeOut", () => {
	it("computes t(2 − t)", () => {
		expect(easeOut(0.5)).toBe(0.75);
		expect(easeOut(0.1)).toBeCloseTo(0.19);
	});

	it("stays above linear in (0, 1) — fast start", () => {
		for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) {
			expect(easeOut(t)).toBeGreaterThan(t);
		}
	});

	it("mirrors easeIn across t ↦ 1 − t", () => {
		for (const t of [0.1, 0.3, 0.5, 0.7, 0.9]) {
			expect(easeOut(t)).toBeCloseTo(1 - easeIn(1 - t));
		}
	});
});

// ==================== easeInOut ====================

describe("easeInOut", () => {
	it("passes through (0.5, 0.5)", () => {
		expect(easeInOut(0.5)).toBe(0.5);
	});

	it("uses the ease-in arm below 0.5", () => {
		expect(easeInOut(0.25)).toBe(2 * 0.25 * 0.25);
	});

	it("uses the ease-out arm above 0.5", () => {
		expect(easeInOut(0.75)).toBe(1 - 2 * 0.25 * 0.25);
	});

	it("is symmetric around (0.5, 0.5)", () => {
		for (const t of [0.1, 0.2, 0.3, 0.4]) {
			expect(easeInOut(t) + easeInOut(1 - t)).toBeCloseTo(1);
		}
	});
});

// ==================== monotonicity ====================

describe("monotonicity", () => {
	const SAMPLES = Array.from({ length: 21 }, (_, i) => i / 20);

	it.each([
		["linear", linear],
		["easeIn", easeIn],
		["easeOut", easeOut],
		["easeInOut", easeInOut],
	])("%s is non-decreasing on [0, 1]", (_name, fn) => {
		SAMPLES.forEach((t, i) => {
			if (i === 0) {
				return;
			}
			expect(fn(t)).toBeGreaterThanOrEqual(fn(SAMPLES[i - 1]));
		});
	});
});

// ==================== EASINGS lookup ====================

describe("EASINGS lookup", () => {
	it("maps each name to its function", () => {
		expect(EASINGS["linear"]).toBe(linear);
		expect(EASINGS["ease-in"]).toBe(easeIn);
		expect(EASINGS["ease-out"]).toBe(easeOut);
		expect(EASINGS["ease-in-out"]).toBe(easeInOut);
	});

	it("exposes exactly the four documented names", () => {
		expect(Object.keys(EASINGS).sort()).toEqual([
			"ease-in",
			"ease-in-out",
			"ease-out",
			"linear",
		]);
	});
});
