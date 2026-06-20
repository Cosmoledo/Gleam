import { describe, expect, it } from "vitest";

// ==================== Imports ====================

import Color from "@/color/Color";

// ==================== Color.fromHex ====================

describe("Color.fromHex", () => {
	it("parses #000000 to black", () => {
		const c = Color.fromHex("#000000");
		expect(c.r).toBe(0);
		expect(c.g).toBe(0);
		expect(c.b).toBe(0);
		expect(c.alpha).toBe(1);
	});

	it("parses #ffffff to white", () => {
		const c = Color.fromHex("#ffffff");
		expect(c.r).toBe(255);
		expect(c.g).toBe(255);
		expect(c.b).toBe(255);
	});

	it("parses #ff0000 to red", () => {
		const c = Color.fromHex("#ff0000");
		expect(c.r).toBe(255);
		expect(c.g).toBe(0);
		expect(c.b).toBe(0);
	});

	it("parses #00ff00 to green", () => {
		const c = Color.fromHex("#00ff00");
		expect(c.r).toBe(0);
		expect(c.g).toBe(255);
		expect(c.b).toBe(0);
	});

	it("parses #0000ff to blue", () => {
		const c = Color.fromHex("#0000ff");
		expect(c.r).toBe(0);
		expect(c.g).toBe(0);
		expect(c.b).toBe(255);
	});

	it("parses uppercase hex", () => {
		const c = Color.fromHex("#FF00AA");
		expect(c.r).toBe(255);
		expect(c.g).toBe(0);
		expect(c.b).toBe(170);
	});

	it("parses mixed case hex", () => {
		const c = Color.fromHex("#Ff00aA");
		expect(c.r).toBe(255);
		expect(c.g).toBe(0);
		expect(c.b).toBe(170);
	});

	it("parses #rgb shorthand", () => {
		const c = Color.fromHex("#f0a");
		expect(c.r).toBe(255);
		expect(c.g).toBe(0);
		expect(c.b).toBe(170);
	});

	it("parses #abc shorthand", () => {
		const c = Color.fromHex("#abc");
		expect(c.r).toBe(170);
		expect(c.g).toBe(187);
		expect(c.b).toBe(204);
	});

	it("parses hex without leading #", () => {
		const c = Color.fromHex("808080");
		expect(c.r).toBe(128);
		expect(c.g).toBe(128);
		expect(c.b).toBe(128);
	});

	it("parses 8-digit hex with fully-opaque alpha", () => {
		const c = Color.fromHex("#000000ff");
		expect(c.r).toBe(0);
		expect(c.g).toBe(0);
		expect(c.b).toBe(0);
		expect(c.alpha).toBe(1);
	});

	it("parses 8-digit hex with zero alpha", () => {
		const c = Color.fromHex("#ffffff00");
		expect(c.r).toBe(255);
		expect(c.g).toBe(255);
		expect(c.b).toBe(255);
		expect(c.alpha).toBe(0);
	});

	it("parses 8-digit hex with partial alpha (0x80 → ~0.502)", () => {
		const c = Color.fromHex("#ff000080");
		expect(c.alpha).toBeCloseTo(128 / 255, 5);
	});

	it("round-trips with toHex for an 8-digit value", () => {
		expect(Color.fromHex("#abcdef80").toHex()).toBe("#abcdef80");
	});

	it("throws on invalid length", () => {
		expect(() => Color.fromHex("#12345")).toThrow(/Invalid hex color/);
	});

	it("throws on empty input", () => {
		expect(() => Color.fromHex("")).toThrow(/Invalid hex color/);
	});

	it("throws on non-hex characters", () => {
		expect(() => Color.fromHex("#GGGGGG")).toThrow(/Invalid hex color/);
	});

	it("throws on partial-hex with bad char in shorthand", () => {
		expect(() => Color.fromHex("#fzz")).toThrow(/Invalid hex color/);
	});
});

// ==================== Color.fromHSL ====================

