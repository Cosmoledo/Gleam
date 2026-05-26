import { describe, it, expect, vi } from "vitest";

import Polygon from "@/core/Polygon";
import Rect from "@/core/Rect";
import Vec2 from "@/core/Vec2";

// ==================== Polygon.fromEdges ====================

describe("Polygon.fromEdges", () => {
	it("creates a triangle from 3 edges", () => {
		const p = Polygon.fromEdges(3, new Vec2(10, 10));
		expect(p.points.length).toBe(3);
	});

	it("creates a square from 4 edges", () => {
		const p = Polygon.fromEdges(4, new Vec2(10, 10));
		expect(p.points.length).toBe(4);
	});

	it("creates a hexagon from 6 edges", () => {
		const p = Polygon.fromEdges(6, new Vec2(10, 10));
		expect(p.points.length).toBe(6);
	});

	it("accepts a number for size (square)", () => {
		const p = Polygon.fromEdges(4, 10);
		expect(p.points.length).toBe(4);
	});

	it("creates a pentagon from 5 edges", () => {
		const p = Polygon.fromEdges(5, new Vec2(10, 10));
		expect(p.points.length).toBe(5);
	});

	it("creates an octagon from 8 edges", () => {
		const p = Polygon.fromEdges(8, new Vec2(10, 10));
		expect(p.points.length).toBe(8);
	});

	it("handles rectangular size", () => {
		const p = Polygon.fromEdges(4, new Vec2(20, 10));
		expect(p.points.length).toBe(4);
	});
});

// ==================== Polygon.fromRect ====================

describe("Polygon.fromRect", () => {
	it("creates a rectangle polygon", () => {
		const rect = new Rect(0, 0, 10, 10);
		const p = Polygon.fromRect(rect);
		expect(p.points.length).toBe(4);
	});

	it("sets correct vertex positions", () => {
		const rect = new Rect(5, 10, 20, 30);
		const p = Polygon.fromRect(rect);
		expect(p.points[0].x).toBe(5);
		expect(p.points[0].y).toBe(10);
		expect(p.points[1].x).toBe(25);
		expect(p.points[1].y).toBe(10);
		expect(p.points[2].x).toBe(25);
		expect(p.points[2].y).toBe(40);
		expect(p.points[3].x).toBe(5);
		expect(p.points[3].y).toBe(40);
	});

	it("handles zero-size rect", () => {
		const rect = new Rect(0, 0, 0, 0);
		const p = Polygon.fromRect(rect);
		expect(p.points.length).toBe(4);
	});

	it("handles negative position rect", () => {
		const rect = new Rect(-10, -5, 20, 15);
		const p = Polygon.fromRect(rect);
		expect(p.points[0].x).toBe(-10);
		expect(p.points[0].y).toBe(-5);
	});
});

// ==================== center getter ====================

describe("center", () => {
	it("returns the centroid of the polygon", () => {
		const p = new Polygon(
			new Vec2(0, 0),
			new Vec2(10, 0),
			new Vec2(10, 10),
			new Vec2(0, 10),
		);
		const c = p.center;
		expect(c.x).toBe(5);
		expect(c.y).toBe(5);
	});

	it("handles asymmetric vertices", () => {
		const p = new Polygon(new Vec2(0, 0), new Vec2(10, 0), new Vec2(5, 10));
		const c = p.center;
		expect(c.x).toBeCloseTo(5);
		expect(c.y).toBeCloseTo(10 / 3);
	});

	it("handles two points (degenerate polygon)", () => {
		const p = new Polygon(new Vec2(0, 0), new Vec2(10, 10));
		const c = p.center;
		expect(c.x).toBe(5);
		expect(c.y).toBe(5);
	});
});

// ==================== buildEdges ====================

