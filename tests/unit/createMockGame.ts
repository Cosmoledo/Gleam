import { vi } from "vitest";

import Vec2 from "@/math/Vec2";
import type Game from "@/core/Game";

export function createMockGame(): Game {
	const canvas = document.createElement("canvas");
	canvas.width = 800;
	canvas.height = 600;
	const canvasContext = canvas.getContext("2d") as CanvasRenderingContext2D;
	const canman = {
		canvas,
		canvasContext,
		canvasBoundingClientRect: {
			left: 0,
			top: 0,
			width: 800,
			height: 600,
		},
		width: 800,
		height: 600,
		size: new Vec2(800, 600),
	};
	const gameloop = {
		stopLoop: vi.fn(),
	};
	const events = {
		dispatchEvent: vi.fn(),
	};
	const keyboard = {
		reset: vi.fn(),
	};
	return {
		canman,
		gameloop,
		events,
		keyboard,
		update: vi.fn(),
		draw: vi.fn(),
	} as unknown as Game;
}