describe("Color.fromHSL", () => {
	it("returns black for l=0", () => {
		const c = Color.fromHSL(0, 100, 0);
		expect(c.r).toBe(0);
		expect(c.g).toBe(0);
		expect(c.b).toBe(0);
	});

	it("returns white for l=100", () => {
		const c = Color.fromHSL(0, 100, 100);
		expect(c.r).toBe(255);
		expect(c.g).toBe(255);
		expect(c.b).toBe(255);
	});

	it("returns red for h=0, s=100, l=50", () => {
		const c = Color.fromHSL(0, 100, 50);
		expect(c.r).toBe(255);
		expect(c.g).toBe(0);
		expect(c.b).toBe(0);
	});

	it("returns green for h=120", () => {
		const c = Color.fromHSL(120, 100, 50);
		expect(c.r).toBe(0);
		expect(c.g).toBe(255);
		expect(c.b).toBe(0);
	});

	it("returns blue for h=240", () => {
		const c = Color.fromHSL(240, 100, 50);
		expect(c.r).toBe(0);
		expect(c.g).toBe(0);
		expect(c.b).toBe(255);
	});

	it("returns mid-gray for s=0, l=50", () => {
		const c = Color.fromHSL(0, 0, 50);
		expect(c.r).toBe(127.5);
		expect(c.g).toBe(127.5);
		expect(c.b).toBe(127.5);
	});

	it("returns same gray for any hue when s=0", () => {
		const a = Color.fromHSL(0, 0, 25);
		const b = Color.fromHSL(180, 0, 25);
		expect(a.r).toBe(b.r);
		expect(a.g).toBe(b.g);
		expect(a.b).toBe(b.b);
	});

	it("returns yellow for h=60", () => {
		const c = Color.fromHSL(60, 100, 50);
		// the t = 1/2 branch of hue2rgb introduces sub-LSB drift on r/g
		expect(c.r).toBeCloseTo(255, 5);
		expect(c.g).toBeCloseTo(255, 5);
		expect(c.b).toBe(0);
	});

	it("computes high-lightness branch (l > 0.5)", () => {
		// covers the `lNorm >= 0.5` branch of the q calculation
		const c = Color.fromHSL(0, 50, 75);
		expect(c.r).toBeCloseTo(223.125, 3);
		expect(c.g).toBeCloseTo(159.375, 3);
		expect(c.b).toBeCloseTo(159.375, 3);
	});

	it("defaults alpha to 1 when omitted", () => {
		const c = Color.fromHSL(120, 100, 50);
		expect(c.alpha).toBe(1);
	});

	it("accepts alpha argument", () => {
		const c = Color.fromHSL(120, 100, 50, 0.4);
		expect(c.alpha).toBeCloseTo(0.4);
	});
});

// ==================== Constructor / set ====================

describe("constructor", () => {
	it("stores r, g, b", () => {
		const c = new Color(10, 20, 30);
		expect(c.r).toBe(10);
		expect(c.g).toBe(20);
		expect(c.b).toBe(30);
	});

	it("defaults alpha to 1", () => {
		const c = new Color(10, 20, 30);
		expect(c.alpha).toBe(1);
	});

	it("accepts custom alpha", () => {
		const c = new Color(10, 20, 30, 0.5);
		expect(c.alpha).toBe(0.5);
	});

	it("preserves non-integer channels", () => {
		const c = new Color(10.4, 20.6, 30.5);
		expect(c.r).toBe(10.4);
		expect(c.g).toBe(20.6);
		expect(c.b).toBe(30.5);
	});

	it("clamps channels above 255", () => {
		const c = new Color(300, 500, 1000);
		expect(c.r).toBe(255);
		expect(c.g).toBe(255);
		expect(c.b).toBe(255);
	});

	it("clamps channels below 0", () => {
		const c = new Color(-10, -20, -30);
		expect(c.r).toBe(0);
		expect(c.g).toBe(0);
		expect(c.b).toBe(0);
	});

	it("clamps alpha above 1", () => {
		const c = new Color(0, 0, 0, 5);
		expect(c.alpha).toBe(1);
	});

	it("clamps alpha below 0", () => {
		const c = new Color(0, 0, 0, -1);
		expect(c.alpha).toBe(0);
	});
});

describe("set", () => {
	it("overwrites r, g, b", () => {
		const c = new Color(10, 20, 30);
		c.set(100, 110, 120);
		expect(c.r).toBe(100);
		expect(c.g).toBe(110);
		expect(c.b).toBe(120);
	});

	it("leaves alpha untouched when not provided", () => {
		const c = new Color(0, 0, 0, 0.5);
		c.set(255, 255, 255);
		expect(c.alpha).toBe(0.5);
	});

	it("overwrites alpha when provided", () => {
		const c = new Color(0, 0, 0, 1);
		c.set(0, 0, 0, 0.25);
		expect(c.alpha).toBe(0.25);
	});
});