describe("buildEdges", () => {
	it("computes edges from vertices", () => {
		const p = new Polygon(new Vec2(0, 0), new Vec2(10, 0), new Vec2(5, 10));
		p.buildEdges();
		expect(p.edges.length).toBe(3);
		expect(p.edges[0].x).toBe(10);
		expect(p.edges[0].y).toBe(0);
		expect(p.edges[1].x).toBe(-5);
		expect(p.edges[1].y).toBe(10);
		expect(p.edges[2].x).toBe(-5);
		expect(p.edges[2].y).toBe(-10);
	});

	it("updates edges after adding a point", () => {
		const p = new Polygon(new Vec2(0, 0), new Vec2(10, 0));
		p.buildEdges();
		expect(p.edges.length).toBe(2);
		p.addPoint(5, 10);
		expect(p.points.length).toBe(3);
		p.buildEdges();
		expect(p.edges.length).toBe(3);
	});
});

// ==================== addPoint ====================

describe("addPoint", () => {
	it("adds a vertex", () => {
		const p = new Polygon(new Vec2(0, 0), new Vec2(10, 0));
		p.addPoint(5, 10);
		expect(p.points.length).toBe(3);
	});

	it("returns this for chaining", () => {
		const p = new Polygon(new Vec2(0, 0));
		expect(p.addPoint(1, 1)).toBe(p);
	});

	it("updates edges after adding", () => {
		const p = new Polygon(new Vec2(0, 0), new Vec2(10, 0));
		expect(p.edges.length).toBe(2);
		p.addPoint(5, 10);
		p.buildEdges();
		expect(p.edges.length).toBe(3);
	});
});

// ==================== offset ====================

describe("offset", () => {
	it("translates all vertices", () => {
		const p = new Polygon(new Vec2(0, 0), new Vec2(10, 0), new Vec2(5, 10));
		p.offset(10, 20);
		expect(p.points[0].x).toBe(10);
		expect(p.points[0].y).toBe(20);
		expect(p.points[1].x).toBe(20);
		expect(p.points[1].y).toBe(20);
	});

	it("uses same value for x and y", () => {
		const p = new Polygon(new Vec2(0, 0), new Vec2(5, 5));
		p.offset(3, 3);
		expect(p.points[0].x).toBe(3);
		expect(p.points[0].y).toBe(3);
	});

	it("returns this for chaining", () => {
		const p = new Polygon(new Vec2(0, 0));
		expect(p.offset(1, 1)).toBe(p);
	});

	it("rebuilds edges", () => {
		const p = new Polygon(new Vec2(0, 0), new Vec2(10, 0), new Vec2(5, 10));
		const edgeBefore = p.edges[0].clone();
		p.offset(1, 1);
		expect(p.edges[0].x).toBe(edgeBefore.x);
		expect(p.edges[0].y).toBe(edgeBefore.y);
	});
});

// ==================== rotate ====================

describe("rotate", () => {
	it("does nothing when angle is 0", () => {
		const p = new Polygon(new Vec2(0, 0), new Vec2(10, 0), new Vec2(5, 10));
		const points = p.points.map(pt => pt.clone());
		p.rotate(0);
		p.points.forEach((pt, i) => {
			expect(pt.x).toBe(points[i].x);
			expect(pt.y).toBe(points[i].y);
		});
	});

	it("returns this when angle is 0", () => {
		const p = new Polygon(new Vec2(0, 0));
		expect(p.rotate(0)).toBe(p);
	});

	it("rotates around center by PI/2", () => {
		const p = new Polygon(
			new Vec2(0, 0),
			new Vec2(10, 0),
			new Vec2(10, 10),
			new Vec2(0, 10),
		);
		p.rotate(Math.PI / 2);
		expect(p.points[0].x).toBeCloseTo(10);
		expect(p.points[0].y).toBeCloseTo(0);
		expect(p.points[1].x).toBeCloseTo(10);
		expect(p.points[1].y).toBeCloseTo(10);
		expect(p.points[2].x).toBeCloseTo(0);
		expect(p.points[2].y).toBeCloseTo(10);
		expect(p.points[3].x).toBeCloseTo(0);
		expect(p.points[3].y).toBeCloseTo(0);
	});

	it("rotates around a custom pivot point", () => {
		const p = new Polygon(new Vec2(0, 0), new Vec2(10, 0));
		p.rotate(Math.PI / 2, new Vec2(5, 5));
		expect(p.points[0].x).toBeCloseTo(10);
		expect(p.points[0].y).toBeCloseTo(0);
		expect(p.points[1].x).toBeCloseTo(10);
		expect(p.points[1].y).toBeCloseTo(10);
	});

	it("returns this for chaining", () => {
		const p = new Polygon(new Vec2(0, 0), new Vec2(1, 1));
		expect(p.rotate(Math.PI / 4)).toBe(p);
	});
});

