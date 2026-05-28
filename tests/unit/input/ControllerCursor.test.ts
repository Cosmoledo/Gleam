import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/loader/UrlLoaders", () => ({
	loadImage: vi.fn().mockResolvedValue({ width: 128, height: 128 }),
}));

import ControllerCursor from "@/input/ControllerCursor";
import Vec2 from "@/math/Vec2";
import type Controller from "@/input/Controller";
import type Game from "@/core/Game";
import { createMockGame } from "../createMockGame";

function createMockController(x: number, y: number): Controller {
	return {
		stick: vi.fn(() => new Vec2(x, y)),
	} as unknown as Controller;
}

describe("ControllerCursor", () => {
	let game: Game;
	let ctx: CanvasRenderingContext2D;

	function makeCursor(
		stickX: number,
		stickY: number,
		axisId = 0,
	): { controller: Controller; cursor: ControllerCursor } {
		const controller = createMockController(stickX, stickY);
		const cursor = new ControllerCursor(controller, game, axisId);
		return { controller, cursor };
	}

	function drawnPos(cursor: ControllerCursor): { x: number; y: number } {
		cursor.draw(ctx);
		const call = (ctx.drawImage as ReturnType<typeof vi.fn>).mock.lastCall!;
		return { x: call[1] as number, y: call[2] as number };
	}

	beforeAll(async () => {
		// allow the module-level IIFE that resolves CROSSHAIR to settle
		await Promise.resolve();
	});

	beforeEach(() => {
		game = createMockGame();
		ctx = { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D;
	});

	// ==================== constructor ====================

	describe("constructor", () => {
		it("initializes pos at the center of the canvas", () => {
			const { cursor } = makeCursor(0, 0);
			expect(drawnPos(cursor)).toEqual({ x: 400, y: 300 });
		});
	});

	// ==================== centerPos ====================

	describe("centerPos", () => {
		it("returns pos offset by half the crosshair size", () => {
			const { cursor } = makeCursor(0, 0);
			const center = cursor.centerPos;
			expect(center.x).toBe(400 + 64);
			expect(center.y).toBe(300 + 64);
		});

		it("returns a copy that does not alias the underlying pos", () => {
			const { cursor } = makeCursor(0, 0);
			const center = cursor.centerPos;
			center.x = 999;
			center.y = 999;
			expect(drawnPos(cursor)).toEqual({ x: 400, y: 300 });
		});
	});

	// ==================== draw ====================

	describe("draw", () => {
		it("draws the crosshair at the cursor position", () => {
			const { cursor } = makeCursor(0, 0);
			cursor.draw(ctx);
			expect(ctx.drawImage).toHaveBeenCalledWith(
				expect.objectContaining({ width: 128, height: 128 }),
				400,
				300,
			);
		});
	});

	// ==================== update ====================

	describe("update", () => {
		it("queries the controller using the cursor's axisId and advances pos", () => {
			// SPEED is 600; (0.5, 0.5) * 600 * 0.1 = (30, 30)
			const { controller, cursor } = makeCursor(0.5, 0.5, 1);
			cursor.update(0.1);
			expect(controller.stick).toHaveBeenCalledWith(1);
			expect(drawnPos(cursor)).toEqual({ x: 430, y: 330 });
		});

		it("leaves pos unchanged when stick is at rest", () => {
			const { cursor } = makeCursor(0, 0);
			cursor.update(0.016);
			expect(drawnPos(cursor)).toEqual({ x: 400, y: 300 });
		});

		it("advances pos by stick × SPEED × dt", () => {
			// SPEED is 600; (1, 1) * 600 * 0.1 = (60, 60)
			const { cursor } = makeCursor(1, 1);
			cursor.update(0.1);
			expect(drawnPos(cursor)).toEqual({ x: 460, y: 360 });
		});

		it("clamps pos at the top-left (0, 0) corner", () => {
			const { cursor } = makeCursor(-1, -1);
			cursor.update(10);
			expect(drawnPos(cursor)).toEqual({ x: 0, y: 0 });
		});

		it("clamps pos at the bottom-right corner (canvas size minus crosshair)", () => {
			const { cursor } = makeCursor(1, 1);
			cursor.update(10);
			expect(drawnPos(cursor)).toEqual({ x: 800 - 128, y: 600 - 128 });
		});
	});
});
