import { describe, it, expect } from "vitest";

// ==================== Imports ====================

import Rect from "@/math/Rect";
import Polygon from "@/math/Polygon";
import Vec2 from "@/math/Vec2";

// ==================== Rect.fromBoundingClientRect (HTMLElement) ====================

describe("fromBoundingClientRect (HTMLElement)", () => {
	it("calls getBoundingClientRect on real HTMLElement instances", () => {
		const element = document.createElement("div");
		element.getBoundingClientRect = () =>
			({ left: 7, top: 8, width: 9, height: 10 }) as DOMRect;

		const result = Rect.fromBoundingClientRect(element);
		expect(result.x).toBe(7);
		expect(result.y).toBe(8);
		expect(result.w).toBe(9);
		expect(result.h).toBe(10);
	});
});

// ==================== Rect.fromBoundingClientRect (DOMRect) ====================

describe("fromBoundingClientRect (DOMRect)", () => {
	it("creates Rect from DOMRect", () => {
		const domRect = {
			left: 5,
			top: 15,
			width: 80,
			height: 40,
		} as DOMRect;

		const result = Rect.fromBoundingClientRect(domRect);
		expect(result.x).toBe(5);
		expect(result.y).toBe(15);
		expect(result.w).toBe(80);
		expect(result.h).toBe(40);
	});

	it("handles negative width/height", () => {
		const domRect = {
			left: 0,
			top: 0,
			width: -10,
			height: -20,
		} as DOMRect;

		const result = Rect.fromBoundingClientRect(domRect);
		expect(result.x).toBe(0);
		expect(result.y).toBe(0);
		expect(result.w).toBe(-10);
		expect(result.h).toBe(-20);
	});
});

// ==================== Rect.fromPolygon ====================

describe("fromPolygon", () => {
	it("computes bounding box from polygon points", () => {
		const polygon = new Polygon(new Vec2(0, 0), new Vec2(10, 0), new Vec2(10, 10), new Vec2(0, 10));
		const result = Rect.fromPolygon(polygon);
		expect(result.x).toBe(0);
		expect(result.y).toBe(0);
		expect(result.w).toBe(10);
		expect(result.h).toBe(10);
	});

	it("handles single point polygon", () => {
		const polygon = new Polygon(new Vec2(5, 5));
		const result = Rect.fromPolygon(polygon);
		expect(result.x).toBe(5);
		expect(result.y).toBe(5);
		expect(result.w).toBe(0);
		expect(result.h).toBe(0);
	});

	it("handles negative coordinates", () => {
		const polygon = new Polygon(
			new Vec2(-10, -10),
			new Vec2(10, 10),
			new Vec2(-5, 5),
		);
		const result = Rect.fromPolygon(polygon);
		expect(result.x).toBe(-10);
		expect(result.y).toBe(-10);
		expect(result.w).toBe(20);
		expect(result.h).toBe(20);
	});

	it("handles scattered points", () => {
		const polygon = new Polygon(
			new Vec2(100, 200),
			new Vec2(50, 150),
			new Vec2(150, 250),
			new Vec2(75, 175),
		);
		const result = Rect.fromPolygon(polygon);
		expect(result.x).toBe(50);
		expect(result.y).toBe(150);
		expect(result.w).toBe(100);
		expect(result.h).toBe(100);
	});
});

// ==================== Constructor ====================