// ==================== collide ====================

describe("collide", () => {
	it("returns no collision when one polygon has no edges", () => {
		const p1 = new Polygon();
		const p2 = new Polygon(
			new Vec2(0, 0),
			new Vec2(10, 0),
			new Vec2(5, 10),
		);
		const result = p1.collide(p2);
		expect(result.intersect).toBe(false);
		expect(result.willIntersect).toBe(false);
	});

	it("returns no collision when both polygons have no edges", () => {
		const p1 = new Polygon();
		const p2 = new Polygon();
		const result = p1.collide(p2);
		expect(result.intersect).toBe(false);
		expect(result.willIntersect).toBe(false);
	});

	it("detects intersecting polygons", () => {
		const p1 = new Polygon(
			new Vec2(0, 0),
			new Vec2(10, 0),
			new Vec2(10, 10),
			new Vec2(0, 10),
		);
		const p2 = new Polygon(
			new Vec2(5, 5),
			new Vec2(15, 5),
			new Vec2(15, 15),
			new Vec2(5, 15),
		);
		const result = p1.collide(p2);
		expect(result.intersect).toBe(true);
		expect(result.willIntersect).toBe(true);
	});

	it("detects non-intersecting polygons", () => {
		const p1 = new Polygon(
			new Vec2(0, 0),
			new Vec2(10, 0),
			new Vec2(10, 10),
			new Vec2(0, 10),
		);
		const p2 = new Polygon(
			new Vec2(15, 0),
			new Vec2(25, 0),
			new Vec2(25, 10),
			new Vec2(15, 10),
		);
		const result = p1.collide(p2);
		expect(result.intersect).toBe(false);
		expect(result.willIntersect).toBe(false);
	});

	it("traces a warning when one polygon has no edges", () => {
		const traceSpy = vi
			.spyOn(console, "trace")
			.mockImplementation(() => {});
		const nowSpy = vi.spyOn(performance, "now").mockReturnValue(1e9);

		const p1 = new Polygon();
		const p2 = new Polygon(
			new Vec2(0, 0),
			new Vec2(10, 0),
			new Vec2(5, 10),
		);
		p1.collide(p2);

		expect(traceSpy).toHaveBeenCalled();

		nowSpy.mockRestore();
		traceSpy.mockRestore();
	});

	it("detects willIntersect with velocity", () => {
		const p1 = new Polygon(
			new Vec2(0, 0),
			new Vec2(10, 0),
			new Vec2(10, 10),
			new Vec2(0, 10),
		);
		const p2 = new Polygon(
			new Vec2(15, 0),
			new Vec2(25, 0),
			new Vec2(25, 10),
			new Vec2(15, 10),
		);
		const result = p2.collide(p1, new Vec2(-15, 0));
		expect(result.willIntersect).toBe(true);
		expect(result.minimumTranslationVector.length()).toBeGreaterThan(0);
	});
});

// ==================== clone ====================

describe("clone", () => {
	it("returns a new Polygon with same vertices", () => {
		const p = new Polygon(new Vec2(0, 0), new Vec2(10, 0), new Vec2(5, 10));
		const c = p.clone();
		expect(c.points.length).toBe(3);
		expect(c.points[0].x).toBe(0);
		expect(c.points[0].y).toBe(0);
		expect(c.points[1].x).toBe(10);
		expect(c.points[1].y).toBe(0);
		expect(c.points[2].x).toBe(5);
		expect(c.points[2].y).toBe(10);
	});

	it("returns a different instance", () => {
		const p = new Polygon(new Vec2(0, 0));
		const c = p.clone();
		expect(c).not.toBe(p);
	});
});
