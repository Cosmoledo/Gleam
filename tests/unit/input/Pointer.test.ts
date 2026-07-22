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

	it("registers pointermove, pointerdown, and pointerup on one shared handler", async () => {
		const { default: Pointer } = await import("@/input/Pointer");
		new Pointer(mockGame);
		expect(pointermoveCb).toBeInstanceOf(Function);
		// All three events run the SAME handler (no branching on event.type),
		// so the shared behavior — preventDefault, lastEvent, dispatch,
		// hasMoved — is exercised once in the "pointermove" block below rather
		// than duplicated per event type.
		expect(pointerdownCb).toBe(pointermoveCb);
		expect(pointerupCb).toBe(pointermoveCb);
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

		it("dispatches the inputPointer event", async () => {
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

		it("reuses posRealLast and posScaledLast instances across moves (no allocation)", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			const realLastRef = pointer.posRealLast;
			const scaledLastRef = pointer.posScaledLast;
			pointermoveCb!({
				clientX: 100,
				clientY: 200,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			pointermoveCb!({
				clientX: 300,
				clientY: 400,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			expect(pointer.posRealLast).toBe(realLastRef);
			expect(pointer.posScaledLast).toBe(scaledLastRef);
		});

		it("stores the previous posReal in posRealLast after a move", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointermoveCb!({
				clientX: 100,
				clientY: 200,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			pointermoveCb!({
				clientX: 300,
				clientY: 400,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			} as unknown as PointerEvent);
			expect(pointer.posReal.x).toBe(300);
			expect(pointer.posReal.y).toBe(400);
			expect(pointer.posRealLast.x).toBe(100);
			expect(pointer.posRealLast.y).toBe(200);
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

	// ==================== button state (event.buttons bitmask) ====================

	describe("button state", () => {
		// pressed[] is derived from the event.buttons BITMASK (not
		// event.button), which is why it also works on pointermove — see the
		// "chorded buttons" block below.
		const evt = (buttons: number, type = "pointerdown"): PointerEvent =>
			({
				type,
				buttons,
				clientX: 10,
				clientY: 10,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			}) as unknown as PointerEvent;

		it("sets the left button from buttons bit 1", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointerdownCb!(evt(1));
			expect(pointer.pressed[POINTER_KEYS.LEFT]).toBe(true);
		});

		it("maps the bitmask to POINTER_KEYS indices (middle/right swapped vs. bit order)", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			// bit 2 is the SECONDARY (right) button; bit 4 the AUXILIARY (middle)
			pointerdownCb!(evt(2));
			expect(pointer.pressed[POINTER_KEYS.RIGHT]).toBe(true);
			expect(pointer.pressed[POINTER_KEYS.MIDDLE]).toBe(false);
			pointerdownCb!(evt(4));
			expect(pointer.pressed[POINTER_KEYS.MIDDLE]).toBe(true);
			expect(pointer.pressed[POINTER_KEYS.RIGHT]).toBe(false);
		});

		it("sets every standard button when all bits are set", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointerdownCb!(evt(1 | 2 | 4 | 8 | 16));
			expect(pointer.pressed[POINTER_KEYS.LEFT]).toBe(true);
			expect(pointer.pressed[POINTER_KEYS.MIDDLE]).toBe(true);
			expect(pointer.pressed[POINTER_KEYS.RIGHT]).toBe(true);
			expect(pointer.pressed[POINTER_KEYS.PREV]).toBe(true);
			expect(pointer.pressed[POINTER_KEYS.FORWARD]).toBe(true);
		});

		it("clears all buttons when buttons is 0 (last button released)", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointerdownCb!(evt(1));
			expect(pointer.pressed[POINTER_KEYS.LEFT]).toBe(true);
			pointerupCb!(evt(0, "pointerup"));
			expect(pointer.pressed[POINTER_KEYS.LEFT]).toBe(false);
		});

		it("ignores exotic buttons beyond the 5 standard bits", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointerdownCb!(evt(32)); // hypothetical 6th button
			expect(pointer.pressed.some(Boolean)).toBe(false);
		});
	});

	// ==================== chorded buttons ====================

	describe("chorded buttons", () => {
		// A 2nd button pressed while the 1st is held arrives as pointerMOVE
		// (the full state is in event.buttons), never a 2nd pointerdown — and
		// a non-last release is a pointermove too. This is the case the
		// bitmask approach exists to handle.
		const evt = (type: string, buttons: number): PointerEvent =>
			({
				type,
				buttons,
				clientX: 10,
				clientY: 10,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			}) as unknown as PointerEvent;

		it("tracks a second button chorded in via pointermove", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);

			// left down
			pointerdownCb!(evt("pointerdown", 1));
			expect(pointer.pressed[POINTER_KEYS.LEFT]).toBe(true);
			expect(pointer.pressed[POINTER_KEYS.RIGHT]).toBe(false);

			// right pressed while left held -> pointermove, buttons = 1|2
			pointermoveCb!(evt("pointermove", 3));
			expect(pointer.pressed[POINTER_KEYS.LEFT]).toBe(true);
			expect(pointer.pressed[POINTER_KEYS.RIGHT]).toBe(true);

			// right released while left held -> pointermove, buttons = 1
			pointermoveCb!(evt("pointermove", 1));
			expect(pointer.pressed[POINTER_KEYS.LEFT]).toBe(true);
			expect(pointer.pressed[POINTER_KEYS.RIGHT]).toBe(false);

			// left released (last button) -> pointerup, buttons = 0
			pointerupCb!(evt("pointerup", 0));
			expect(pointer.pressed[POINTER_KEYS.LEFT]).toBe(false);
			expect(pointer.pressed[POINTER_KEYS.RIGHT]).toBe(false);
		});
	});

	// ==================== reset ====================

	describe("reset", () => {
		const evt = (buttons: number): PointerEvent =>
			({
				type: "pointerdown",
				buttons,
				clientX: 10,
				clientY: 10,
				target: mockGame.canman.canvas,
				preventDefault: vi.fn(),
			}) as unknown as PointerEvent;

		it("clears all pressed buttons", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointerdownCb!(evt(1 | 2)); // left + right
			expect(pointer.pressed[POINTER_KEYS.LEFT]).toBe(true);
			expect(pointer.pressed[POINTER_KEYS.RIGHT]).toBe(true);
			pointer.reset();
			expect(pointer.pressed.length).toBe(0);
		});

		it("is called when the window blur event fires", async () => {
			const { default: Pointer } = await import("@/input/Pointer");
			const pointer = new Pointer(mockGame);
			pointerdownCb!(evt(1));
			expect(pointer.pressed[POINTER_KEYS.LEFT]).toBe(true);
			blurCb!();
			expect(pointer.pressed.length).toBe(0);
		});
	});
});