describe("constructor", () => {
	it("defaults to zero rect", () => {
		const r = new Rect();
		expect(r.x).toBe(0);
		expect(r.y).toBe(0);
		expect(r.w).toBe(0);
		expect(r.h).toBe(0);
	});

	it("accepts four numbers", () => {
		const r = new Rect(1, 2, 3, 4);
		expect(r.x).toBe(1);
		expect(r.y).toBe(2);
		expect(r.w).toBe(3);
		expect(r.h).toBe(4);
	});

	it("accepts three numbers (h defaults to 0)", () => {
		const r = new Rect(1, 2, 3);
		expect(r.x).toBe(1);
		expect(r.y).toBe(2);
		expect(r.w).toBe(3);
		expect(r.h).toBe(0);
	});

	it("accepts two numbers", () => {
		const r = new Rect(1, 2);
		expect(r.x).toBe(1);
		expect(r.y).toBe(2);
		expect(r.w).toBe(0);
		expect(r.h).toBe(0);
	});

	it("accepts one number", () => {
		const r = new Rect(5);
		expect(r.x).toBe(5);
		expect(r.y).toBe(0);
		expect(r.w).toBe(0);
		expect(r.h).toBe(0);
	});

	it("handles negative values", () => {
		const r = new Rect(-1, -2, -3, -4);
		expect(r.x).toBe(-1);
		expect(r.y).toBe(-2);
		expect(r.w).toBe(-3);
		expect(r.h).toBe(-4);
	});

	it("initializes sides", () => {
		const r = new Rect(10, 20, 30, 40);
		expect(r.sides.bottom).toBe(60);
		expect(r.sides.right).toBe(40);
		expect(r.sides.centerPos.x).toBe(25);
		expect(r.sides.centerPos.y).toBe(40);
		expect(r.sides.halfSize.x).toBe(15);
		expect(r.sides.halfSize.y).toBe(20);
	});
});

// ==================== set ====================

describe("set", () => {
	it("sets from four numbers", () => {
		const r = new Rect();
		r.set(1, 2, 3, 4);
		expect(r.x).toBe(1);
		expect(r.y).toBe(2);
		expect(r.w).toBe(3);
		expect(r.h).toBe(4);
	});

	it("sets from three numbers (h defaults to 0)", () => {
		const r = new Rect(0, 0, 10, 10);
		r.set(1, 2, 3);
		expect(r.x).toBe(1);
		expect(r.y).toBe(2);
		expect(r.w).toBe(3);
		expect(r.h).toBe(10);
	});

	it("sets from two numbers (w, h unchanged)", () => {
		const r = new Rect(0, 0, 10, 20);
		r.set(5, 15);
		expect(r.x).toBe(5);
		expect(r.y).toBe(15);
		expect(r.w).toBe(10);
		expect(r.h).toBe(20);
	});

	it("returns this for chaining", () => {
		const r = new Rect();
		expect(r.set(1, 2, 3, 4)).toBe(r);
	});

	it("handles Vector2-like object with w/h", () => {
		const r = new Rect(10, 20, 30, 40);
		r.set({ x: 1, y: 2, w: 3, h: 4 });
		expect(r.x).toBe(1);
		expect(r.y).toBe(2);
		expect(r.w).toBe(3);
		expect(r.h).toBe(4);
	});

	it("handles Vec2 instance as first arg with w, h", () => {
		const r = new Rect(10, 20, 30, 40);
		r.set(new Vec2(5, 15), 7, 8);
		expect(r.x).toBe(5);
		expect(r.y).toBe(15);
		expect(r.w).toBe(8);
		expect(r.h).toBe(40);
	});

	it("handles Vec2 instance as first arg without w, h", () => {
		const r = new Rect(10, 20, 30, 40);
		r.set(new Vec2(5, 15));
		expect(r.x).toBe(5);
		expect(r.y).toBe(15);
		expect(r.w).toBe(30);
		expect(r.h).toBe(40);
	});

	it("updates sides after set", () => {
		const r = new Rect(0, 0, 10, 20);
		r.set(5, 10, 15, 25);
		expect(r.sides.bottom).toBe(35);
		expect(r.sides.right).toBe(20);
		expect(r.sides.centerPos.x).toBe(12.5);
		expect(r.sides.centerPos.y).toBe(22.5);
	});

	it("leaves w/h unchanged when x is object without w/h", () => {
		const r = new Rect(10, 20, 30, 40);
		r.set({ x: 1, y: 2 });
		expect(r.w).toBe(30);
		expect(r.h).toBe(40);
	});

	it("handles w = 0 explicitly", () => {
		const r = new Rect(0, 0, 10, 10);
		r.set(0, 0, 0, 10);
		expect(r.w).toBe(0);
	});

	it("handles h = 0 explicitly", () => {
		const r = new Rect(0, 0, 10, 10);
		r.set(0, 0, 10, 0);
		expect(r.h).toBe(0);
	});
});