// ==================== brightness ====================

describe("brightness", () => {
	it("doubles channels with factor 2 (clamping to 255)", () => {
		const c = new Color(50, 100, 150);
		c.brightness(2);
		expect(c.r).toBe(100);
		expect(c.g).toBe(200);
		expect(c.b).toBe(255);
	});

	it("halves channels with factor 0.5", () => {
		const c = new Color(100, 200, 50);
		c.brightness(0.5);
		expect(c.r).toBe(50);
		expect(c.g).toBe(100);
		expect(c.b).toBe(25);
	});

	it("zeroes channels with factor 0", () => {
		const c = new Color(100, 200, 50);
		c.brightness(0);
		expect(c.r).toBe(0);
		expect(c.g).toBe(0);
		expect(c.b).toBe(0);
	});

	it("leaves channels unchanged with factor 1", () => {
		const c = new Color(100, 200, 50);
		c.brightness(1);
		expect(c.r).toBe(100);
		expect(c.g).toBe(200);
		expect(c.b).toBe(50);
	});
});

// ==================== contrast ====================

describe("contrast", () => {
	it("leaves channels unchanged with factor 1", () => {
		const c = new Color(50, 128, 200);
		c.contrast(1);
		expect(c.r).toBe(50);
		expect(c.g).toBe(128);
		expect(c.b).toBe(200);
	});

	it("collapses to midtone with factor 0", () => {
		const c = new Color(0, 128, 255);
		c.contrast(0);
		expect(c.r).toBe(127.5);
		expect(c.g).toBe(127.5);
		expect(c.b).toBe(127.5);
	});

	it("pushes channels away from midtone with factor > 1", () => {
		const c = new Color(100, 128, 200);
		c.contrast(2);
		// 127.5 + (100-127.5)*2 = 72.5
		// 127.5 + (128-127.5)*2 = 128.5
		// 127.5 + (200-127.5)*2 = 272.5 → clamp to 255
		expect(c.r).toBe(72.5);
		expect(c.g).toBe(128.5);
		expect(c.b).toBe(255);
	});
});

// ==================== grayscale ====================

describe("grayscale", () => {
	it("leaves channels unchanged with value 0", () => {
		const c = new Color(123, 45, 200);
		c.grayscale(0);
		expect(c.r).toBe(123);
		expect(c.g).toBe(45);
		expect(c.b).toBe(200);
	});

	it("collapses r=g=b with value 1 (default)", () => {
		const c = new Color(123, 45, 200);
		c.grayscale();
		expect(c.r).toBe(c.g);
		expect(c.g).toBe(c.b);
	});

	it("applies BT.709 luminance with value 1", () => {
		const c = new Color(100, 150, 200);
		c.grayscale(1);
		// luminance = 0.2126*100 + 0.7152*150 + 0.0722*200 = 142.98
		expect(c.r).toBeCloseTo(142.98, 2);
		expect(c.g).toBeCloseTo(142.98, 2);
		expect(c.b).toBeCloseTo(142.98, 2);
	});
});

// ==================== hueRotate ====================

describe("hueRotate", () => {
	it("leaves channels unchanged with 0 radians", () => {
		const c = new Color(200, 100, 50);
		c.hueRotate(0);
		expect(c.r).toBe(200);
		expect(c.g).toBe(100);
		expect(c.b).toBe(50);
	});

	it("leaves channels approximately unchanged with 2π radians", () => {
		const c = new Color(200, 100, 50);
		c.hueRotate(Math.PI * 2);
		// matrix at full rotation matches 0 up to floating-point + rounding
		expect(c.r).toBeCloseTo(200, 0);
		expect(c.g).toBeCloseTo(100, 0);
		expect(c.b).toBeCloseTo(50, 0);
	});

	it("rotates red toward green-ish at 2π/3 radians", () => {
		const c = new Color(255, 0, 0);
		c.hueRotate((Math.PI * 2) / 3);
		// the matrix is approximate (not a true HSL rotation), but green should dominate
		expect(c.g).toBeGreaterThan(c.r);
		expect(c.g).toBeGreaterThan(c.b);
	});
});

// ==================== invert ====================

