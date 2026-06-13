import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import EventSystem from "@/core/EventSystem";
import Vec2 from "@/math/Vec2";
import type Game from "@/core/Game";
import { createMockGame } from "../createMockGame";
import { POINTER_KEYS } from "@/input/Pointer";

// ==================== POINTER_KEYS ====================

describe("POINTER_KEYS", () => {
	it("has all expected button entries", () => {
		expect(POINTER_KEYS.LEFT).toBe(0);
		expect(POINTER_KEYS.MIDDLE).toBe(1);
		expect(POINTER_KEYS.RIGHT).toBe(2);
		expect(POINTER_KEYS.PREV).toBe(3);
		expect(POINTER_KEYS.FORWARD).toBe(4);
	});
});

// ==================== Pointer ====================

describe("Pointer", () => {
	let mockGame: Game;
	let pointermoveCb: ((e: PointerEvent) => void) | null = null;
	let pointerdownCb: ((e: PointerEvent) => void) | null = null;
	let pointerupCb: ((e: PointerEvent) => void) | null = null;
	let blurCb: (() => void) | null = null;

	let dispatchSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		mockGame = createMockGame();
		pointermoveCb = null;
		pointerdownCb = null;
		pointerupCb = null;
		blurCb = null;
		vi.spyOn(window, "addEventListener").mockImplementation((type, cb) => {
			if (type === "pointermove") {
				pointermoveCb = cb as (e: PointerEvent) => void;
			}
			if (type === "pointerdown") {
				pointerdownCb = cb as (e: PointerEvent) => void;
			}
			if (type === "pointerup") {
				pointerupCb = cb as (e: PointerEvent) => void;
			}
			if (type === "blur") {
				blurCb = cb as () => void;
			}
		});
		dispatchSpy = vi.spyOn(EventSystem, "dispatchEvent");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("registers pointermove, pointerdown, and pointerup event listeners", async () => {
		const { default: Pointer } = await import("@/input/Pointer");
		new Pointer(mockGame);
		expect(pointermoveCb).toBeInstanceOf(Function);
		expect(pointerdownCb).toBeInstanceOf(Function);
		expect(pointerupCb).toBeInstanceOf(Function);
	});

	it("registers a contextmenu listener on document that calls preventDefault", async () => {
		const addSpy = vi.spyOn(document, "addEventListener");
		const { default: Pointer } = await import("@/input/Pointer");
		new Pointer(mockGame);
		const entry = addSpy.mock.calls.find(c => c[0] === "contextmenu");
		expect(entry).toBeDefined();
		const handler = entry![1] as EventListener;
		const event = { preventDefault: vi.fn() } as unknown as Event;
		handler(event);
		expect(event.preventDefault).toHaveBeenCalledTimes(1);
	});

	it("initializes all Vec2 properties", async () => {
		const { default: Pointer } = await import("@/input/Pointer");
		const pointer = new Pointer(mockGame);
		expect(pointer.posReal).toBeInstanceOf(Vec2);
		expect(pointer.posRealLast).toBeInstanceOf(Vec2);
		expect(pointer.posScaled).toBeInstanceOf(Vec2);
		expect(pointer.posScaledLast).toBeInstanceOf(Vec2);
	});

	it("initializes pressed array", async () => {
		const { default: Pointer } = await import("@/input/Pointer");
		const pointer = new Pointer(mockGame);
		expect(Array.isArray(pointer.pressed)).toBe(true);
	});

	it("initializes hasMoved to false", async () => {
		const { default: Pointer } = await import("@/input/Pointer");
		const pointer = new Pointer(mockGame);
		expect(pointer.hasMoved).toBe(false);
	});

	it("initializes lastEvent to null", async () => {
		const { default: Pointer } = await import("@/input/Pointer");
		const pointer = new Pointer(mockGame);
		expect(pointer.lastEvent).toBeNull();
	});

	// ==================== pointermove ====================

	describe("pointermove", () => {
		it("sets hasMoved to true when pointer moves over canvas", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointermoveCb!({
				clientX: 100,
				clientY: 200,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			expect(pointer.hasMoved).toBe(true);
		});

		it("prevents default when target is canvas", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const preventDefault = vi.fn();
			new Pointer(mockGame);
			pointermoveCb!({
				clientX: 100,
				clientY: 200,
				target: mockGame.canman.canvas,
				preventDefault,
			} as unknown as PointerEvent);
			expect(preventDefault).toHaveBeenCalled();
		});

		it("does not prevent default when target is not canvas", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			new Pointer(mockGame);
			const preventDefault = vi.fn();
			pointermoveCb!({
				clientX: 100,
				clientY: 200,
				target: null,
				preventDefault,
			} as unknown as PointerEvent);
			expect(preventDefault).not.toHaveBeenCalled();
		});

		it("sets lastEvent to the event", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			const event = {
				clientX: 50,
				clientY: 75,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent;
			pointermoveCb!(event);
			expect(pointer.lastEvent).toBe(event);
		});

		it("dispatches MOUSE event", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointermoveCb!({
				clientX: 100,
				clientY: 200,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			expect(dispatchSpy).toHaveBeenCalledWith("inputPointer", pointer);
		});

		it("updates posReal to raw clientX/clientY", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointermoveCb!({
				clientX: 100,
				clientY: 200,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			expect(pointer.posReal.x).toBe(100);
			expect(pointer.posReal.y).toBe(200);
		});

		it("updates posScaled when canvas bounds are zero", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			mockGame.canman.canvasBoundingClientRect = {
				left: 0,
				top: 0,
				width: 0,
				height: 0,
			} as unknown as DOMRect;
			const pointer = new Pointer(mockGame);
			pointermoveCb!({
				clientX: 100,
				clientY: 200,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			expect(pointer.posScaled.x).toBe(0);
			expect(pointer.posScaled.y).toBe(0);
		});

		it("updates posScaledLast before posScaled", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointermoveCb!({
				clientX: 100,
				clientY: 200,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			expect(pointer.posScaledLast.x).toBe(0);
			expect(pointer.posScaledLast.y).toBe(0);
		});

		it("clamps posScaled to canvas boundaries", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			mockGame.canman.canvasBoundingClientRect = {
				left: 0,
				top: 0,
				width: 800,
				height: 600,
			} as unknown as DOMRect;
			const pointer = new Pointer(mockGame);
			pointermoveCb!({
				clientX: -1000,
				clientY: -1000,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			expect(pointer.posScaled.x).toBe(0);
			expect(pointer.posScaled.y).toBe(0);
			pointermoveCb!({
				clientX: 2000,
				clientY: 2000,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			expect(pointer.posScaled.x).toBe(800);
			expect(pointer.posScaled.y).toBe(600);
		});
	});

	// ==================== pointerdown / pointerup ====================

	describe("pointerdown / pointerup", () => {
		it("sets pressed[button] to true on pointerdown", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointerdownCb!({
				type: "pointerdown",
				button: 0,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			expect(pointer.pressed[0]).toBe(true);
		});

		it("sets pressed[button] to false on pointerup", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointerdownCb!({
				type: "pointerdown",
				button: 1,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			expect(pointer.pressed[1]).toBe(true);
			pointerupCb!({
				type: "pointerup",
				button: 1,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			expect(pointer.pressed[1]).toBe(false);
		});

		it("sets lastEvent to the event on pointerdown", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			const event = {
				type: "pointerdown",
				button: 0,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent;
			pointerdownCb!(event);
			expect(pointer.lastEvent).toBe(event);
		});

		it("sets lastEvent to the event on pointerup", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			const event = {
				type: "pointerup",
				button: 2,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent;
			pointerupCb!(event);
			expect(pointer.lastEvent).toBe(event);
		});

		it("dispatches MOUSE event on pointerdown", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointerdownCb!({
				type: "pointerdown",
				button: 0,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			expect(dispatchSpy).toHaveBeenCalledWith("inputPointer", pointer);
		});

		it("dispatches MOUSE event on pointerup", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointerupCb!({
				type: "pointerup",
				button: 0,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			expect(dispatchSpy).toHaveBeenCalledWith("inputPointer", pointer);
		});

		it("prevents default when target is canvas on pointerdown", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const preventDefault = vi.fn();
			new Pointer(mockGame);
			pointerdownCb!({
				type: "pointerdown",
				button: 0,
				target: mockGame.canman.canvas,
				preventDefault,
			} as unknown as PointerEvent);
			expect(preventDefault).toHaveBeenCalled();
		});

		it("prevents default when target is canvas on pointerup", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const preventDefault = vi.fn();
			new Pointer(mockGame);
			pointerupCb!({
				type: "pointerup",
				button: 0,
				target: mockGame.canman.canvas,
				preventDefault,
			} as unknown as PointerEvent);
			expect(preventDefault).toHaveBeenCalled();
		});

		it("does not prevent default when target is not canvas", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			new Pointer(mockGame);
			const preventDefault = vi.fn();
			pointerdownCb!({
				type: "pointerdown",
				button: 0,
				target: null,
				preventDefault,
			} as unknown as PointerEvent);
			expect(preventDefault).not.toHaveBeenCalled();
		});

		it("handles all button indices on pointerdown", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			for (let btn = 0; btn <= 4; btn++) {
				pointerdownCb!({
					type: "pointerdown",
					button: btn,
					target: mockGame.canman.canvas,
					preventDefault: vi.fn(),
				} as unknown as PointerEvent);
				expect(pointer.pressed[btn]).toBe(true);
			}
		});

		it("handles all button indices on pointerup", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			for (let btn = 0; btn <= 4; btn++) {
				pointerdownCb!({
					type: "pointerdown",
					button: btn,
					target: mockGame.canman.canvas,
					preventDefault: vi.fn(),
				} as unknown as PointerEvent);
			}
			for (let btn = 0; btn <= 4; btn++) {
				pointerupCb!({
					type: "pointerup",
					button: btn,
					target: mockGame.canman.canvas,
					preventDefault: vi.fn(),
				} as unknown as PointerEvent);
				expect(pointer.pressed[btn]).toBe(false);
			}
		});
	});

	// ==================== reset ====================

	describe("reset", () => {
		it("clears all pressed buttons", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointerdownCb!({
				type: "pointerdown",
				button: 0,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			pointerdownCb!({
				type: "pointerdown",
				button: 2,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			pointer.reset();
			expect(pointer.pressed.length).toBe(0);
		});

		it("is called when the window blur event fires", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointerdownCb!({
				type: "pointerdown",
				button: 0,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			expect(pointer.pressed[0]).toBe(true);
			blurCb!();
			expect(pointer.pressed.length).toBe(0);
		});
	});
});