// ==================== inflate ====================

describe("inflate", () => {
	it("inflates rect by delta", () => {
		const r = new Rect(10, 20, 30, 40);
		const result = r.inflate(5);
		expect(result.x).toBe(5);
		expect(result.y).toBe(15);
		expect(result.w).toBe(40);
		expect(result.h).toBe(50);
	});

	it("deflates when delta is negative", () => {
		const r = new Rect(10, 20, 30, 40);
		const result = r.inflate(-5);
		expect(result.x).toBe(15);
		expect(result.y).toBe(25);
		expect(result.w).toBe(20);
		expect(result.h).toBe(30);
	});

	it("returns a new instance", () => {
		const r = new Rect(10, 20, 30, 40);
		const result = r.inflate(5);
		expect(result).not.toBe(r);
	});

	it("does not mutate original", () => {
		const r = new Rect(10, 20, 30, 40);
		r.inflate(5);
		expect(r.x).toBe(10);
		expect(r.y).toBe(20);
		expect(r.w).toBe(30);
		expect(r.h).toBe(40);
	});

	it("handles zero delta", () => {
		const r = new Rect(10, 20, 30, 40);
		const result = r.inflate(0);
		expect(result.x).toBe(10);
		expect(result.y).toBe(20);
		expect(result.w).toBe(30);
		expect(result.h).toBe(40);
	});
});

// ==================== round ====================

describe("round", () => {
	it("rounds x and y", () => {
		const r = new Rect(1.4, 2.6, 10, 20);
		r.round();
		expect(r.x).toBe(1);
		expect(r.y).toBe(3);
	});

	it("rounds positive decimals", () => {
		const r = new Rect(1.6, 2.4, 0, 0);
		r.round();
		expect(r.x).toBe(2);
		expect(r.y).toBe(2);
	});

	it("rounds negative decimals", () => {
		const r = new Rect(-1.6, -2.6, 0, 0);
		r.round();
		expect(r.x).toBe(-2);
		expect(r.y).toBe(-3);
	});

	it("rounds .5 boundaries", () => {
		const r = new Rect(0.5, 1.5, 0, 0);
		r.round();
		expect(r.x).toBe(1);
		expect(r.y).toBe(2);
	});

	it("leaves integers unchanged", () => {
		const r = new Rect(1, 2, 0, 0);
		r.round();
		expect(r.x).toBe(1);
		expect(r.y).toBe(2);
	});

	it("updates sides after rounding", () => {
		const r = new Rect(1.6, 2.6, 10, 20);
		r.round();
		expect(r.sides.centerPos.x).toBeCloseTo(7);
		expect(r.sides.centerPos.y).toBeCloseTo(13);
	});
});

// ==================== update ====================