describe("invert", () => {
	it("fully inverts with factor 1 (default)", () => {
		const c = new Color(10, 100, 200);
		c.invert();
		expect(c.r).toBe(245);
		expect(c.g).toBe(155);
		expect(c.b).toBe(55);
	});

	it("leaves channels unchanged with factor 0", () => {
		const c = new Color(10, 100, 200);
		c.invert(0);
		expect(c.r).toBe(10);
		expect(c.g).toBe(100);
		expect(c.b).toBe(200);
	});

	it("collapses to midtone with factor 0.5 for channel = 0", () => {
		const c = new Color(0, 0, 0);
		c.invert(0.5);
		// 0 * 0.5 + 255 * 0.5 = 127.5
		expect(c.r).toBe(127.5);
		expect(c.g).toBe(127.5);
		expect(c.b).toBe(127.5);
	});
});

// ==================== mix ====================

describe("mix", () => {
	it("leaves channels unchanged with amount 0", () => {
		const a = new Color(50, 100, 150);
		const b = new Color(200, 200, 200);
		a.mix(b, 0);
		expect(a.r).toBe(50);
		expect(a.g).toBe(100);
		expect(a.b).toBe(150);
	});

	it("becomes the other color with amount 1", () => {
		const a = new Color(50, 100, 150);
		const b = new Color(200, 210, 220, 0.4);
		a.mix(b, 1);
		expect(a.r).toBe(200);
		expect(a.g).toBe(210);
		expect(a.b).toBe(220);
		expect(a.alpha).toBeCloseTo(0.4);
	});

	it("averages channels at amount 0.5", () => {
		const a = new Color(0, 0, 0);
		const b = new Color(200, 100, 50);
		a.mix(b, 0.5);
		expect(a.r).toBe(100);
		expect(a.g).toBe(50);
		expect(a.b).toBe(25);
	});

	it("mixes alpha proportionally", () => {
		const a = new Color(0, 0, 0, 1);
		const b = new Color(0, 0, 0, 0);
		a.mix(b, 0.5);
		expect(a.alpha).toBeCloseTo(0.5);
	});
});

// ==================== round ====================

describe("round", () => {
	it("rounds non-integer channels to nearest integer", () => {
		const c = new Color(10.4, 20.6, 30.5);
		c.round();
		expect(c.r).toBe(10);
		expect(c.g).toBe(21);
		expect(c.b).toBe(31);
	});

	it("leaves integer channels unchanged", () => {
		const c = new Color(50, 100, 150);
		c.round();
		expect(c.r).toBe(50);
		expect(c.g).toBe(100);
		expect(c.b).toBe(150);
	});

	it("leaves alpha untouched", () => {
		const c = new Color(0, 0, 0, 0.5);
		c.round();
		expect(c.alpha).toBe(0.5);
	});

	it("returns this for chaining", () => {
		const c = new Color(10.5, 20.5, 30.5);
		expect(c.round()).toBe(c);
	});
});

// ==================== saturate ====================

describe("saturate", () => {
	it("leaves channels unchanged with value 1 (default)", () => {
		const c = new Color(123, 45, 200);
		c.saturate();
		expect(c.r).toBe(123);
		expect(c.g).toBe(45);
		expect(c.b).toBe(200);
	});

	it("desaturates to luminance with value 0", () => {
		const c = new Color(100, 150, 200);
		c.saturate(0);
		// at value=0 the matrix collapses to (0.213, 0.715, 0.072) — CSS-spec rounded
		// BT.709 row: 100*0.213 + 150*0.715 + 200*0.072 = 142.95
		expect(c.r).toBeCloseTo(142.95, 2);
		expect(c.g).toBeCloseTo(142.95, 2);
		expect(c.b).toBeCloseTo(142.95, 2);
	});
});

// ==================== sepia ====================

describe("sepia", () => {
	it("leaves channels unchanged with value 0", () => {
		const c = new Color(123, 45, 200);
		c.sepia(0);
		expect(c.r).toBe(123);
		expect(c.g).toBe(45);
		expect(c.b).toBe(200);
	});

	it("applies sepia matrix with value 1 (default)", () => {
		const c = new Color(100, 150, 200);
		c.sepia();
		// r = 0.393*100 + 0.769*150 + 0.189*200 = 39.3 + 115.35 + 37.8 = 192.45
		// g = 0.349*100 + 0.686*150 + 0.168*200 = 34.9 + 102.9 + 33.6 = 171.4
		// b = 0.272*100 + 0.534*150 + 0.131*200 = 27.2 + 80.1 + 26.2 = 133.5
		expect(c.r).toBeCloseTo(192.45, 2);
		expect(c.g).toBeCloseTo(171.4, 2);
		expect(c.b).toBeCloseTo(133.5, 2);
	});

	it("tints white toward yellow (drops b below 255) with value 1", () => {
		// r and g rows sum > 1 so both clamp to 255; only b stays below
		const c = new Color(255, 255, 255);
		c.sepia();
		expect(c.r).toBe(255);
		expect(c.g).toBe(255);
		expect(c.b).toBeLessThan(255);
	});
});

