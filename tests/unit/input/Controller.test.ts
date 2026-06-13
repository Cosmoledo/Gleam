import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ControllerCursor from "@/input/ControllerCursor";
import EventSystem from "@/core/EventSystem";
import Vec2 from "@/math/Vec2";
import type Game from "@/core/Game";
import { CONTROLLER_KEYS } from "@/input/Controller";
import { createMockGame } from "../createMockGame";

// ==================== CONTROLLER_KEYS ====================

describe("CONTROLLER_KEYS", () => {
	it("has all expected button entries with correct indices", () => {
		expect(CONTROLLER_KEYS.A).toBe(0);
		expect(CONTROLLER_KEYS.B).toBe(1);
		expect(CONTROLLER_KEYS.X).toBe(2);
		expect(CONTROLLER_KEYS.Y).toBe(3);
		expect(CONTROLLER_KEYS.LB).toBe(4);
		expect(CONTROLLER_KEYS.RB).toBe(5);
		expect(CONTROLLER_KEYS.LT).toBe(6);
		expect(CONTROLLER_KEYS.RT).toBe(7);
		expect(CONTROLLER_KEYS.SELECT).toBe(8);
		expect(CONTROLLER_KEYS.START).toBe(9);
		expect(CONTROLLER_KEYS.LEFT_STICK).toBe(10);
		expect(CONTROLLER_KEYS.RIGHT_STICK).toBe(11);
		expect(CONTROLLER_KEYS.UP).toBe(12);
		expect(CONTROLLER_KEYS.DOWN).toBe(13);
		expect(CONTROLLER_KEYS.LEFT).toBe(14);
		expect(CONTROLLER_KEYS.RIGHT).toBe(15);
		expect(CONTROLLER_KEYS.GUIDE).toBe(16);
	});
});

// ==================== Controller ====================

function createMockGamepad(
	buttons: boolean[],
	axes: number[],
	timestamp: number = 0,
	index: number = 0,
): Gamepad {
	const vibrationActuator = {
		playEffect: vi.fn(),
	};
	const buttonObjs: GamepadButton[] = buttons.map(b => ({
		pressed: b,
		value: 0,
		touched: false,
	}));
	return {
		index,
		buttons: buttonObjs,
		axes,
		timestamp,
		vibrationActuator:
			vibrationActuator as unknown as GamepadHapticActuator,
	} as unknown as Gamepad;
}

function defineGamepadSupport(gamepad: Gamepad) {
	Object.defineProperty(navigator, "getGamepads", {
		configurable: true,
		value: vi.fn(() => [gamepad]),
	});
}

function removeGamepadSupport() {
	if ("getGamepads" in navigator) {
		delete (navigator as any).getGamepads;
	}
}