describe("update", () => {
	it("computes sides from current x, y, w, h", () => {
		const r = new Rect(10, 20, 30, 40);
		r.x = 5;
		r.y = 10;
		r.w = 15;
		r.h = 25;
		r.update();
		expect(r.sides.bottom).toBe(35);
		expect(r.sides.right).toBe(20);
		expect(r.sides.centerPos.x).toBeCloseTo(12.5);
		expect(r.sides.centerPos.y).toBeCloseTo(22.5);
		expect(r.sides.halfSize.x).toBeCloseTo(7.5);
		expect(r.sides.halfSize.y).toBeCloseTo(12.5);
	});

	it("handles negative dimensions", () => {
		const r = new Rect(10, 10, -20, -30);
		r.update();
		expect(r.sides.bottom).toBe(-20);
		expect(r.sides.right).toBe(-10);
	});

	it("handles zero dimensions", () => {
		const r = new Rect(5, 5, 0, 0);
		r.update();
		expect(r.sides.bottom).toBe(5);
		expect(r.sides.right).toBe(5);
		expect(r.sides.centerPos.x).toBe(5);
		expect(r.sides.centerPos.y).toBe(5);
		expect(r.sides.halfSize.x).toBe(0);
		expect(r.sides.halfSize.y).toBe(0);
	});

	it("handles decimal dimensions", () => {
		const r = new Rect(0, 0, 1.5, 2.5);
		r.update();
		expect(r.sides.centerPos.x).toBeCloseTo(0.75);
		expect(r.sides.centerPos.y).toBeCloseTo(1.25);
		expect(r.sides.halfSize.x).toBeCloseTo(0.75);
		expect(r.sides.halfSize.y).toBeCloseTo(1.25);
	});
});

// ==================== collide ====================

describe("collide", () => {
	it("returns true for overlapping rects", () => {
		const a = new Rect(0, 0, 10, 10);
		const b = new Rect(5, 5, 10, 10);
		expect(a.collide(b)).toBe(true);
	});

	it("returns true for touching edges", () => {
		const a = new Rect(0, 0, 10, 10);
		const b = new Rect(10, 0, 10, 10);
		expect(a.collide(b)).toBe(true);
	});

	it("returns true for containment", () => {
		const a = new Rect(0, 0, 20, 20);
		const b = new Rect(5, 5, 10, 10);
		expect(a.collide(b)).toBe(true);
	});

	it("returns false for non-overlapping rects", () => {
		const a = new Rect(0, 0, 10, 10);
		const b = new Rect(11, 0, 10, 10);
		expect(a.collide(b)).toBe(false);
	});

	it("returns false for below rect", () => {
		const a = new Rect(0, 0, 10, 10);
		const b = new Rect(0, 11, 10, 10);
		expect(a.collide(b)).toBe(false);
	});

	it("returns true for negative coordinate rects", () => {
		const a = new Rect(-10, -10, 10, 10);
		const b = new Rect(-5, -5, 10, 10);
		expect(a.collide(b)).toBe(true);
	});

	it("returns true when only corners touch diagonally", () => {
		const a = new Rect(0, 0, 10, 10);
		const b = new Rect(10, 10, 10, 10);
		expect(a.collide(b)).toBe(true);
	});

	it("returns true when one rect is zero-size but inside", () => {
		const a = new Rect(0, 0, 10, 10);
		const b = new Rect(5, 5, 0, 0);
		expect(a.collide(b)).toBe(true);
	});
});

// ==================== collideFull ====================

describe("collideFull", () => {
	it("returns true when rect is fully inside", () => {
		const a = new Rect(0, 0, 20, 20);
		const b = new Rect(5, 5, 10, 10);
		expect(a.collideFull(b)).toBe(true);
	});

	it("returns false when rect is not fully inside", () => {
		const a = new Rect(0, 0, 10, 10);
		const b = new Rect(5, 5, 10, 10);
		expect(a.collideFull(b)).toBe(false);
	});

	it("returns true when rects are equal", () => {
		const a = new Rect(0, 0, 10, 10);
		const b = new Rect(0, 0, 10, 10);
		expect(a.collideFull(b)).toBe(true);
	});

	it("returns false for non-overlapping rects", () => {
		const a = new Rect(0, 0, 10, 10);
		const b = new Rect(11, 11, 10, 10);
		expect(a.collideFull(b)).toBe(false);
	});

	it("returns true for negative coordinate rects fully inside", () => {
		const a = new Rect(-20, -20, 20, 20);
		const b = new Rect(-10, -10, 10, 10);
		expect(a.collideFull(b)).toBe(true);
	});

	it("returns true when rect touches the edge", () => {
		const a = new Rect(0, 0, 10, 10);
		const b = new Rect(0, 0, 9, 9);
		expect(a.collideFull(b)).toBe(true);
	});

	it("returns true when rect shares left and right edges", () => {
		const a = new Rect(0, 0, 10, 10);
		const b = new Rect(0, 1, 10, 8);
		expect(a.collideFull(b)).toBe(true);
	});

	it("returns true when rect shares top and bottom edges", () => {
		const a = new Rect(0, 0, 10, 10);
		const b = new Rect(1, 0, 8, 10);
		expect(a.collideFull(b)).toBe(true);
	});
});

