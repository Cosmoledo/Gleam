import { describe, it, expect } from "vitest";

// ==================== Imports ====================

import {
	rgb2hex,
	rgb2Int,
	hex2rgb,
	hue2rgb,
	randomHex,
	randomRgb,
} from "@/utilities/Color";

// ==================== rgb2hex ====================

describe("rgb2hex", () => {
	it("converts black to #000000", () => {
		expect(rgb2hex(0, 0, 0)).toBe("#000000");
	});

	it("converts white to #ffffff", () => {
		expect(rgb2hex(255, 255, 255)).toBe("#ffffff");
	});

	it("converts red to #ff0000", () => {
		expect(rgb2hex(255, 0, 0)).toBe("#ff0000");
	});

	it("converts green to #00ff00", () => {
		expect(rgb2hex(0, 255, 0)).toBe("#00ff00");
	});

	it("converts blue to #0000ff", () => {
		expect(rgb2hex(0, 0, 255)).toBe("#0000ff");
	});

	it("converts yellow to #ffff00", () => {
		expect(rgb2hex(255, 255, 0)).toBe("#ffff00");
	});

	it("converts magenta to #ff00ff", () => {
		expect(rgb2hex(255, 0, 255)).toBe("#ff00ff");
	});

	it("converts cyan to #00ffff", () => {
		expect(rgb2hex(0, 255, 255)).toBe("#00ffff");
	});

	it("converts mid-gray to #808080", () => {
		expect(rgb2hex(128, 128, 128)).toBe("#808080");
	});

	it("converts dark gray to #404040", () => {
		expect(rgb2hex(64, 64, 64)).toBe("#404040");
	});

	it("converts light gray to #bfbfbf", () => {
		expect(rgb2hex(191, 191, 191)).toBe("#bfbfbf");
	});
});

// ==================== rgb2Int ====================

describe("rgb2Int", () => {
	it("converts black to 0", () => {
		expect(rgb2Int(0, 0, 0)).toBe(0);
	});

	it("converts white to 0xffffff", () => {
		expect(rgb2Int(255, 255, 255)).toBe(0xffffff);
	});

	it("converts red to 0xff0000", () => {
		expect(rgb2Int(255, 0, 0)).toBe(0xff0000);
	});

	it("converts green to 0xff00", () => {
		expect(rgb2Int(0, 255, 0)).toBe(0xff00);
	});

	it("converts blue to 0xff", () => {
		expect(rgb2Int(0, 0, 255)).toBe(0xff);
	});

	it("converts mid-gray to 0x808080", () => {
		expect(rgb2Int(128, 128, 128)).toBe(0x808080);
	});

	it("includes alpha channel when provided", () => {
		// alpha 1 = 255 = 0xff
		expect(rgb2Int(255, 0, 0, 1)).toBe(
			((0xff << 24) | (0 << 16) | (0 << 8) | 0xff) >>> 0,
		);
	});

	it("clamps alpha to 0", () => {
		expect(rgb2Int(0, 255, 0, 0)).toBe(
			(0 << 24) | (0xff << 16) | (0 << 8) | 0,
		);
	});

	it("rounds alpha correctly", () => {
		// alpha 0.5 rounds to 128 = 0x80
		const result = rgb2Int(0, 0, 255, 0.5);
		expect(result).toBe((0 << 24) | (0 << 16) | (0xff << 8) | 0x80);
	});

	it("returns unsigned 32-bit value", () => {
		const result = rgb2Int(255, 255, 255, 1);
		expect(result >>> 0).toBe(result);
		expect(result).toBe(0xffffffff);
	});
});

// ==================== hex2rgb ====================

describe("hex2rgb", () => {
	it("converts #000000 to [0, 0, 0]", () => {
		expect(hex2rgb("#000000")).toEqual([0, 0, 0]);
	});

	it("converts #ffffff to [255, 255, 255]", () => {
		expect(hex2rgb("#ffffff")).toEqual([255, 255, 255]);
	});

	it("converts #ff0000 to [255, 0, 0]", () => {
		expect(hex2rgb("#ff0000")).toEqual([255, 0, 0]);
	});

	it("converts #00ff00 to [0, 255, 0]", () => {
		expect(hex2rgb("#00ff00")).toEqual([0, 255, 0]);
	});

	it("converts #0000ff to [0, 0, 255]", () => {
		expect(hex2rgb("#0000ff")).toEqual([0, 0, 255]);
	});

	it("converts #ffff00 to [255, 255, 0]", () => {
		expect(hex2rgb("#ffff00")).toEqual([255, 255, 0]);
	});

	it("converts #808080 to [128, 128, 128]", () => {
		expect(hex2rgb("#808080")).toEqual([128, 128, 128]);
	});

	it("converts #404040 to [64, 64, 64]", () => {
		expect(hex2rgb("#404040")).toEqual([64, 64, 64]);
	});

	it("converts #bfbfbf to [191, 191, 191]", () => {
		expect(hex2rgb("#bfbfbf")).toEqual([191, 191, 191]);
	});

	it("converts uppercase hex", () => {
		expect(hex2rgb("#FF00AA")).toEqual([255, 0, 170]);
	});

	it("converts mixed case hex", () => {
		expect(hex2rgb("#Ff00aA")).toEqual([255, 0, 170]);
	});

	it("converts #rgb shorthand to #rrggbb", () => {
		expect(hex2rgb("#f0a")).toEqual([255, 0, 170]);
	});

	it("converts #000 shorthand to [0, 0, 0]", () => {
		expect(hex2rgb("#000")).toEqual([0, 0, 0]);
	});

	it("converts #fff shorthand to [255, 255, 255]", () => {
		expect(hex2rgb("#fff")).toEqual([255, 255, 255]);
	});

	it("converts #abc shorthand to [170, 187, 204]", () => {
		expect(hex2rgb("#abc")).toEqual([170, 187, 204]);
	});
});

