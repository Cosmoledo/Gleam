import { describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import Vec2 from "@/core/Vec2";

// ==================== Vec2.fromAngle ====================

describe("Vec2.fromAngle", () => {
	it("returns Vec2 with scale 1 at zero angle", () => {
		const v = Vec2.fromAngle(0);
		expect(v.x).toBeCloseTo(1);
		expect(v.y).toBeCloseTo(0);
	});

	it("returns Vec2 at 90 degrees (PI/2)", () => {
		const v = Vec2.fromAngle(Math.PI / 2);
		expect(v.x).toBeCloseTo(0);
		expect(v.y).toBeCloseTo(1);
	});

	it("returns Vec2 at 180 degrees (PI)", () => {
		const v = Vec2.fromAngle(Math.PI);
		expect(v.x).toBeCloseTo(-1);
		expect(v.y).toBeCloseTo(0);
	});

	it("returns Vec2 at 270 degrees (3*PI/2)", () => {
		const v = Vec2.fromAngle((3 * Math.PI) / 2);
		expect(v.x).toBeCloseTo(0);
		expect(v.y).toBeCloseTo(-1);
	});

	it("applies scaleX and scaleY", () => {
		const v = Vec2.fromAngle(0, 5, 10);
		expect(v.x).toBeCloseTo(5);
		expect(v.y).toBeCloseTo(0);
	});

	it("applies scaleY separately when angle is PI/2", () => {
		const v = Vec2.fromAngle(Math.PI / 2, 5, 10);
		expect(v.x).toBeCloseTo(0);
		expect(v.y).toBeCloseTo(10);
	});

	it("uses default scale of 1 when x is 0", () => {
		const v = Vec2.fromAngle(0, 0);
		expect(v.x).toBeCloseTo(0);
		expect(v.y).toBeCloseTo(0);
	});
});

// ==================== Constructor ====================

describe("constructor", () => {
	it("defaults to zero vector", () => {
		const v = new Vec2();
		expect(v.x).toBe(0);
		expect(v.y).toBe(0);
	});

	it("accepts two numbers", () => {
		const v = new Vec2(3, 4);
		expect(v.x).toBe(3);
		expect(v.y).toBe(4);
	});

	it("accepts one number (mirrors to both components, like set)", () => {
		const v = new Vec2(7);
		expect(v.x).toBe(7);
		expect(v.y).toBe(7);
	});

	it("handles negative values", () => {
		const v = new Vec2(-3, -4);
		expect(v.x).toBe(-3);
		expect(v.y).toBe(-4);
	});

	it("handles zero for one component", () => {
		const v = new Vec2(0, 5);
		expect(v.x).toBe(0);
		expect(v.y).toBe(5);
	});

	it("accepts a Vector2-like object", () => {
		const v = new Vec2({ x: 3, y: 4 });
		expect(v.x).toBe(3);
		expect(v.y).toBe(4);
	});

	it("accepts a Vec2 instance", () => {
		const src = new Vec2(5, 6);
		const v = new Vec2(src);
		expect(v.x).toBe(5);
		expect(v.y).toBe(6);
	});

	it("throws when x is a Vector2 and y is provided", () => {
		expect(
			() => new Vec2(new Vec2(1, 2) as unknown as number, 3),
		).toThrow("When x is a Vector2, y must be omitted!");
	});
});

// ==================== set ====================

describe("set", () => {
	it("sets from two numbers", () => {
		const v = new Vec2();
		v.set(3, 4);
		expect(v.x).toBe(3);
		expect(v.y).toBe(4);
	});

	it("sets from one number", () => {
		const v = new Vec2();
		v.set(7);
		expect(v.x).toBe(7);
		expect(v.y).toBe(7);
	});

	it("handles Vector2-like object", () => {
		const v = new Vec2();
		v.set({ x: 2, y: 5 });
		expect(v.x).toBe(2);
		expect(v.y).toBe(5);
	});

	it("sets from a Vec2 instance", () => {
		const v = new Vec2();
		const src = new Vec2(6, 9);
		v.set(src);
		expect(v.x).toBe(6);
		expect(v.y).toBe(9);
	});

	it("returns this for chaining", () => {
		const v = new Vec2();
		expect(v.set(3, 4)).toBe(v);
	});

	it("overwrites existing values", () => {
		const v = new Vec2(1, 2);
		v.set(10, 20);
		expect(v.x).toBe(10);
		expect(v.y).toBe(20);
	});
});

// ==================== abs ====================

describe("abs", () => {
	it("returns absolute values", () => {
		const v = new Vec2(-3, 4);
		v.abs();
		expect(v.x).toBe(3);
		expect(v.y).toBe(4);
	});

	it("returns this for chaining", () => {
		const v = new Vec2(-3, 4);
		expect(v.abs()).toBe(v);
	});

	it("handles all negative", () => {
		const v = new Vec2(-3, -4);
		v.abs();
		expect(v.x).toBe(3);
		expect(v.y).toBe(4);
	});

	it("handles all positive (no change)", () => {
		const v = new Vec2(3, 4);
		v.abs();
		expect(v.x).toBe(3);
		expect(v.y).toBe(4);
	});

	it("handles zero", () => {
		const v = new Vec2(0, 0);
		v.abs();
		expect(v.x).toBe(0);
		expect(v.y).toBe(0);
	});
});

// ==================== add ====================

describe("add", () => {
	it("adds two vectors", () => {
		const v = new Vec2(1, 2);
		v.add(new Vec2(3, 4));
		expect(v.x).toBe(4);
		expect(v.y).toBe(6);
	});

	it("adds two numbers", () => {
		const v = new Vec2(1, 2);
		v.add(3, 4);
		expect(v.x).toBe(4);
		expect(v.y).toBe(6);
	});

	it("adds same value to both components from one number", () => {
		const v = new Vec2(1, 2);
		v.add(5);
		expect(v.x).toBe(6);
		expect(v.y).toBe(7);
	});

	it("adds a Vec2 instance", () => {
		const v = new Vec2(1, 2);
		const src = new Vec2(10, 20);
		v.add(src);
		expect(v.x).toBe(11);
		expect(v.y).toBe(22);
	});

	it("returns this for chaining", () => {
		const v = new Vec2(1, 2);
		expect(v.add(3, 4)).toBe(v);
	});

	it("handles negative values", () => {
		const v = new Vec2(1, 2);
		v.add(-3, -4);
		expect(v.x).toBe(-2);
		expect(v.y).toBe(-2);
	});
});

// ==================== ceil ====================

describe("ceil", () => {
	it("returns this for chaining", () => {
		const v = new Vec2(1.2, 3.4);
		expect(v.ceil()).toBe(v);
	});

	it("ceil positive decimals", () => {
		const v = new Vec2(1.2, 3.4);
		v.ceil();
		expect(v.x).toBe(2);
		expect(v.y).toBe(4);
	});

	it("ceil negative decimals", () => {
		const v = new Vec2(-1.2, -3.4);
		v.ceil();
		expect(v.x).toBe(-1);
		expect(v.y).toBe(-3);
	});

	it("ceil integers (no change)", () => {
		const v = new Vec2(2, 5);
		v.ceil();
		expect(v.x).toBe(2);
		expect(v.y).toBe(5);
	});

	it("ceil zero", () => {
		const v = new Vec2(0, 0);
		v.ceil();
		expect(v.x).toBe(0);
		expect(v.y).toBe(0);
	});
});

// ==================== clamp ====================

describe("clamp", () => {
	it("clamps x and y within ranges", () => {
		const v = new Vec2(-5, 15);
		v.clamp([0, 10]);
		expect(v.x).toBe(0);
		expect(v.y).toBe(10);
	});

	it("uses same range for both axes when only one arg", () => {
		const v = new Vec2(5, 5);
		v.clamp([0, 10]);
		expect(v.x).toBe(5);
		expect(v.y).toBe(5);
	});

	it("uses separate ranges for each axis", () => {
		const v = new Vec2(-5, 15);
		v.clamp([-10, 0], [10, 20]);
		expect(v.x).toBe(-5);
		expect(v.y).toBe(15);
	});

	it("passes through when within range", () => {
		const v = new Vec2(5, 5);
		v.clamp([0, 10]);
		expect(v.x).toBe(5);
		expect(v.y).toBe(5);
	});

	it("returns this for chaining", () => {
		const v = new Vec2(-5, 15);
		expect(v.clamp([0, 10])).toBe(v);
	});

	it("handles inverted range", () => {
		const v = new Vec2(5);
		v.clamp([10, 0]);
		expect(v.x).toBe(0);
	});

	it("handles zero range", () => {
		const v = new Vec2(5);
		v.clamp([3, 3]);
		expect(v.x).toBe(3);
	});

	it("handles negative ranges", () => {
		const v = new Vec2(-5);
		v.clamp([-10, -1]);
		expect(v.x).toBe(-5);
	});
});

// ==================== div ====================

describe("div", () => {
	it("divides by two vectors", () => {
		const v = new Vec2(10, 20);
		v.div(new Vec2(2, 4));
		expect(v.x).toBe(5);
		expect(v.y).toBe(5);
	});

	it("divides by two numbers", () => {
		const v = new Vec2(10, 20);
		v.div(2, 5);
		expect(v.x).toBe(5);
		expect(v.y).toBe(4);
	});

	it("divides both components by same number", () => {
		const v = new Vec2(10, 15);
		v.div(5);
		expect(v.x).toBe(2);
		expect(v.y).toBe(3);
	});

	it("divides by a Vec2 instance", () => {
		const v = new Vec2(10, 20);
		const src = new Vec2(2, 5);
		v.div(src);
		expect(v.x).toBe(5);
		expect(v.y).toBe(4);
	});

	it("returns this for chaining", () => {
		const v = new Vec2(10, 20);
		expect(v.div(2, 5)).toBe(v);
	});

	it("handles negative values", () => {
		const v = new Vec2(10, -20);
		v.div(2, -4);
		expect(v.x).toBe(5);
		expect(v.y).toBe(5);
	});
});

// ==================== floor ====================

describe("floor", () => {
	it("returns this for chaining", () => {
		const v = new Vec2(1.8, 3.2);
		expect(v.floor()).toBe(v);
	});

	it("floors positive decimals", () => {
		const v = new Vec2(1.8, 3.2);
		v.floor();
		expect(v.x).toBe(1);
		expect(v.y).toBe(3);
	});

	it("floors negative decimals", () => {
		const v = new Vec2(-1.2, -3.8);
		v.floor();
		expect(v.x).toBe(-2);
		expect(v.y).toBe(-4);
	});

	it("floors integers (no change)", () => {
		const v = new Vec2(2, 5);
		v.floor();
		expect(v.x).toBe(2);
		expect(v.y).toBe(5);
	});

	it("floors zero", () => {
		const v = new Vec2(0, 0);
		v.floor();
		expect(v.x).toBe(0);
		expect(v.y).toBe(0);
	});
});

// ==================== inv ====================

describe("inv", () => {
	it("inverts both components", () => {
		const v = new Vec2(3, 4);
		v.inv();
		expect(v.x).toBe(-3);
		expect(v.y).toBe(-4);
	});

	it("returns this for chaining", () => {
		const v = new Vec2(3, 4);
		expect(v.inv()).toBe(v);
	});

	it("handles zero", () => {
		const v = new Vec2(0, 0);
		v.inv();
		expect(v.x).toBe(-0);
		expect(v.y).toBe(-0);
	});

	it("handles negative values", () => {
		const v = new Vec2(-3, -4);
		v.inv();
		expect(v.x).toBe(3);
		expect(v.y).toBe(4);
	});
});

// ==================== map ====================

describe("map", () => {
	it("applies callback to x and y", () => {
		const v = new Vec2(2, 3);
		v.map((value, index) => value + index);
		expect(v.x).toBe(2);
		expect(v.y).toBe(4);
	});

	it("returns this for chaining", () => {
		const v = new Vec2(2, 3);
		expect(v.map(v => v * 2)).toBe(v);
	});

	it("handles zero", () => {
		const v = new Vec2(0, 0);
		v.map(v => v + 1);
		expect(v.x).toBe(1);
		expect(v.y).toBe(1);
	});

	it("handles negative values", () => {
		const v = new Vec2(-2, -3);
		v.map(v => v * 2);
		expect(v.x).toBe(-4);
		expect(v.y).toBe(-6);
	});
});

// ==================== mod ====================

describe("mod", () => {
	it("mods with two vectors", () => {
		const v = new Vec2(10, 17);
		v.mod(new Vec2(3, 5));
		expect(v.x).toBe(1);
		expect(v.y).toBe(2);
	});

	it("mods with two numbers", () => {
		const v = new Vec2(10, 17);
		v.mod(3, 5);
		expect(v.x).toBe(1);
		expect(v.y).toBe(2);
	});

	it("mods both components by same number", () => {
		const v = new Vec2(10, 15);
		v.mod(3);
		expect(v.x).toBe(1);
		expect(v.y).toBe(0);
	});

	it("mods with a Vec2 instance", () => {
		const v = new Vec2(10, 17);
		const src = new Vec2(3, 5);
		v.mod(src);
		expect(v.x).toBe(1);
		expect(v.y).toBe(2);
	});

	it("returns this for chaining", () => {
		const v = new Vec2(10, 17);
		expect(v.mod(3, 5)).toBe(v);
	});

	it("handles negative values (always non-negative result)", () => {
		const v = new Vec2(-10, -17);
		v.mod(3, 5);
		expect(v.x).toBe(2);
		expect(v.y).toBe(3);
	});

	it("handles negative divisor", () => {
		const v = new Vec2(10, 17);
		v.mod(-3, -5);
		expect(v.x).toBe(-2);
		expect(v.y).toBe(-3);
	});
});

// ==================== mult ====================

describe("mult", () => {
	it("multiplies by two vectors", () => {
		const v = new Vec2(2, 3);
		v.mult(new Vec2(4, 5));
		expect(v.x).toBe(8);
		expect(v.y).toBe(15);
	});

	it("multiplies by two numbers", () => {
		const v = new Vec2(2, 3);
		v.mult(4, 5);
		expect(v.x).toBe(8);
		expect(v.y).toBe(15);
	});

	it("multiplies both components by same number", () => {
		const v = new Vec2(2, 3);
		v.mult(4);
		expect(v.x).toBe(8);
		expect(v.y).toBe(12);
	});

	it("multiplies by a Vec2 instance", () => {
		const v = new Vec2(2, 3);
		const src = new Vec2(4, 5);
		v.mult(src);
		expect(v.x).toBe(8);
		expect(v.y).toBe(15);
	});

	it("returns this for chaining", () => {
		const v = new Vec2(2, 3);
		expect(v.mult(4, 5)).toBe(v);
	});

	it("handles negative values", () => {
		const v = new Vec2(-2, 3);
		v.mult(-4, 5);
		expect(v.x).toBe(8);
		expect(v.y).toBe(15);
	});

	it("handles zero", () => {
		const v = new Vec2(2, 3);
		v.mult(0, 0);
		expect(v.x).toBe(0);
		expect(v.y).toBe(0);
	});
});

// ==================== normalize ====================

describe("normalize", () => {
	it("normalizes a non-zero vector", () => {
		const v = new Vec2(3, 4);
		v.normalize();
		expect(v.length()).toBeCloseTo(1);
	});

	it("returns this for chaining", () => {
		const v = new Vec2(3, 4);
		expect(v.normalize()).toBe(v);
	});

	it("handles zero vector (returns this unchanged)", () => {
		const v = new Vec2(0, 0);
		v.normalize();
		expect(v.x).toBe(0);
		expect(v.y).toBe(0);
	});

	it("normalizes negative vector", () => {
		const v = new Vec2(-3, -4);
		v.normalize();
		expect(v.length()).toBeCloseTo(1);
	});

	it("normalizes unit vector (no change)", () => {
		const v = new Vec2(1, 0);
		v.normalize();
		expect(v.x).toBe(1);
		expect(v.y).toBe(0);
	});

	it("normalizes vector along y-axis", () => {
		const v = new Vec2(0, 5);
		v.normalize();
		expect(v.x).toBe(0);
		expect(v.y).toBeCloseTo(1);
	});
});

// ==================== normalizeManhattan ====================

describe("normalizeManhattan", () => {
	it("normalizes using manhattan length", () => {
		const v = new Vec2(3, 4);
		v.normalizeManhattan();
		expect(v.x + v.y).toBeCloseTo(1);
	});

	it("returns this for chaining", () => {
		const v = new Vec2(3, 4);
		expect(v.normalizeManhattan()).toBe(v);
	});

	it("handles zero vector (returns this)", () => {
		const v = new Vec2(0, 0);
		v.normalizeManhattan();
		expect(v.x).toBe(0);
		expect(v.y).toBe(0);
	});

	it("normalizes unit manhattan vector", () => {
		const v = new Vec2(0.5, 0.5);
		v.normalizeManhattan();
		expect(v.x + v.y).toBeCloseTo(1);
	});
});

// ==================== rem ====================

describe("rem", () => {
	it("rem with two vectors", () => {
		const v = new Vec2(10, 17);
		v.rem(new Vec2(3, 5));
		expect(v.x).toBe(1);
		expect(v.y).toBe(2);
	});

	it("rem with two numbers", () => {
		const v = new Vec2(10, 17);
		v.rem(3, 5);
		expect(v.x).toBe(1);
		expect(v.y).toBe(2);
	});

	it("rem both components by same number", () => {
		const v = new Vec2(10, 15);
		v.rem(3);
		expect(v.x).toBe(1);
		expect(v.y).toBe(0);
	});

	it("rem with a Vec2 instance", () => {
		const v = new Vec2(10, 17);
		const src = new Vec2(3, 5);
		v.rem(src);
		expect(v.x).toBe(1);
		expect(v.y).toBe(2);
	});

	it("returns this for chaining", () => {
		const v = new Vec2(10, 17);
		expect(v.rem(3, 5)).toBe(v);
	});

	it("handles negative values", () => {
		const v = new Vec2(-10, 17);
		v.rem(3, 5);
		expect(v.x).toBe(-1);
		expect(v.y).toBe(2);
	});
});

// ==================== round ====================

describe("round", () => {
	it("rounds positive decimals", () => {
		const v = new Vec2(1.4, 2.6);
		v.round();
		expect(v.x).toBe(1);
		expect(v.y).toBe(3);
	});

	it("returns this for chaining", () => {
		const v = new Vec2(1.4, 2.6);
		expect(v.round()).toBe(v);
	});

	it("rounds negative decimals", () => {
		const v = new Vec2(-1.5, -2.5);
		v.round();
		expect(v.x).toBe(-1);
		expect(v.y).toBe(-2);
	});

	it("rounds integers (no change)", () => {
		const v = new Vec2(2, 5);
		v.round();
		expect(v.x).toBe(2);
		expect(v.y).toBe(5);
	});

	it("rounds zero", () => {
		const v = new Vec2(0, 0);
		v.round();
		expect(v.x).toBe(0);
		expect(v.y).toBe(0);
	});

	it("rounds .5 boundaries", () => {
		const v = new Vec2(0.5, 1.5);
		v.round();
		expect(v.x).toBe(1);
		expect(v.y).toBe(2);
	});
});

// ==================== sub ====================

describe("sub", () => {
	it("subtracts two vectors", () => {
		const v = new Vec2(10, 20);
		v.sub(new Vec2(3, 4));
		expect(v.x).toBe(7);
		expect(v.y).toBe(16);
	});

	it("subtracts two numbers", () => {
		const v = new Vec2(10, 20);
		v.sub(3, 4);
		expect(v.x).toBe(7);
		expect(v.y).toBe(16);
	});

	it("subtracts same value from both components", () => {
		const v = new Vec2(10, 15);
		v.sub(5);
		expect(v.x).toBe(5);
		expect(v.y).toBe(10);
	});

	it("subtracts a Vec2 instance", () => {
		const v = new Vec2(10, 20);
		const src = new Vec2(3, 4);
		v.sub(src);
		expect(v.x).toBe(7);
		expect(v.y).toBe(16);
	});

	it("returns this for chaining", () => {
		const v = new Vec2(10, 20);
		expect(v.sub(3, 4)).toBe(v);
	});

	it("handles negative values", () => {
		const v = new Vec2(-10, 20);
		v.sub(-3, -4);
		expect(v.x).toBe(-7);
		expect(v.y).toBe(24);
	});
});

// ==================== angle ====================

describe("angle", () => {
	it("returns angle to origin", () => {
		const v = new Vec2(1, 0);
		expect(v.angle()).toBeCloseTo(0);
	});

	it("returns angle to another vector", () => {
		const v = new Vec2(0, 1);
		const target = new Vec2(1, 0);
		expect(v.angle(target)).toBeCloseTo(Math.PI * 0.75);
	});

	it("handles multiple vectors (subtracts all)", () => {
		const v = new Vec2(5, 5);
		const a = new Vec2(1, 1);
		const b = new Vec2(2, 2);
		const result = v.angle(a, b);
		const expected = Math.atan2(5 - 1 - 2, 5 - 1 - 2);
		expect(result).toBeCloseTo(expected);
	});

	it("returns PI/2 for vector pointing up", () => {
		const v = new Vec2(0, 1);
		expect(v.angle()).toBeCloseTo(Math.PI / 2);
	});

	it("returns PI for vector pointing left", () => {
		const v = new Vec2(-1, 0);
		expect(v.angle()).toBeCloseTo(Math.PI);
	});
});

// ==================== distance ====================

describe("distance", () => {
	it("returns distance to origin", () => {
		const v = new Vec2(3, 4);
		const origin = new Vec2(0, 0);
		expect(v.distance(origin)).toBeCloseTo(5);
	});

	it("returns distance to another vector", () => {
		const v = new Vec2(0, 0);
		const target = new Vec2(3, 4);
		expect(v.distance(target)).toBeCloseTo(5);
	});

	it("returns zero for same position", () => {
		const v = new Vec2(1, 2);
		const target = new Vec2(1, 2);
		expect(v.distance(target)).toBe(0);
	});

	it("handles negative coordinates", () => {
		const v = new Vec2(-3, -4);
		const target = new Vec2(0, 0);
		expect(v.distance(target)).toBeCloseTo(5);
	});
});

// ==================== distanceManhattan ====================

describe("distanceManhattan", () => {
	it("returns manhattan distance to origin", () => {
		const v = new Vec2(3, 4);
		const origin = new Vec2(0, 0);
		expect(v.distanceManhattan(origin)).toBe(7);
	});

	it("returns manhattan distance to another vector", () => {
		const v = new Vec2(0, 0);
		const target = new Vec2(3, 4);
		expect(v.distanceManhattan(target)).toBe(7);
	});

	it("returns zero for same position", () => {
		const v = new Vec2(1, 2);
		const target = new Vec2(1, 2);
		expect(v.distanceManhattan(target)).toBe(0);
	});

	it("handles negative coordinates", () => {
		const v = new Vec2(-3, -4);
		const target = new Vec2(0, 0);
		expect(v.distanceManhattan(target)).toBe(7);
	});
});

// ==================== dotProduct ====================

describe("dotProduct", () => {
	it("computes dot product with another vector", () => {
		const v = new Vec2(1, 2);
		const target = new Vec2(3, 4);
		expect(v.dotProduct(target)).toBe(11);
	});

	it("handles negative values", () => {
		const v = new Vec2(-1, 2);
		const target = new Vec2(3, -4);
		expect(v.dotProduct(target)).toBe(-11);
	});

	it("handles zero vector", () => {
		const v = new Vec2(0, 0);
		const target = new Vec2(3, 4);
		expect(v.dotProduct(target)).toBe(0);
	});

	it("handles orthogonal vectors", () => {
		const v = new Vec2(1, 0);
		const target = new Vec2(0, 1);
		expect(v.dotProduct(target)).toBe(0);
	});
});

// ==================== isValid ====================

describe("isValid", () => {
	it("returns true for finite values", () => {
		const v = new Vec2(3, 4);
		expect(v.isValid()).toBe(true);
	});

	it("returns false for NaN x", () => {
		const v = new Vec2(NaN, 4);
		expect(v.isValid()).toBe(false);
	});

	it("returns false for NaN y", () => {
		const v = new Vec2(3, NaN);
		expect(v.isValid()).toBe(false);
	});

	it("returns false for Infinity x", () => {
		const v = new Vec2(Infinity, 4);
		expect(v.isValid()).toBe(false);
	});

	it("returns false for -Infinity y", () => {
		const v = new Vec2(3, -Infinity);
		expect(v.isValid()).toBe(false);
	});

	it("returns true for zero", () => {
		const v = new Vec2(0, 0);
		expect(v.isValid()).toBe(true);
	});
});

// ==================== length ====================

describe("length", () => {
	it("returns length of vector", () => {
		const v = new Vec2(3, 4);
		expect(v.length()).toBeCloseTo(5);
	});

	it("returns zero for zero vector", () => {
		const v = new Vec2(0, 0);
		expect(v.length()).toBe(0);
	});

	it("returns correct length for negative values", () => {
		const v = new Vec2(-3, -4);
		expect(v.length()).toBeCloseTo(5);
	});

	it("returns x for vector on x-axis", () => {
		const v = new Vec2(5, 0);
		expect(v.length()).toBe(5);
	});
});

// ==================== lengthManhattan ====================

describe("lengthManhattan", () => {
	it("returns manhattan length", () => {
		const v = new Vec2(3, 4);
		expect(v.lengthManhattan()).toBe(7);
	});

	it("returns zero for zero vector", () => {
		const v = new Vec2(0, 0);
		expect(v.lengthManhattan()).toBe(0);
	});

	it("handles negative values", () => {
		const v = new Vec2(-3, -4);
		expect(v.lengthManhattan()).toBe(7);
	});
});

// ==================== max ====================

describe("max", () => {
	it("returns the larger component", () => {
		const v = new Vec2(3, 5);
		expect(v.max()).toBe(5);
	});

	it("returns x when x is larger", () => {
		const v = new Vec2(10, 2);
		expect(v.max()).toBe(10);
	});

	it("handles equal components", () => {
		const v = new Vec2(5, 5);
		expect(v.max()).toBe(5);
	});

	it("handles negative values", () => {
		const v = new Vec2(-3, -1);
		expect(v.max()).toBe(-1);
	});
});

// ==================== min ====================

describe("min", () => {
	it("returns the smaller component", () => {
		const v = new Vec2(3, 5);
		expect(v.min()).toBe(3);
	});

	it("returns y when y is smaller", () => {
		const v = new Vec2(2, 10);
		expect(v.min()).toBe(2);
	});

	it("handles equal components", () => {
		const v = new Vec2(5, 5);
		expect(v.min()).toBe(5);
	});

	it("handles negative values", () => {
		const v = new Vec2(-3, -1);
		expect(v.min()).toBe(-3);
	});
});

// ==================== toArray ====================

describe("toArray", () => {
	it("returns [x, y]", () => {
		const v = new Vec2(3, 4);
		expect(v.toArray()).toEqual([3, 4]);
	});

	it("returns zero for zero vector", () => {
		const v = new Vec2(0, 0);
		expect(v.toArray()).toEqual([0, 0]);
	});

	it("handles negative values", () => {
		const v = new Vec2(-3, -4);
		expect(v.toArray()).toEqual([-3, -4]);
	});
});

// ==================== toRectAddPos ====================

describe("toRectAddPos", () => {
	it("creates Rect with size from this vector", () => {
		const v = new Vec2(3, 4);
		const rect = v.toRectAddPos(new Vec2(10, 20));
		expect(rect.x).toBe(10);
		expect(rect.y).toBe(20);
		expect(rect.w).toBe(3);
		expect(rect.h).toBe(4);
	});

	it("uses provided x and y as position", () => {
		const v = new Vec2(3, 4);
		const rect = v.toRectAddPos(10, 20);
		expect(rect.x).toBe(10);
		expect(rect.y).toBe(20);
		expect(rect.w).toBe(3);
		expect(rect.h).toBe(4);
	});

	it("uses Vec2 as position", () => {
		const v = new Vec2(3, 4);
		const pos = new Vec2(10, 20);
		const rect = v.toRectAddPos(pos);
		expect(rect.x).toBe(10);
		expect(rect.y).toBe(20);
		expect(rect.w).toBe(3);
		expect(rect.h).toBe(4);
	});

	it("uses same value for both position components", () => {
		const v = new Vec2(3, 4);
		const rect = v.toRectAddPos(10);
		expect(rect.x).toBe(10);
		expect(rect.y).toBe(10);
	});
});

// ==================== toRectAddSize ====================

describe("toRectAddSize", () => {
	it("creates Rect with this as position", () => {
		const v = new Vec2(3, 4);
		const rect = v.toRectAddSize(new Vec2(10, 20));
		expect(rect.x).toBe(3);
		expect(rect.y).toBe(4);
		expect(rect.w).toBe(10);
		expect(rect.h).toBe(20);
	});

	it("uses provided x and y as size", () => {
		const v = new Vec2(3, 4);
		const rect = v.toRectAddSize(10, 20);
		expect(rect.x).toBe(3);
		expect(rect.y).toBe(4);
		expect(rect.w).toBe(10);
		expect(rect.h).toBe(20);
	});

	it("uses Vec2 as size", () => {
		const v = new Vec2(3, 4);
		const size = new Vec2(10, 20);
		const rect = v.toRectAddSize(size);
		expect(rect.x).toBe(3);
		expect(rect.y).toBe(4);
		expect(rect.w).toBe(10);
		expect(rect.h).toBe(20);
	});

	it("uses same value for both size components", () => {
		const v = new Vec2(3, 4);
		const rect = v.toRectAddSize(10);
		expect(rect.w).toBe(10);
		expect(rect.h).toBe(10);
	});
});

// ==================== toString ====================

describe("toString", () => {
	it("returns formatted string", () => {
		const v = new Vec2(3, 4);
		expect(v.toString()).toBe("Vec2 [x: 3, y: 4]");
	});

	it("handles zero", () => {
		const v = new Vec2(0, 0);
		expect(v.toString()).toBe("Vec2 [x: 0, y: 0]");
	});

	it("handles negative values", () => {
		const v = new Vec2(-3, -4);
		expect(v.toString()).toBe("Vec2 [x: -3, y: -4]");
	});

	it("handles decimal values", () => {
		const v = new Vec2(1.5, -2.5);
		expect(v.toString()).toBe("Vec2 [x: 1.5, y: -2.5]");
	});
});

// ==================== clone ====================

describe("clone", () => {
	it("returns a new Vec2 with same values", () => {
		const v = new Vec2(3, 4);
		const clone = v.clone();
		expect(clone.x).toBe(3);
		expect(clone.y).toBe(4);
	});

	it("returns a different instance", () => {
		const v = new Vec2(3, 4);
		const clone = v.clone();
		expect(clone).not.toBe(v);
	});

	it("handles zero", () => {
		const v = new Vec2(0, 0);
		const clone = v.clone();
		expect(clone.x).toBe(0);
		expect(clone.y).toBe(0);
	});

	it("handles negative values", () => {
		const v = new Vec2(-3, -4);
		const clone = v.clone();
		expect(clone.x).toBe(-3);
		expect(clone.y).toBe(-4);
	});
});

// ==================== warnings and invariants ====================

describe("warnings and invariants", () => {
	it("traces a warning when normalize is called on a zero vector", () => {
		const traceSpy = vi
			.spyOn(console, "trace")
			.mockImplementation(() => {});
		const nowSpy = vi.spyOn(performance, "now").mockReturnValue(1e9);

		new Vec2(0, 0).normalize();

		expect(traceSpy).toHaveBeenCalled();

		nowSpy.mockRestore();
		traceSpy.mockRestore();
	});

	it("traces a warning when an operation produces a non-finite value", () => {
		const traceSpy = vi
			.spyOn(console, "trace")
			.mockImplementation(() => {});
		const nowSpy = vi.spyOn(performance, "now").mockReturnValue(1e9);

		const v = new Vec2(1, 1).div(0, 0);

		expect(v.x).toBe(Infinity);
		expect(v.y).toBe(Infinity);
		expect(traceSpy).toHaveBeenCalled();

		nowSpy.mockRestore();
		traceSpy.mockRestore();
	});

	it("leaves state untouched for an unknown calculate operation", () => {
		const v = new Vec2(3, 4);
		const calc = (
			v as unknown as {
				calculate: (op: number, x: number, y?: number) => Vec2;
			}
		).calculate.bind(v);

		calc(999, 10, 20);

		expect(v.x).toBe(3);
		expect(v.y).toBe(4);
	});

	const throwingMethods = [
		"set",
		"add",
		"sub",
		"mult",
		"div",
		"mod",
		"rem",
		"equals",
	] as const;

	throwingMethods.forEach(method => {
		it(`${method} throws when x is a Vector2 and y is provided`, () => {
			const v = new Vec2(1, 2);
			const src = new Vec2(3, 4);
			const fn = (
				v as unknown as Record<
					string,
					(a: unknown, b: unknown) => unknown
				>
			)[method].bind(v);

			expect(() => fn(src, 3)).toThrow(
				"When x is a Vector2, y must be omitted!",
			);
		});
	});
});

// ==================== equals ====================

describe("equals", () => {
	it("returns true for equal vectors", () => {
		const v = new Vec2(3, 4);
		expect(v.equals(new Vec2(3, 4))).toBe(true);
	});

	it("returns true for equal numbers", () => {
		const v = new Vec2(3, 4);
		expect(v.equals(3, 4)).toBe(true);
	});

	it("returns true for same value passed as single number", () => {
		const v = new Vec2(5, 5);
		expect(v.equals(5)).toBe(true);
	});

	it("returns false for different x", () => {
		const v = new Vec2(3, 4);
		expect(v.equals(4, 4)).toBe(false);
	});

	it("returns false for different y", () => {
		const v = new Vec2(3, 4);
		expect(v.equals(3, 5)).toBe(false);
	});

	it("returns false for different vector", () => {
		const v = new Vec2(3, 4);
		expect(v.equals(new Vec2(4, 5))).toBe(false);
	});

	it("returns false for different values", () => {
		const v = new Vec2(3, 4);
		expect(v.equals(4, 5)).toBe(false);
	});

	it("handles zero vector", () => {
		const v = new Vec2(0, 0);
		expect(v.equals(0)).toBe(true);
	});

	it("handles negative values", () => {
		const v = new Vec2(-3, -4);
		expect(v.equals(-3, -4)).toBe(true);
	});

	it("handles Vector2-like object", () => {
		const v = new Vec2(3, 4);
		expect(v.equals({ x: 3, y: 4 })).toBe(true);
	});
});