// ==================== collidePoint ====================

describe("collidePoint", () => {
	it("returns true for point inside rect", () => {
		const r = new Rect(0, 0, 10, 10);
		expect(r.collidePoint(new Vec2(5, 5))).toBe(true);
	});

	it("returns true for point on left edge", () => {
		const r = new Rect(0, 0, 10, 10);
		expect(r.collidePoint(new Vec2(0, 5))).toBe(true);
	});

	it("returns true for point on right edge", () => {
		const r = new Rect(0, 0, 10, 10);
		expect(r.collidePoint(new Vec2(10, 5))).toBe(true);
	});

	it("returns true for point on top edge", () => {
		const r = new Rect(0, 0, 10, 10);
		expect(r.collidePoint(new Vec2(5, 0))).toBe(true);
	});

	it("returns true for point on bottom edge", () => {
		const r = new Rect(0, 0, 10, 10);
		expect(r.collidePoint(new Vec2(5, 10))).toBe(true);
	});

	it("returns true for point at origin corner", () => {
		const r = new Rect(0, 0, 10, 10);
		expect(r.collidePoint(new Vec2(0, 0))).toBe(true);
	});

	it("returns true for point at opposite corner", () => {
		const r = new Rect(0, 0, 10, 10);
		expect(r.collidePoint(new Vec2(10, 10))).toBe(true);
	});

	it("returns false for point outside right", () => {
		const r = new Rect(0, 0, 10, 10);
		expect(r.collidePoint(new Vec2(11, 5))).toBe(false);
	});

	it("returns false for point outside bottom", () => {
		const r = new Rect(0, 0, 10, 10);
		expect(r.collidePoint(new Vec2(5, 11))).toBe(false);
	});

	it("returns false for point outside left", () => {
		const r = new Rect(0, 0, 10, 10);
		expect(r.collidePoint(new Vec2(-1, 5))).toBe(false);
	});

	it("returns false for point outside top", () => {
		const r = new Rect(0, 0, 10, 10);
		expect(r.collidePoint(new Vec2(5, -1))).toBe(false);
	});

	it("handles negative coordinate rect", () => {
		const r = new Rect(-10, -10, 10, 10);
		expect(r.collidePoint(new Vec2(-5, -5))).toBe(true);
		expect(r.collidePoint(new Vec2(-11, -5))).toBe(false);
	});

	it("handles zero-size rect with point at position", () => {
		const r = new Rect(5, 5, 0, 0);
		expect(r.collidePoint(new Vec2(5, 5))).toBe(true);
		expect(r.collidePoint(new Vec2(6, 5))).toBe(false);
	});
});

// ==================== collideSide ====================

