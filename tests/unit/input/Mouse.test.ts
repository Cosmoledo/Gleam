import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockGame } from "../createMockGame";
import { MOUSE_KEYS } from "@/input/Mouse";
import Game from "@/core/Game";
import Vec2 from "@/core/Vec2";

// ==================== MOUSE_KEYS ====================

describe("MOUSE_KEYS", () => {
	it("has all expected button entries", () => {
		expect(MOUSE_KEYS.LEFT).toBe(0);
		expect(MOUSE_KEYS.MIDDLE).toBe(1);
		expect(MOUSE_KEYS.RIGHT).toBe(2);
		expect(MOUSE_KEYS.PREV).toBe(3);
		expect(MOUSE_KEYS.FORWARD).toBe(4);
	});
});

// ==================== Mouse ====================

describe("Mouse", () => {
	let mockGame: Game;
	let pointermoveCb: ((e: MouseEvent) => void) | null = null;
	let mousedownCb: ((e: MouseEvent) => void) | null = null;
	let mouseupCb: ((e: MouseEvent) => void) | null = null;

	beforeEach(() => {
		mockGame = createMockGame();
		pointermoveCb = null;
		mousedownCb = null;
		mouseupCb = null;
		vi.spyOn(window, "addEventListener").mockImplementation((type, cb) => {
			if (type === "pointermove") {
				pointermoveCb = cb as (e: MouseEvent) => void;
			}
			if (type === "mousedown") {
				mousedownCb = cb as (e: MouseEvent) => void;
			}
			if (type === "mouseup") {
				mouseupCb = cb as (e: MouseEvent) => void;
			}
		});
	});

	it("registers pointermove, mousedown, and mouseup event listeners", async () => {
		const { default: Mouse } = await import("@/input/Mouse");
		new Mouse(mockGame);
		expect(pointermoveCb).toBeInstanceOf(Function);
		expect(mousedownCb).toBeInstanceOf(Function);
		expect(mouseupCb).toBeInstanceOf(Function);
	});

	it("initializes all Vec2 properties", async () => {
		const { default: Mouse } = await import("@/input/Mouse");
		const mouse = new Mouse(mockGame);
		expect(mouse.posReal).toBeInstanceOf(Vec2);
		expect(mouse.posRealLast).toBeInstanceOf(Vec2);
		expect(mouse.posScaled).toBeInstanceOf(Vec2);
		expect(mouse.posScaledLast).toBeInstanceOf(Vec2);
		expect(mouse.size).toBeInstanceOf(Vec2);
	});

	it("initializes pressed array", async () => {
		const { default: Mouse } = await import("@/input/Mouse");
		const mouse = new Mouse(mockGame);
		expect(Array.isArray(mouse.pressed)).toBe(true);
	});

	it("initializes hasMoved to false", async () => {
		const { default: Mouse } = await import("@/input/Mouse");
		const mouse = new Mouse(mockGame);
		expect(mouse.hasMoved).toBe(false);
	});

	it("initializes lastEvent to null", async () => {
		const { default: Mouse } = await import("@/input/Mouse");
		const mouse = new Mouse(mockGame);
		expect(mouse.lastEvent).toBeNull();
	});

	it("initializes size to Vec2(10, 10)", async () => {
		const { default: Mouse } = await import("@/input/Mouse");
		const mouse = new Mouse(mockGame);
		expect(mouse.size.x).toBe(10);
		expect(mouse.size.y).toBe(10);
	});

	// ==================== pointermove ====================

	describe("pointermove", () => {
		it("sets hasMoved to true when mouse moves over canvas", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			const mouse = new Mouse(mockGame);
			pointermoveCb!({
				clientX: 100,
				clientY: 200,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as MouseEvent);
			expect(mouse.hasMoved).toBe(true);
		});

		it("prevents default when target is canvas", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			const preventDefault = vi.fn();
			new Mouse(mockGame);
			pointermoveCb!({
				clientX: 100,
				clientY: 200,
				target: mockGame.canman.canvas,
				preventDefault,
			} as unknown as MouseEvent);
			expect(preventDefault).toHaveBeenCalled();
		});

		it("does not prevent default when target is not canvas", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			new Mouse(mockGame);
			const preventDefault = vi.fn();
			pointermoveCb!({
				clientX: 100,
				clientY: 200,
				target: null,
				preventDefault,
			} as unknown as MouseEvent);
			expect(preventDefault).not.toHaveBeenCalled();
		});

		it("sets lastEvent to the event", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			const mouse = new Mouse(mockGame);
			const event = {
				clientX: 50,
				clientY: 75,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as MouseEvent;
			pointermoveCb!(event);
			expect(mouse.lastEvent).toBe(event);
		});

		it("dispatches MOUSE event", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			const mouse = new Mouse(mockGame);
			pointermoveCb!({
				clientX: 100,
				clientY: 200,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as MouseEvent);
			expect(mockGame.events.dispatchEvent).toHaveBeenCalledWith(
				"mouse",
				mouse,
			);
		});

		it("updates posReal with client + size offset", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			const mouse = new Mouse(mockGame);
			pointermoveCb!({
				clientX: 100,
				clientY: 200,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as MouseEvent);
			expect(mouse.posReal.x).toBe(105);
			expect(mouse.posReal.y).toBe(205);
		});

		it("updates posScaled when canvas bounds are zero", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			mockGame.canman.canvasBoundingClientRect = {
				left: 0,
				top: 0,
				width: 0,
				height: 0,
			} as unknown as DOMRect;
			const mouse = new Mouse(mockGame);
			pointermoveCb!({
				clientX: 100,
				clientY: 200,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as MouseEvent);
			expect(mouse.posScaled.x).toBe(0);
			expect(mouse.posScaled.y).toBe(0);
		});

		it("updates posScaledLast before posScaled", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			const mouse = new Mouse(mockGame);
			pointermoveCb!({
				clientX: 100,
				clientY: 200,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as MouseEvent);
			expect(mouse.posScaledLast.x).toBe(0);
			expect(mouse.posScaledLast.y).toBe(0);
		});

		it("clamps posScaled to canvas boundaries", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			mockGame.canman.canvasBoundingClientRect = {
				left: 0,
				top: 0,
				width: 800,
				height: 600,
			} as unknown as DOMRect;
			const mouse = new Mouse(mockGame);
			pointermoveCb!({
				clientX: -1000,
				clientY: -1000,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as MouseEvent);
			expect(mouse.posScaled.x).toBe(0);
			expect(mouse.posScaled.y).toBe(0);
			pointermoveCb!({
				clientX: 2000,
				clientY: 2000,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as MouseEvent);
			expect(mouse.posScaled.x).toBe(800);
			expect(mouse.posScaled.y).toBe(600);
		});
	});

	// ==================== mousedown / mouseup ====================

	describe("mousedown / mouseup", () => {
		it("sets pressed[button] to true on mousedown", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			const mouse = new Mouse(mockGame);
			mousedownCb!({
				type: "mousedown",
				button: 0,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as MouseEvent);
			expect(mouse.pressed[0]).toBe(true);
		});

		it("sets pressed[button] to false on mouseup", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			const mouse = new Mouse(mockGame);
			mousedownCb!({
				type: "mousedown",
				button: 1,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as MouseEvent);
			expect(mouse.pressed[1]).toBe(true);
			mouseupCb!({
				type: "mouseup",
				button: 1,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as MouseEvent);
			expect(mouse.pressed[1]).toBe(false);
		});

		it("sets lastEvent to the event on mousedown", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			const mouse = new Mouse(mockGame);
			const event = {
				type: "mousedown",
				button: 0,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as MouseEvent;
			mousedownCb!(event);
			expect(mouse.lastEvent).toBe(event);
		});

		it("sets lastEvent to the event on mouseup", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			const mouse = new Mouse(mockGame);
			const event = {
				type: "mouseup",
				button: 2,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as MouseEvent;
			mouseupCb!(event);
			expect(mouse.lastEvent).toBe(event);
		});

		it("dispatches MOUSE event on mousedown", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			const mouse = new Mouse(mockGame);
			mousedownCb!({
				type: "mousedown",
				button: 0,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as MouseEvent);
			expect(mockGame.events.dispatchEvent).toHaveBeenCalledWith(
				"mouse",
				mouse,
			);
		});

		it("dispatches MOUSE event on mouseup", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			const mouse = new Mouse(mockGame);
			mouseupCb!({
				type: "mouseup",
				button: 0,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as MouseEvent);
			expect(mockGame.events.dispatchEvent).toHaveBeenCalledWith(
				"mouse",
				mouse,
			);
		});

		it("prevents default when target is canvas on mousedown", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			const preventDefault = vi.fn();
			new Mouse(mockGame);
			mousedownCb!({
				type: "mousedown",
				button: 0,
				target: mockGame.canman.canvas,
				preventDefault,
			} as unknown as MouseEvent);
			expect(preventDefault).toHaveBeenCalled();
		});

		it("prevents default when target is canvas on mouseup", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			const preventDefault = vi.fn();
			new Mouse(mockGame);
			mouseupCb!({
				type: "mouseup",
				button: 0,
				target: mockGame.canman.canvas,
				preventDefault,
			} as unknown as MouseEvent);
			expect(preventDefault).toHaveBeenCalled();
		});

		it("does not prevent default when target is not canvas", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			new Mouse(mockGame);
			const preventDefault = vi.fn();
			mousedownCb!({
				type: "mousedown",
				button: 0,
				target: null,
				preventDefault,
			} as unknown as MouseEvent);
			expect(preventDefault).not.toHaveBeenCalled();
		});

		it("handles all mouse buttons on mousedown", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			const mouse = new Mouse(mockGame);
			for (let btn = 0; btn <= 4; btn++) {
				mousedownCb!({
					type: "mousedown",
					button: btn,
					target: mockGame.canman.canvas,
					preventDefault: vi.fn(),
				} as unknown as MouseEvent);
				expect(mouse.pressed[btn]).toBe(true);
			}
		});

		it("handles all mouse buttons on mouseup", async () => {
			const { default: Mouse } = await import("@/input/Mouse");
			const mouse = new Mouse(mockGame);
			for (let btn = 0; btn <= 4; btn++) {
				mousedownCb!({
					type: "mousedown",
					button: btn,
					target: mockGame.canman.canvas,
					preventDefault: vi.fn(),
				} as unknown as MouseEvent);
			}
			for (let btn = 0; btn <= 4; btn++) {
				mouseupCb!({
					type: "mouseup",
					button: btn,
					target: mockGame.canman.canvas,
					preventDefault: vi.fn(),
				} as unknown as MouseEvent);
				expect(mouse.pressed[btn]).toBe(false);
			}
		});
	});
});