// ==================== shade ====================

describe("shade", () => {
	it("leaves channels unchanged with percent 0", () => {
		const c = new Color(100, 150, 200);
		c.shade(0);
		expect(c.r).toBe(100);
		expect(c.g).toBe(150);
		expect(c.b).toBe(200);
	});

	it("moves channels toward white with positive percent", () => {
		const c = new Color(100, 150, 200);
		c.shade(0.5);
		// target = 255, p = 0.5: 100 + (255-100)*0.5 = 177.5
		expect(c.r).toBe(177.5);
		expect(c.g).toBe(202.5);
		expect(c.b).toBe(227.5);
	});

	it("moves channels toward black with negative percent", () => {
		const c = new Color(100, 150, 200);
		c.shade(-0.5);
		// target = 0, p = 0.5: 100 + (0-100)*0.5 = 50
		expect(c.r).toBe(50);
		expect(c.g).toBe(75);
		expect(c.b).toBe(100);
	});

	it("reaches white at percent 1", () => {
		const c = new Color(100, 150, 200);
		c.shade(1);
		expect(c.r).toBe(255);
		expect(c.g).toBe(255);
		expect(c.b).toBe(255);
	});

	it("reaches black at percent -1", () => {
		const c = new Color(100, 150, 200);
		c.shade(-1);
		expect(c.r).toBe(0);
		expect(c.g).toBe(0);
		expect(c.b).toBe(0);
	});
});

// ==================== toHSLObject ====================

describe("toHSLObject", () => {
	it("returns h=0, s=0 for black", () => {
		const { h, s, l } = new Color(0, 0, 0).toHSLObject();
		expect(h).toBe(0);
		expect(s).toBe(0);
		expect(l).toBe(0);
	});

	it("returns h=0, s=0 for white", () => {
		const { h, s, l } = new Color(255, 255, 255).toHSLObject();
		expect(h).toBe(0);
		expect(s).toBe(0);
		expect(l).toBe(100);
	});

	it("returns h=0, s=0 for mid-gray", () => {
		const { h, s, l } = new Color(128, 128, 128).toHSLObject();
		expect(h).toBe(0);
		expect(s).toBe(0);
		expect(l).toBeCloseTo(50.2, 1);
	});

	it("returns h=0 for pure red", () => {
		const { h, s, l } = new Color(255, 0, 0).toHSLObject();
		expect(h).toBe(0);
		expect(s).toBe(100);
		expect(l).toBe(50);
	});

	it("returns h=120 for pure green", () => {
		const { h, s, l } = new Color(0, 255, 0).toHSLObject();
		expect(h).toBe(120);
		expect(s).toBe(100);
		expect(l).toBe(50);
	});

	it("returns h=240 for pure blue", () => {
		const { h, s, l } = new Color(0, 0, 255).toHSLObject();
		expect(h).toBe(240);
		expect(s).toBe(100);
		expect(l).toBe(50);
	});

	it("returns h ~= 300 (g < b branch) for magenta-ish input", () => {
		// red is max and b > g triggers the `g < b ? 6 : 0` offset
		const { h } = new Color(200, 0, 100).toHSLObject();
		expect(h).toBeGreaterThan(300);
		expect(h).toBeLessThan(360);
	});

	it("uses the high-lightness branch of saturation (l > 0.5)", () => {
		// light pink: l > 50, exercises s = d / (2 - max - min)
		const { s, l } = new Color(255, 200, 200).toHSLObject();
		expect(l).toBeGreaterThan(50);
		expect(s).toBe(100);
	});

	it("returns alpha from the Color", () => {
		const { a } = new Color(255, 0, 0, 0.3).toHSLObject();
		expect(a).toBeCloseTo(0.3);
	});

	it("round-trips alpha through fromHSL → hsl", () => {
		const c = Color.fromHSL(180, 50, 50, 0.7);
		const { a } = c.toHSLObject();
		expect(a).toBeCloseTo(0.7);
	});
});