describe("collideSide", () => {
	it("returns 'none' for non-colliding rect", () => {
		const a = new Rect(0, 0, 10, 10);
		const b = new Rect(20, 20, 10, 10);
		expect(a.collideSide(b)).toBe("none");
	});

	it("returns 'bottom' when collision is from top", () => {
		const a = new Rect(5, 15, 10, 10);
		const b = new Rect(5, 5, 10, 10);
		expect(a.collideSide(b)).toBe("bottom");
	});

	it("returns 'top' when collision is from bottom", () => {
		const a = new Rect(5, -5, 10, 10);
		const b = new Rect(5, 5, 10, 10);
		expect(a.collideSide(b)).toBe("top");
	});

	it("returns 'right' when collision is from left", () => {
		const a = new Rect(5, 5, 10, 10);
		const b = new Rect(-5, 5, 10, 10);
		expect(a.collideSide(b)).toBe("right");
	});

	it("returns 'left' when collision is from right", () => {
		const a = new Rect(-5, 5, 10, 10);
		const b = new Rect(5, 5, 10, 10);
		expect(a.collideSide(b)).toBe("left");
	});

	it("returns 'top' for diagonally overlapping rects", () => {
		const a = new Rect(0, 0, 10, 10);
		const b = new Rect(5, 5, 10, 10);
		expect(a.collideSide(b)).toBe("top");
	});

	it("returns 'top' for identical rects", () => {
		const a = new Rect(0, 0, 10, 10);
		const b = new Rect(0, 0, 10, 10);
		expect(a.collideSide(b)).toBe("top");
	});

	it("returns 'bottom' for aligned rects above", () => {
		const a = new Rect(5, 10, 10, 10);
		const b = new Rect(5, 0, 10, 10);
		expect(a.collideSide(b)).toBe("bottom");
	});

	it("returns 'top' for aligned rects below", () => {
		const a = new Rect(5, -10, 10, 10);
		const b = new Rect(5, 0, 10, 10);
		expect(a.collideSide(b)).toBe("top");
	});

	it("returns 'right' for aligned rects to the left", () => {
		const a = new Rect(10, 5, 10, 10);
		const b = new Rect(0, 5, 10, 10);
		expect(a.collideSide(b)).toBe("right");
	});

	it("returns 'left' for aligned rects to the right", () => {
		const a = new Rect(-10, 5, 10, 10);
		const b = new Rect(0, 5, 10, 10);
		expect(a.collideSide(b)).toBe("left");
	});

	it("handles zero-size rects", () => {
		const a = new Rect(5, 5, 0, 0);
		const b = new Rect(5, 15, 0, 0);
		expect(a.collideSide(b)).toBe("none");
	});
});

// ==================== pos ====================

describe("pos", () => {
	it("returns Vec2 with rect position", () => {
		const r = new Rect(10, 20, 30, 40);
		const result = r.pos();
		expect(result.x).toBe(10);
		expect(result.y).toBe(20);
	});

	it("returns a new instance", () => {
		const r = new Rect(10, 20, 30, 40);
		const result = r.pos();
		expect(result).not.toBe(r);
	});

	it("handles zero rect", () => {
		const r = new Rect();
		const result = r.pos();
		expect(result.x).toBe(0);
		expect(result.y).toBe(0);
	});

	it("handles negative coordinates", () => {
		const r = new Rect(-10, -20, 30, 40);
		const result = r.pos();
		expect(result.x).toBe(-10);
		expect(result.y).toBe(-20);
	});
});

// ==================== size ====================

describe("size", () => {
	it("returns Vec2 with rect dimensions", () => {
		const r = new Rect(10, 20, 30, 40);
		const result = r.size();
		expect(result.x).toBe(30);
		expect(result.y).toBe(40);
	});

	it("returns a new instance", () => {
		const r = new Rect(10, 20, 30, 40);
		const result = r.size();
		expect(result).not.toBe(r);
	});

	it("handles zero rect", () => {
		const r = new Rect();
		const result = r.size();
		expect(result.x).toBe(0);
		expect(result.y).toBe(0);
	});

	it("handles negative dimensions", () => {
		const r = new Rect(0, 0, -10, -20);
		const result = r.size();
		expect(result.x).toBe(-10);
		expect(result.y).toBe(-20);
	});
});

// ==================== toString ====================

