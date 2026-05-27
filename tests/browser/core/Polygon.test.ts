import { describe, expect, it, vi } from "vitest";

import Polygon from "@/core/Polygon";
import Vec2 from "@/core/Vec2";

import "@/prototypes/index";

// ==================== Polygon.fromCanvas ====================

describe("Polygon.fromCanvas", () => {
	it("throws when detail is too large for canvas content", () => {
		const canvas = document.createElement("canvas");
		canvas.width = 150;
		canvas.height = 100;

		expect(() => Polygon.fromCanvas(canvas, 100, 45)).toThrow(
			"Polygon.fromCanvas: scan produced \"0\" vertices (need >=3). Canvas may be empty or detail (100) too large.",
		);
	});

	it("creates a polygon from a filled rectangle", () => {
		const canvas = document.createElement("canvas");
		canvas.width = 100;
		canvas.height = 60;
		const ctx = canvas.getContext("2d")!;
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(10, 10, 80, 40);

		const p = Polygon.fromCanvas(canvas, 10, 10);
		expect(p.points.length).toBeGreaterThanOrEqual(3);
	});

	it("drops vertices when angle threshold is permissive", () => {
		const canvas = document.createElement("canvas");
		canvas.width = 100;
		canvas.height = 60;
		const ctx = canvas.getContext("2d")!;
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(10, 10, 80, 40);

		const p = Polygon.fromCanvas(canvas, 10, 360);
		expect(p).toBeInstanceOf(Polygon);
	});

	it("keeps every vertex when angle threshold is negative", () => {
		const canvas = document.createElement("canvas");
		canvas.width = 100;
		canvas.height = 60;
		const ctx = canvas.getContext("2d")!;
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(10, 10, 80, 40);

		const p = Polygon.fromCanvas(canvas, 10, -1);
		expect(p).toBeInstanceOf(Polygon);
	});
});

// ==================== draw ====================

describe("draw", () => {
	it("returns early for empty polygon", () => {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d")!;
		const spy = vi.spyOn(ctx, "beginPath");

		const p = new Polygon();
		p.draw(ctx);

		expect(spy).not.toHaveBeenCalled();
	});

	it("draws polygon vertices to context", () => {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d")!;

		const moveToSpy = vi.spyOn(ctx, "moveTo");
		const lineToSpy = vi.spyOn(ctx, "lineTo");
		const closePathSpy = vi.spyOn(ctx, "closePath");
		const strokeSpy = vi.spyOn(ctx, "stroke");

		const offset = new Vec2();
		const p = new Polygon(new Vec2(0, 0), new Vec2(10, 0), new Vec2(5, 10));
		p.draw(ctx, offset);

		expect(moveToSpy).toHaveBeenCalledTimes(1);
		expect(moveToSpy).toHaveBeenNthCalledWith(1, 0, 0);
		expect(lineToSpy).toHaveBeenCalledTimes(2);
		expect(lineToSpy).toHaveBeenNthCalledWith(1, 10, 0);
		expect(lineToSpy).toHaveBeenNthCalledWith(2, 5, 10);
		expect(closePathSpy).toHaveBeenCalledTimes(1);
		expect(strokeSpy).toHaveBeenCalledTimes(1);
	});
});