describe("Controller", () => {
	let mockGame: Game;
	let dispatchSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		mockGame = createMockGame();
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		dispatchSpy = vi.spyOn(EventSystem, "dispatchEvent");
	});

	afterEach(() => {
		removeGamepadSupport();
		vi.restoreAllMocks();
	});

	// ==================== Constructor ====================

	describe("constructor", () => {
		it("logs error when navigator.getGamepads is not available", async () => {
			removeGamepadSupport();
			const { default: Controller } = await import("@/input/Controller");
			new Controller(mockGame);
			expect(console.error).toHaveBeenCalledWith(
				"Controller not supported!",
			);
		});

		it("creates cursors when gamepad support exists", async () => {
			const mockGp = createMockGamepad([false], [0, 0, 0, 0], 0, 0);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			expect(controller.cursors).toHaveLength(2);
			expect(controller.cursors[0]).toBeInstanceOf(ControllerCursor);
			expect(controller.cursors[1]).toBeInstanceOf(ControllerCursor);
		});

		it("calls vibrate and dispatches inputControllerConnected on gamepad connect", async () => {
			const mockGp = createMockGamepad([false], [0, 0, 0, 0], 0, 0);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			let connectedCb: ((e: GamepadEvent) => void) | null = null;
			vi.spyOn(window, "addEventListener").mockImplementation(
				(type, cb) => {
					if (type === "gamepadconnected") {
						connectedCb = cb as (e: GamepadEvent) => void;
					}
				},
			);
			const controller = new Controller(mockGame);
			if (connectedCb) {
				(connectedCb as (e: GamepadEvent) => void)({
					gamepad: mockGp,
				} as GamepadEvent);
			}
			expect(controller["index"]).toBe(mockGp.index);
			expect(mockGp.vibrationActuator.playEffect).toHaveBeenCalled();
			expect(dispatchSpy).toHaveBeenCalledWith(
				"inputControllerConnected",
				mockGp,
			);
		});

		it("dispatches INPUT_CONTROLLER_DISCONNECTED when own gamepad disconnects", async () => {
			const mockGp = createMockGamepad([false], [0, 0, 0, 0], 0, 5);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;

			let disconnectCb: ((e: GamepadEvent) => void) | null = null;
			vi.spyOn(window, "addEventListener").mockImplementation(
				(type, cb) => {
					if (type === "gamepaddisconnected") {
						disconnectCb = cb as (e: GamepadEvent) => void;
					}
				},
			);

			const controller2 = new Controller(mockGame);
			controller2["index"] = mockGp.index;

			if (disconnectCb) {
				(disconnectCb as (e: GamepadEvent) => void)({
					gamepad: mockGp,
				} as GamepadEvent);
				expect(dispatchSpy).toHaveBeenCalledWith(
					"inputControllerDisconnected",
				);
			}
		});

		it("does not dispatch INPUT_CONTROLLER_DISCONNECTED for different gamepad", async () => {
			const mockGp = createMockGamepad([false], [0, 0, 0, 0], 0, 5);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;

			const differentGamepad = { index: 99 } as Gamepad;

			vi.spyOn(window, "addEventListener").mockImplementation(
				(type, cb) => {
					if (type === "gamepaddisconnected") {
						(cb as (e: GamepadEvent) => void)({
							gamepad: differentGamepad,
						} as GamepadEvent);
					}
				},
			);

			const controller2 = new Controller(mockGame);
			controller2["index"] = mockGp.index;

			expect(dispatchSpy).not.toHaveBeenCalled();
		});
	});

	// ==================== draw ====================

	describe("draw", () => {
		it("returns early when no gamepad", async () => {
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller.draw({} as CanvasRenderingContext2D);
			expect(dispatchSpy).not.toHaveBeenCalled();
		});

		it("calls draw on all cursors when gamepad exists", async () => {
			const mockGp = createMockGamepad([false], [0, 0, 0, 0], 0, 0);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;

			const cursorDrawSpy = vi.spyOn(controller.cursors[0], "draw");
			const ctx = {
				drawImage: vi.fn(),
			} as unknown as CanvasRenderingContext2D;
			controller.draw(ctx);
			expect(cursorDrawSpy).toHaveBeenCalled();
		});
	});

	// ==================== update ====================

	describe("update", () => {
		it("returns early when no gamepad", async () => {
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller.update(16);
			expect(controller.buttons).toEqual([]);
		});

		it("returns early when timestamp has not changed", async () => {
			const mockGp = createMockGamepad([false], [0, 0, 0, 0], 1000, 0);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;
			controller["lastTime"] = 1000;
			controller.update(16);
			expect(dispatchSpy).not.toHaveBeenCalled();
		});

		it("updates buttons from gamepad", async () => {
			const mockGp = createMockGamepad(
				[true, false, true],
				[0, 0, 0, 0],
				1000,
				0,
			);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;
			controller["lastTime"] = 0;
			controller.update(16);
			expect(controller.buttons).toEqual([true, false, true]);
		});

		it("updates axes from gamepad", async () => {
			const mockGp = createMockGamepad(
				[false],
				[0.5, -0.5, 0.25, 0.75],
				1000,
				0,
			);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;
			controller["lastTime"] = 0;
			controller.update(16);
			expect(controller["axes"]).toHaveLength(2);
			expect(controller["axes"][0]).toBeInstanceOf(Vec2);
		});

		it("does not dispatch inputControllerConnected from per-frame updates", async () => {
			const mockGp = createMockGamepad([true], [0, 0, 0, 0], 1000, 0);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;
			controller["lastTime"] = 0;
			dispatchSpy.mockClear();
			controller.update(16);
			expect(dispatchSpy).not.toHaveBeenCalled();
		});

		it("updates lastTime to gamepad timestamp", async () => {
			const mockGp = createMockGamepad([false], [0, 0, 0, 0], 2000, 0);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;
			controller["lastTime"] = 0;
			controller.update(16);
			expect(controller["lastTime"]).toBe(2000);
		});

		it("handles odd number of axes", async () => {
			const mockGp = createMockGamepad(
				[false],
				[0.5, -0.5, 0.25],
				1000,
				0,
			);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;
			controller["lastTime"] = 0;
			controller.update(16);
			expect(controller["axes"]).toHaveLength(1);
		});

		it("safely handles navigator.getGamepads() returning nullish at the tracked index", async () => {
			Object.defineProperty(navigator, "getGamepads", {
				configurable: true,
				value: vi.fn(() => []),
			});
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = 0;
			controller["lastTime"] = 0;
			controller.update(16);
			expect(controller.buttons).toEqual([]);
			expect(dispatchSpy).not.toHaveBeenCalled();
		});

		it("re-polls navigator.getGamepads() each frame for fresh state", async () => {
			let currentGp = createMockGamepad([false], [0, 0], 1000, 0);
			Object.defineProperty(navigator, "getGamepads", {
				configurable: true,
				value: vi.fn(() => [currentGp]),
			});
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = 0;
			controller["lastTime"] = 0;
			controller.update(16);
			expect(controller.buttons).toEqual([false]);

			currentGp = createMockGamepad([true], [0, 0], 2000, 0);
			controller.update(16);
			expect(controller.buttons).toEqual([true]);
		});
	});

	// ==================== vibrate ====================

	describe("vibrate", () => {
		it("returns false when no gamepad", async () => {
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			expect(controller.vibrate()).toBe(false);
		});

		it("returns false when gamepad has no vibration actuator", async () => {
			const mockGp = createMockGamepad([false], [0, 0, 0, 0], 1000, 0);
			(mockGp.vibrationActuator as any) = null;
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;
			expect(controller.vibrate()).toBe(false);
		});

		it("calls playEffect with correct params when actuator exists", async () => {
			const mockGp = createMockGamepad([false], [0, 0, 0, 0], 1000, 0);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;
			controller.vibrate();
			expect(mockGp.vibrationActuator.playEffect).toHaveBeenCalledWith(
				"dual-rumble",
				{
					duration: 400,
					weakMagnitude: 1.0,
					startDelay: 0,
					strongMagnitude: 1.0,
				},
			);
		});

		it("returns true when actuator exists", async () => {
			const mockGp = createMockGamepad([false], [0, 0, 0, 0], 1000, 0);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;
			expect(controller.vibrate()).toBe(true);
		});
	});

	// ==================== stick ====================

	describe("stick", () => {
		it("returns Vec2(0, 0) when no gamepad", async () => {
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			const result = controller.stick(0);
			expect(result.x).toBe(0);
			expect(result.y).toBe(0);
		});

		it("returns Vec2(0, 0) when index out of range", async () => {
			const mockGp = createMockGamepad([false], [0, 0, 0, 0], 1000, 0);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;
			controller["axes"] = [new Vec2(0.5, 0.5)];
			const result = controller.stick(99);
			expect(result.x).toBe(0);
			expect(result.y).toBe(0);
		});

		it("returns deadzone-filtered stick values", async () => {
			const mockGp = createMockGamepad(
				[false],
				[0.5, 0.5, 0, 0],
				1000,
				0,
			);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;
			controller["axes"] = [new Vec2(0.5, 0.5), new Vec2(0, 0)];
			const result = controller.stick(0);
			expect(result.x).toBeGreaterThan(0);
			expect(result.y).toBeGreaterThan(0);
		});

		it("returns zero for values below threshold", async () => {
			const mockGp = createMockGamepad(
				[false],
				[0.1, 0.1, 0, 0],
				1000,
				0,
			);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;
			controller["axes"] = [new Vec2(0.1, 0.1), new Vec2(0, 0)];
			const result = controller.stick(0);
			expect(result.x).toBe(0);
			expect(result.y).toBe(0);
		});

		it("returns positive values for positive input", async () => {
			const mockGp = createMockGamepad([false], [1, 1, 0, 0], 1000, 0);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;
			controller["axes"] = [new Vec2(1, 1), new Vec2(0, 0)];
			const result = controller.stick(0);
			expect(result.x).toBe(1);
			expect(result.y).toBe(1);
		});

		it("returns negative values for negative input", async () => {
			const mockGp = createMockGamepad([false], [-1, -1, 0, 0], 1000, 0);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller["index"] = mockGp.index;
			controller["axes"] = [new Vec2(-1, -1), new Vec2(0, 0)];
			const result = controller.stick(0);
			expect(result.x).toBe(-1);
			expect(result.y).toBe(-1);
		});
	});

	// ==================== reset ====================

	describe("reset", () => {
		it("clears buttons and axes", async () => {
			const mockGp = createMockGamepad([true], [1, 1], 1000, 0);
			defineGamepadSupport(mockGp);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller.buttons = [true, false, true];
			controller["axes"] = [new Vec2(1, 1)];
			controller.reset();
			expect(controller.buttons.length).toBe(0);
			expect(controller["axes"].length).toBe(0);
		});

		it("is called when the window blur event fires", async () => {
			const mockGp = createMockGamepad([true], [0, 0], 1000, 0);
			defineGamepadSupport(mockGp);
			let blurCb: (() => void) | null = null;
			vi.spyOn(window, "addEventListener").mockImplementation(
				(type, cb) => {
					if (type === "blur") {
						blurCb = cb as () => void;
					}
				},
			);
			const { default: Controller } = await import("@/input/Controller");
			const controller = new Controller(mockGame);
			controller.buttons = [true, true];
			controller["axes"] = [new Vec2(0.5, 0.5)];
			blurCb!();
			expect(controller.buttons.length).toBe(0);
			expect(controller["axes"].length).toBe(0);
		});
	});
});