describe("toString", () => {
	it("returns formatted string", () => {
		const r = new Rect(1, 2, 3, 4);
		expect(r.toString()).toBe("Rect [x: 1, y: 2, w: 3, h: 4]");
	});

	it("handles zero rect", () => {
		const r = new Rect();
		expect(r.toString()).toBe("Rect [x: 0, y: 0, w: 0, h: 0]");
	});

	it("handles negative values", () => {
		const r = new Rect(-1, -2, -3, -4);
		expect(r.toString()).toBe("Rect [x: -1, y: -2, w: -3, h: -4]");
	});

	it("handles decimal values", () => {
		const r = new Rect(1.5, -2.5, 3.14, -4.71);
		expect(r.toString()).toBe("Rect [x: 1.5, y: -2.5, w: 3.14, h: -4.71]");
	});
});

// ==================== clone ====================

describe("clone", () => {
	it("returns a new Rect with same values", () => {
		const r = new Rect(10, 20, 30, 40);
		const clone = r.clone();
		expect(clone.x).toBe(10);
		expect(clone.y).toBe(20);
		expect(clone.w).toBe(30);
		expect(clone.h).toBe(40);
	});

	it("returns a different instance", () => {
		const r = new Rect(10, 20, 30, 40);
		const clone = r.clone();
		expect(clone).not.toBe(r);
	});

	it("handles zero rect", () => {
		const r = new Rect();
		const clone = r.clone();
		expect(clone.x).toBe(0);
		expect(clone.y).toBe(0);
		expect(clone.w).toBe(0);
		expect(clone.h).toBe(0);
	});

	it("handles negative values", () => {
		const r = new Rect(-10, -20, -30, -40);
		const clone = r.clone();
		expect(clone.x).toBe(-10);
		expect(clone.y).toBe(-20);
		expect(clone.w).toBe(-30);
		expect(clone.h).toBe(-40);
	});

	it("clone is independent", () => {
		const r = new Rect(10, 20, 30, 40);
		const clone = r.clone();
		clone.set(1, 2, 3, 4);
		expect(r.x).toBe(10);
		expect(r.y).toBe(20);
		expect(r.w).toBe(30);
		expect(r.h).toBe(40);
	});
});

// ==================== equals ====================

describe("equals", () => {
	it("returns true for equal position and withSize true", () => {
		const a = new Rect(10, 20, 30, 40);
		const b = new Rect(10, 20, 30, 40);
		expect(a.equals(b, true)).toBe(true);
	});

	it("returns true for equal position and withSize false", () => {
		const a = new Rect(10, 20, 30, 40);
		const b = new Rect(10, 20, 99, 99);
		expect(a.equals(b, false)).toBe(true);
	});

	it("returns false for different position", () => {
		const a = new Rect(10, 20, 30, 40);
		const b = new Rect(11, 20, 30, 40);
		expect(a.equals(b, true)).toBe(false);
	});

	it("returns false for different position with withSize false", () => {
		const a = new Rect(10, 20, 30, 40);
		const b = new Rect(10, 21, 30, 40);
		expect(a.equals(b, false)).toBe(false);
	});

	it("returns false for different size with withSize true", () => {
		const a = new Rect(10, 20, 30, 40);
		const b = new Rect(10, 20, 31, 40);
		expect(a.equals(b, true)).toBe(false);
	});

	it("returns false for different height with withSize true", () => {
		const a = new Rect(10, 20, 30, 40);
		const b = new Rect(10, 20, 30, 41);
		expect(a.equals(b, true)).toBe(false);
	});

	it("returns true for zero rects", () => {
		const a = new Rect();
		const b = new Rect();
		expect(a.equals(b, true)).toBe(true);
	});

	it("returns true for equal negative rects", () => {
		const a = new Rect(-10, -20, -30, -40);
		const b = new Rect(-10, -20, -30, -40);
		expect(a.equals(b, true)).toBe(true);
	});

	it("returns true when width differs with withSize false", () => {
		const a = new Rect(10, 20, 30, 40);
		const b = new Rect(10, 20, 31, 40);
		expect(a.equals(b, false)).toBe(true);
	});
});
