import { vi } from "vitest";

import Vec2 from "@/core/Vec2";
import type Game from "@/core/Game";

export function createMockGame(): Game {
	const canman = {
		canvas: { width: 800, height: 600 },
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
	return {
		canman,
		gameloop,
		events,
	} as unknown as Game;
}
