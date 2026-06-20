import { beforeEach, describe, expect, it, vi } from "vitest";

import ControllerCursor from "@/content/ControllerCursor";
import Vec2 from "@/math/Vec2";
import type Controller from "@/input/Controller";

function createMockController(axes: Vec2[]): Controller {
	return { poll: vi.fn(() => axes) } as unknown as Controller;
}

function drawCalls(
	ctx: CanvasRenderingContext2D,
): { x: number; y: number }[] {
	return (ctx.drawImage as ReturnType<typeof vi.fn>).mock.calls.map(c => ({
		x: c[1] as number,
		y: c[2] as number,
	}));
}

describe("ControllerCursor", () => {
	let crosshair: HTMLImageElement;
	let ctx: CanvasRenderingContext2D;

	beforeEach(() => {
		crosshair = { width: 48, height: 48 } as HTMLImageElement;
		ctx = { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D;
	});

	describe("constructor", () => {
		it("allocates one stick entry per anchor", () => {
			const controller = createMockController([]);
			const cursor = new ControllerCursor(controller, crosshair, [
				new Vec2(100, 100),
				new Vec2(200, 200),
				new Vec2(300, 300),
			]);
			cursor.draw(ctx);
			expect(ctx.drawImage).toHaveBeenCalledTimes(3);
		});

		it("clones anchors so caller mutation does not affect the cursor", () => {
			const controller = createMockController([]);
			const anchor = new Vec2(100, 100);
			const cursor = new ControllerCursor(controller, crosshair, [
				anchor,
			]);
			anchor.set(999, 999);
			cursor.draw(ctx);
			expect(drawCalls(ctx)[0]).toEqual({ x: 100, y: 100 });
		});
	});

	describe("draw", () => {
		it("draws the crosshair at pos + offset for each stick", () => {
			const controller = createMockController([]);
			const cursor = new ControllerCursor(controller, crosshair, [
				new Vec2(100, 100),
				new Vec2(200, 300),
			]);
			cursor.draw(ctx);
			expect(ctx.drawImage).toHaveBeenNthCalledWith(
				1,
				crosshair,
				100,
				100,
			);
			expect(ctx.drawImage).toHaveBeenNthCalledWith(
				2,
				crosshair,
				200,
				300,
			);
		});

		it("reflects the offset accumulated by update", () => {
			// HALF_LIFE is 0.05 — dt of 0.05 yields alpha = 0.5, so offset moves halfway to target.
			const controller = createMockController([new Vec2(1, 0)]);
			const cursor = new ControllerCursor(
				controller,
				crosshair,
				[new Vec2(0, 0)],
				100,
			);
			cursor.update(0.05);
			cursor.draw(ctx);
			expect(drawCalls(ctx)[0].x).toBeCloseTo(50, 5);
		});
	});

	describe("update", () => {
		it("queries the controller via poll()", () => {
			const controller = createMockController([new Vec2(0, 0)]);
			const cursor = new ControllerCursor(controller, crosshair, [
				new Vec2(0, 0),
			]);
			cursor.update(0.016);
			expect(controller.poll).toHaveBeenCalled();
		});

		it("approaches axi * range when the stick is held", () => {
			const controller = createMockController([new Vec2(1, 0.5)]);
			const cursor = new ControllerCursor(
				controller,
				crosshair,
				[new Vec2(0, 0)],
				100,
			);
			for (let i = 0; i < 100; i++) {
				cursor.update(0.016);
			}
			cursor.draw(ctx);
			const last = drawCalls(ctx).pop()!;
			expect(last.x).toBeCloseTo(100, 1);
			expect(last.y).toBeCloseTo(50, 1);
		});

		it("decays the offset back to zero when the stick is released", () => {
			const axes = [new Vec2(1, 1)];
			const controller = createMockController(axes);
			const cursor = new ControllerCursor(
				controller,
				crosshair,
				[new Vec2(0, 0)],
				100,
			);
			for (let i = 0; i < 100; i++) {
				cursor.update(0.016);
			}
			axes[0].set(0, 0);
			for (let i = 0; i < 100; i++) {
				cursor.update(0.016);
			}
			cursor.draw(ctx);
			const last = drawCalls(ctx).pop()!;
			expect(last.x).toBeCloseTo(0, 1);
			expect(last.y).toBeCloseTo(0, 1);
		});

		it("uses the default range of 80 when none is passed", () => {
			const controller = createMockController([new Vec2(1, 0)]);
			const cursor = new ControllerCursor(controller, crosshair, [
				new Vec2(0, 0),
			]);
			for (let i = 0; i < 100; i++) {
				cursor.update(0.016);
			}
			cursor.draw(ctx);
			expect(drawCalls(ctx).pop()!.x).toBeCloseTo(80, 1);
		});

		it("tracks each stick independently", () => {
			const controller = createMockController([
				new Vec2(1, 0),
				new Vec2(0, 1),
			]);
			const cursor = new ControllerCursor(
				controller,
				crosshair,
				[new Vec2(0, 0), new Vec2(0, 0)],
				100,
			);
			for (let i = 0; i < 100; i++) {
				cursor.update(0.016);
			}
			cursor.draw(ctx);
			const calls = drawCalls(ctx);
			const first = calls[calls.length - 2];
			const second = calls[calls.length - 1];
			expect(first.x).toBeCloseTo(100, 1);
			expect(first.y).toBeCloseTo(0, 1);
			expect(second.x).toBeCloseTo(0, 1);
			expect(second.y).toBeCloseTo(100, 1);
		});
	});
});