// ==================== hue2rgb ====================

describe("hue2rgb", () => {
	it("handles negative t by wrapping", () => {
		expect(hue2rgb(0.5, 0.8, -0.1)).toBe(hue2rgb(0.5, 0.8, 0.9));
	});

	it("handles t > 1 by wrapping", () => {
		expect(hue2rgb(0.5, 0.8, 1.1)).toBeCloseTo(hue2rgb(0.5, 0.8, 0.1), 10);
	});

	it("returns p when t = 0", () => {
		expect(hue2rgb(0.3, 0.8, 0)).toBe(0.3);
	});

	it("returns q when t is between 1/6 and 1/2", () => {
		expect(hue2rgb(0.3, 0.8, 0.25)).toBe(0.8);
	});

	it("returns p when t >= 2/3", () => {
		expect(hue2rgb(0.3, 0.8, 0.7)).toBe(0.3);
	});

	it("returns p when t = 1", () => {
		expect(hue2rgb(0.3, 0.8, 1)).toBe(0.3);
	});

	it("computes linear interpolation in first segment", () => {
		// t = 1/12 is in [0, 1/6), so p + (q - p) * 6 * t
		// p=0.2, q=0.6, t=1/12 => 0.2 + 0.4 * 6 * (1/12) = 0.2 + 0.2 = 0.4
		expect(hue2rgb(0.2, 0.6, 1 / 12)).toBeCloseTo(0.4, 10);
	});

	it("computes reverse interpolation in last segment", () => {
		// t = 5/6 is in [2/3, ...], so returns p
		// p=0.2, q=0.6, t=5/6 => returns 0.2
		expect(hue2rgb(0.2, 0.6, 5 / 6)).toBeCloseTo(0.2, 10);
	});

	it("computes reverse interpolation in fourth segment", () => {
		// t = 0.6 is in [1/2, 2/3), so p + (q - p) * (2/3 - t) * 6
		// p=0.2, q=0.6, t=0.6 => 0.2 + 0.4 * (0.6667 - 0.6) * 6 = 0.2 + 0.4 * 0.0667 * 6 = 0.2 + 0.16 = 0.36
		expect(hue2rgb(0.2, 0.6, 0.6)).toBeCloseTo(0.36, 10);
	});
});

// ==================== randomHex ====================

describe("randomHex", () => {
	it("returns a string matching #xxxx format", () => {
		for (let i = 0; i < 20; i++) {
			const result = randomHex();
			expect(result).toMatch(/^#[a-f\d]{4}$/);
		}
	});

	it("returns different values on successive calls", () => {
		const results = new Set<string>();
		for (let i = 0; i < 100; i++) {
			results.add(randomHex());
		}
		expect(results.size).toBeGreaterThan(50);
	});

	it("always returns 5 characters (# + 4 hex digits)", () => {
		for (let i = 0; i < 20; i++) {
			expect(randomHex().length).toBe(5);
		}
	});
});

// ==================== randomRgb ====================

describe("randomRgb", () => {
	it("returns an array of 3 numbers", () => {
		const result = randomRgb();
		expect(result).toHaveLength(3);
		expect(typeof result[0]).toBe("number");
		expect(typeof result[1]).toBe("number");
		expect(typeof result[2]).toBe("number");
	});

	it("returns values in default range [0, 255]", () => {
		for (let i = 0; i < 50; i++) {
			const result = randomRgb();
			expect(result[0]).toBeGreaterThanOrEqual(0);
			expect(result[0]).toBeLessThanOrEqual(255);
			expect(result[1]).toBeGreaterThanOrEqual(0);
			expect(result[1]).toBeLessThanOrEqual(255);
			expect(result[2]).toBeGreaterThanOrEqual(0);
			expect(result[2]).toBeLessThanOrEqual(255);
		}
	});

	it("respects custom min/max range", () => {
		for (let i = 0; i < 50; i++) {
			const result = randomRgb(100, 200);
			expect(result[0]).toBeGreaterThanOrEqual(100);
			expect(result[0]).toBeLessThanOrEqual(200);
			expect(result[1]).toBeGreaterThanOrEqual(100);
			expect(result[1]).toBeLessThanOrEqual(200);
			expect(result[2]).toBeGreaterThanOrEqual(100);
			expect(result[2]).toBeLessThanOrEqual(200);
		}
	});

	it("returns same value when min equals max", () => {
		for (let i = 0; i < 20; i++) {
			expect(randomRgb(42, 42)).toEqual([42, 42, 42]);
		}
	});

	it("handles negative range", () => {
		// min=-10, max=10 — should still produce values in range
		for (let i = 0; i < 50; i++) {
			const result = randomRgb(-10, 10);
			expect(result[0]).toBeGreaterThanOrEqual(-10);
			expect(result[0]).toBeLessThanOrEqual(10);
			expect(result[1]).toBeGreaterThanOrEqual(-10);
			expect(result[1]).toBeLessThanOrEqual(10);
			expect(result[2]).toBeGreaterThanOrEqual(-10);
			expect(result[2]).toBeLessThanOrEqual(10);
		}
	});

	it("can produce all values in a small range", () => {
		const results = new Set<number>();
		for (let i = 0; i < 500; i++) {
			const r = randomRgb(0, 3);
			results.add(r[0]);
		}
		// With 500 draws from 4 values, should see all of them
		expect(results.size).toBe(4);
	});
});