// ==================== toRGB ====================

describe("toRGB", () => {
	it("uses rgb(...) when alpha = 1", () => {
		expect(new Color(10, 20, 30).toRGB()).toBe("rgb(10, 20, 30)");
	});

	it("uses rgba(...) with 2-decimal alpha when alpha < 1", () => {
		expect(new Color(10, 20, 30, 0.5).toRGB()).toBe(
			"rgba(10, 20, 30, 0.50)",
		);
	});

	it("uses rgba(...) when alpha = 0", () => {
		expect(new Color(10, 20, 30, 0).toRGB()).toBe("rgba(10, 20, 30, 0.00)");
	});

	it("uses post-clamp channel values", () => {
		expect(new Color(-5, 300, 128).toRGB()).toBe("rgb(0, 255, 128)");
	});
});

// ==================== toHex ====================

describe("toHex", () => {
	it("omits alpha when alpha = 1", () => {
		expect(new Color(0, 0, 0).toHex()).toBe("#000000");
	});

	it("returns #ffffff for white", () => {
		expect(new Color(255, 255, 255).toHex()).toBe("#ffffff");
	});

	it("returns #ff0000 for red", () => {
		expect(new Color(255, 0, 0).toHex()).toBe("#ff0000");
	});

	it("pads single-digit channel values", () => {
		expect(new Color(1, 2, 3).toHex()).toBe("#010203");
	});

	it("appends 8-bit alpha when alpha < 1", () => {
		expect(new Color(255, 0, 0, 0.5).toHex()).toBe("#ff000080");
	});

	it("appends 00 alpha when alpha = 0", () => {
		expect(new Color(255, 0, 0, 0).toHex()).toBe("#ff000000");
	});

	it("round-trips with fromHex for opaque colors", () => {
		const c = Color.fromHex("#abcdef");
		expect(c.toHex()).toBe("#abcdef");
	});
});

// ==================== toHSL ====================

describe("toHSL", () => {
	it("uses hsl(...) when alpha = 1", () => {
		expect(new Color(255, 0, 0).toHSL()).toBe("hsl(0, 100%, 50%)");
	});

	it("uses hsla(...) when alpha < 1", () => {
		expect(new Color(255, 0, 0, 0.5).toHSL()).toBe(
			"hsla(0, 100%, 50%, 0.50)",
		);
	});

	it("rounds h, s, l to integers", () => {
		const css = new Color(128, 128, 128).toHSL();
		expect(css).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
	});
});

// ==================== clone ====================

describe("clone", () => {
	it("produces equal channel values", () => {
		const a = new Color(10, 20, 30, 0.7);
		const b = a.clone();
		expect(b.r).toBe(a.r);
		expect(b.g).toBe(a.g);
		expect(b.b).toBe(a.b);
		expect(b.alpha).toBe(a.alpha);
	});

	it("returns an independent instance", () => {
		const a = new Color(10, 20, 30);
		const b = a.clone();
		b.set(99, 99, 99);
		expect(a.r).toBe(10);
		expect(a.g).toBe(20);
		expect(a.b).toBe(30);
	});
});

// ==================== equals ====================

describe("equals", () => {
	it("returns true for identical channels and alpha", () => {
		const a = new Color(10, 20, 30, 0.5);
		const b = new Color(10, 20, 30, 0.5);
		expect(a.equals(b)).toBe(true);
	});

	it("returns true for clone", () => {
		const a = new Color(10, 20, 30, 0.7);
		expect(a.equals(a.clone())).toBe(true);
	});

	it("returns false when r differs", () => {
		expect(new Color(10, 20, 30).equals(new Color(11, 20, 30))).toBe(false);
	});

	it("returns false when alpha differs", () => {
		expect(
			new Color(10, 20, 30, 0.5).equals(new Color(10, 20, 30, 0.6)),
		).toBe(false);
	});

	it("treats default alpha 1 and explicit 1 as equal", () => {
		expect(new Color(10, 20, 30).equals(new Color(10, 20, 30, 1))).toBe(
			true,
		);
	});

	it("skips alpha when compareAlpha=false", () => {
		const a = new Color(10, 20, 30, 0.2);
		const b = new Color(10, 20, 30, 0.9);
		expect(a.equals(b)).toBe(false);
		expect(a.equals(b, false)).toBe(true);
	});
});
