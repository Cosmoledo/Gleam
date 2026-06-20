import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Controller, { CONTROLLER_KEYS } from "@/input/Controller";
import EventSystem from "@/core/EventSystem";
import Vec2 from "@/math/Vec2";

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
	const vibrationActuator = { playEffect: vi.fn() };
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

function defineGamepadSupport(gamepad: Gamepad | null) {
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

interface Handlers {
	connect?: (e: GamepadEvent) => void;
	disconnect?: (e: GamepadEvent) => void;
	blur?: () => void;
}

function captureHandlers(): Handlers {
	const handlers: Handlers = {};
	vi.spyOn(window, "addEventListener").mockImplementation((type, cb) => {
		if (type === "gamepadconnected") {
			handlers.connect = cb as (e: GamepadEvent) => void;
		} else if (type === "gamepaddisconnected") {
			handlers.disconnect = cb as (e: GamepadEvent) => void;
		} else if (type === "blur") {
			handlers.blur = cb as () => void;
		}
	});
	return handlers;
}

describe("Controller", () => {
	let dispatchSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		dispatchSpy = vi.spyOn(EventSystem, "dispatchEvent");
	});

	afterEach(() => {
		removeGamepadSupport();
		vi.restoreAllMocks();
	});

	describe("constructor", () => {
		it("logs error when navigator.getGamepads is not available", () => {
			removeGamepadSupport();
			new Controller();
			expect(console.error).toHaveBeenCalledWith(
				"Controller not supported!",
			);
		});

		it("registers gamepad and blur listeners", () => {
			const mockGp = createMockGamepad([], [0, 0]);
			defineGamepadSupport(mockGp);
			const handlers = captureHandlers();
			new Controller();
			expect(handlers.connect).toBeDefined();
			expect(handlers.disconnect).toBeDefined();
			expect(handlers.blur).toBeDefined();
		});
	});

	describe("gamepadconnected", () => {
		it("sets index, pre-allocates one Vec2 per stick pair, vibrates, and dispatches event", () => {
			const mockGp = createMockGamepad([], [0, 0, 0, 0], 0, 0);
			defineGamepadSupport(mockGp);
			const handlers = captureHandlers();
			const controller = new Controller();
			handlers.connect!({ gamepad: mockGp } as GamepadEvent);

			expect(controller["index"]).toBe(0);
			expect(controller["axes"]).toHaveLength(2);
			expect(controller["axes"][0]).toBeInstanceOf(Vec2);
			expect(mockGp.vibrationActuator.playEffect).toHaveBeenCalled();
			expect(dispatchSpy).toHaveBeenCalledWith(
				"inputControllerConnected",
				mockGp,
			);
		});
	});

	describe("gamepaddisconnected", () => {
		it("resets and dispatches event when our gamepad disconnects", () => {
			const mockGp = createMockGamepad([true], [0.5, 0.5], 0, 5);
			defineGamepadSupport(mockGp);
			const handlers = captureHandlers();
			const controller = new Controller();
			controller["index"] = 5;
			controller.buttons = [true];
			controller["axes"] = [new Vec2(0.5, 0.5)];

			handlers.disconnect!({ gamepad: mockGp } as GamepadEvent);

			expect(controller["index"]).toBe(-1);
			expect(controller.buttons).toHaveLength(0);
			expect(controller["axes"]).toHaveLength(0);
			expect(dispatchSpy).toHaveBeenCalledWith(
				"inputControllerDisconnected",
			);
		});

		it("ignores disconnect events from other gamepads", () => {
			const ourGp = createMockGamepad([], [0, 0], 0, 5);
			defineGamepadSupport(ourGp);
			const handlers = captureHandlers();
			const controller = new Controller();
			controller["index"] = 5;

			const otherGp = { index: 99 } as Gamepad;
			handlers.disconnect!({ gamepad: otherGp } as GamepadEvent);

			expect(controller["index"]).toBe(5);
			expect(dispatchSpy).not.toHaveBeenCalledWith(
				"inputControllerDisconnected",
			);
		});
	});

	describe("poll", () => {
		it("returns the (empty) axes array when no gamepad is connected", () => {
			defineGamepadSupport(null);
			const controller = new Controller();
			expect(controller.poll()).toEqual([]);
			expect(controller.buttons).toEqual([]);
		});

		it("returns cached axes when timestamp has not changed", () => {
			const mockGp = createMockGamepad([true], [0.5, 0.5], 1000, 0);
			defineGamepadSupport(mockGp);
			const controller = new Controller();
			controller["index"] = 0;
			controller["axes"] = [new Vec2()];
			controller["lastTime"] = 1000;
			controller.poll();
			expect(controller.buttons).toEqual([]);
		});

		it("updates buttons and lastTime on a fresh frame", () => {
			const mockGp = createMockGamepad(
				[true, false, true],
				[0, 0],
				2000,
				0,
			);
			defineGamepadSupport(mockGp);
			const controller = new Controller();
			controller["index"] = 0;
			controller["axes"] = [new Vec2()];

			controller.poll();
			expect(controller.buttons).toEqual([true, false, true]);
			expect(controller["lastTime"]).toBe(2000);
		});

		it("zeros axes below the deadzone", () => {
			const mockGp = createMockGamepad([], [0.1, 0.1], 1000, 0);
			defineGamepadSupport(mockGp);
			const controller = new Controller();
			controller["index"] = 0;
			controller["axes"] = [new Vec2()];

			const axes = controller.poll();
			expect(axes[0].x).toBe(0);
			expect(axes[0].y).toBe(0);
		});

		it("uses radial (not per-axis) deadzone: small diagonals just above DEADZONE register", () => {
			// (0.2, 0.2) — each axis below 0.25, but magnitude ≈ 0.283 — radial registers, per-axis wouldn't.
			const mockGp = createMockGamepad([], [0.2, 0.2], 1000, 0);
			defineGamepadSupport(mockGp);
			const controller = new Controller();
			controller["index"] = 0;
			controller["axes"] = [new Vec2()];

			const axes = controller.poll();
			expect(axes[0].length()).toBeGreaterThan(0);
		});

		it("rescales magnitude so full deflection produces unit output", () => {
			const mockGp = createMockGamepad([], [1, 0], 1000, 0);
			defineGamepadSupport(mockGp);
			const controller = new Controller();
			controller["index"] = 0;
			controller["axes"] = [new Vec2()];

			const axes = controller.poll();
			expect(axes[0].x).toBeCloseTo(1, 5);
			expect(axes[0].y).toBe(0);
		});

		it("preserves sign for negative input", () => {
			const mockGp = createMockGamepad([], [-1, 0], 1000, 0);
			defineGamepadSupport(mockGp);
			const controller = new Controller();
			controller["index"] = 0;
			controller["axes"] = [new Vec2()];

			const axes = controller.poll();
			expect(axes[0].x).toBeCloseTo(-1, 5);
		});

		it("clamps over-unit input magnitudes to a unit-length output", () => {
			// (1, 1) — raw magnitude √2, must not produce output magnitude > 1.
			const mockGp = createMockGamepad([], [1, 1], 1000, 0);
			defineGamepadSupport(mockGp);
			const controller = new Controller();
			controller["index"] = 0;
			controller["axes"] = [new Vec2()];

			const axes = controller.poll();
			expect(axes[0].length()).toBeCloseTo(1, 5);
		});

		it("mutates pre-allocated axes in place rather than allocating new Vec2s", () => {
			const mockGp = createMockGamepad([], [0.5, 0.5], 1000, 0);
			defineGamepadSupport(mockGp);
			const controller = new Controller();
			controller["index"] = 0;
			const slot = new Vec2();
			controller["axes"] = [slot];

			const axes = controller.poll();
			expect(axes[0]).toBe(slot);
		});

		it("safely handles navigator.getGamepads() returning nothing at the tracked index", () => {
			Object.defineProperty(navigator, "getGamepads", {
				configurable: true,
				value: vi.fn(() => []),
			});
			const controller = new Controller();
			controller["index"] = 0;
			expect(controller.poll()).toEqual([]);
		});
	});

	describe("vibrate", () => {
		it("returns false when no gamepad is connected", () => {
			defineGamepadSupport(null);
			const controller = new Controller();
			expect(controller.vibrate()).toBe(false);
		});

		it("returns false when the gamepad has no vibration actuator", () => {
			const mockGp = createMockGamepad([], [0, 0]);
			(mockGp.vibrationActuator as any) = null;
			defineGamepadSupport(mockGp);
			const controller = new Controller();
			controller["index"] = 0;
			expect(controller.vibrate()).toBe(false);
		});

		it("calls playEffect with dual-rumble params and returns true", () => {
			const mockGp = createMockGamepad([], [0, 0]);
			defineGamepadSupport(mockGp);
			const controller = new Controller();
			controller["index"] = 0;
			expect(controller.vibrate()).toBe(true);
			expect(mockGp.vibrationActuator.playEffect).toHaveBeenCalledWith(
				"dual-rumble",
				{
					duration: 400,
					startDelay: 0,
					strongMagnitude: 1.0,
					weakMagnitude: 1.0,
				},
			);
		});
	});

	describe("reset", () => {
		it("clears buttons and axes", () => {
			defineGamepadSupport(null);
			const controller = new Controller();
			controller.buttons = [true, false];
			controller["axes"] = [new Vec2(1, 1)];
			controller.reset();
			expect(controller.buttons).toHaveLength(0);
			expect(controller["axes"]).toHaveLength(0);
		});

		it("is called when the window blur event fires", () => {
			defineGamepadSupport(createMockGamepad([], [0, 0]));
			const handlers = captureHandlers();
			const controller = new Controller();
			controller.buttons = [true];
			controller["axes"] = [new Vec2(1, 1)];
			handlers.blur!();
			expect(controller.buttons).toHaveLength(0);
			expect(controller["axes"]).toHaveLength(0);
		});
	});
});
