import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import EventSystem from "@/core/EventSystem";
import Settings from "@/core/Settings";
import type Game from "@/core/Game";
import { createMockGame } from "../createMockGame";
import { KEYBOARD_KEYS } from "@/input/Keyboard";

// ==================== KEYBOARD_KEYS ====================

describe("KEYBOARD_KEYS", () => {
	it("has all expected key entries", () => {
		expect(KEYBOARD_KEYS.KEY_A).toBe("KeyA");
		expect(KEYBOARD_KEYS.KEY_ESCAPE).toBe("Escape");
		expect(KEYBOARD_KEYS.KEY_ENTER).toBe("Enter");
		expect(KEYBOARD_KEYS.KEY_SPACE).toBe("Space");
		expect(KEYBOARD_KEYS.KEY_UP).toBe("ArrowUp");
		expect(KEYBOARD_KEYS.KEY_DOWN).toBe("ArrowDown");
		expect(KEYBOARD_KEYS.KEY_LEFT).toBe("ArrowLeft");
		expect(KEYBOARD_KEYS.KEY_RIGHT).toBe("ArrowRight");
		expect(KEYBOARD_KEYS.KEY_0).toBe("Digit0");
		expect(KEYBOARD_KEYS.KEY_9).toBe("Digit9");
		expect(KEYBOARD_KEYS.KEY_Z).toBe("KeyZ");
		expect(KEYBOARD_KEYS.KEY_TAB).toBe("Tab");
	});
});

// ==================== Keyboard ====================

describe("Keyboard", () => {
	let mockGame: Game;
	let keydownCb: ((e: KeyboardEvent) => void) | null = null;
	let keyupCb: ((e: KeyboardEvent) => void) | null = null;
	let blurCb: (() => void) | null = null;

	let dispatchSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		mockGame = createMockGame();
		keydownCb = null;
		keyupCb = null;
		blurCb = null;
		vi.spyOn(window, "addEventListener").mockImplementation((type, cb) => {
			if (type === "keydown") {
				keydownCb = cb as (e: KeyboardEvent) => void;
			}
			if (type === "keyup") {
				keyupCb = cb as (e: KeyboardEvent) => void;
			}
			if (type === "blur") {
				blurCb = cb as () => void;
			}
		});
		vi.spyOn(Settings, "debug", "get").mockReturnValue(false);
		dispatchSpy = vi.spyOn(EventSystem, "dispatchEvent");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("registers keydown and keyup event listeners", async () => {
		const { default: Keyboard } = await import("@/input/Keyboard");
		new Keyboard(mockGame);
		expect(keydownCb).toBeInstanceOf(Function);
		expect(keyupCb).toBeInstanceOf(Function);
	});

	it("sets pressed key to true on keydown", async () => {
		const { default: Keyboard } = await import("@/input/Keyboard");
		const kb = new Keyboard(mockGame);
		keydownCb!({ code: "KeyA", type: "keydown" } as KeyboardEvent);
		expect(kb.isPressed("KeyA")).toBe(true);
	});

	it("sets pressed key to false on keyup", async () => {
		const { default: Keyboard } = await import("@/input/Keyboard");
		const kb = new Keyboard(mockGame);
		keydownCb!({ code: "KeyA", type: "keydown" } as KeyboardEvent);
		expect(kb.isPressed("KeyA")).toBe(true);
		keyupCb!({ code: "KeyA", type: "keyup" } as KeyboardEvent);
		expect(kb.isPressed("KeyA")).toBe(false);
	});

	it("dispatches KEY event on keydown with pressed=true", async () => {
		const { default: Keyboard } = await import("@/input/Keyboard");
		const kb = new Keyboard(mockGame);
		keydownCb!({ code: "KeyB", type: "keydown" } as KeyboardEvent);
		expect(dispatchSpy).toHaveBeenCalledWith(
			"inputKeyboard",
			kb.keys,
			"KeyB",
			true,
		);
	});

	it("dispatches KEY event on keyup with pressed=false", async () => {
		const { default: Keyboard } = await import("@/input/Keyboard");
		const kb = new Keyboard(mockGame);
		keyupCb!({ code: "KeyC", type: "keyup" } as KeyboardEvent);
		expect(dispatchSpy).toHaveBeenCalledWith(
			"inputKeyboard",
			kb.keys,
			"KeyC",
			false,
		);
	});

	it("stops the loop when debug is true and Escape is pressed down", async () => {
		vi.spyOn(Settings, "debug", "get").mockReturnValue(true);
		const { default: Keyboard } = await import("@/input/Keyboard");
		new Keyboard(mockGame);
		keydownCb!({ code: "Escape", type: "keydown" } as KeyboardEvent);
		expect(mockGame.gameloop.stopLoop).toHaveBeenCalled();
	});

	it("does not stop the loop when debug is false and Escape is pressed", async () => {
		vi.spyOn(Settings, "debug", "get").mockReturnValue(false);
		const { default: Keyboard } = await import("@/input/Keyboard");
		new Keyboard(mockGame);
		keydownCb!({ code: "Escape", type: "keydown" } as KeyboardEvent);
		expect(mockGame.gameloop.stopLoop).not.toHaveBeenCalled();
	});

	it("does not stop the loop when Escape is released (keyup)", async () => {
		vi.spyOn(Settings, "debug", "get").mockReturnValue(true);
		const { default: Keyboard } = await import("@/input/Keyboard");
		new Keyboard(mockGame);
		keyupCb!({ code: "Escape", type: "keyup" } as KeyboardEvent);
		expect(mockGame.gameloop.stopLoop).not.toHaveBeenCalled();
	});

	// ==================== isPressed ====================

	describe("isPressed", () => {
		it("returns true when key is pressed", async () => {
			const { default: Keyboard } = await import("@/input/Keyboard");
			const kb = new Keyboard(mockGame);
			keydownCb!({ code: "KeyD", type: "keydown" } as KeyboardEvent);
			expect(kb.isPressed("KeyD")).toBe(true);
		});

		it("returns false when key is not pressed", async () => {
			const { default: Keyboard } = await import("@/input/Keyboard");
			const kb = new Keyboard(mockGame);
			expect(kb.isPressed("KeyX")).toBe(false);
		});

		it("returns false for undefined key entry (double negation)", async () => {
			const { default: Keyboard } = await import("@/input/Keyboard");
			const kb = new Keyboard(mockGame);
			expect(kb.isPressed("NonExistent")).toBe(false);
		});
	});

	// ==================== stopPress ====================

	describe("stopPress", () => {
		it("sets the key to false", async () => {
			const { default: Keyboard } = await import("@/input/Keyboard");
			const kb = new Keyboard(mockGame);
			keydownCb!({ code: "KeyE", type: "keydown" } as KeyboardEvent);
			expect(kb.isPressed("KeyE")).toBe(true);
			kb.stopPress("KeyE");
			expect(kb.isPressed("KeyE")).toBe(false);
		});

		it("sets a non-pressed key to false (no-op)", async () => {
			const { default: Keyboard } = await import("@/input/Keyboard");
			const kb = new Keyboard(mockGame);
			kb.stopPress("KeyF");
			expect(kb.isPressed("KeyF")).toBe(false);
		});
	});

	// ==================== reset ====================

	describe("reset", () => {
		it("sets all pressed keys to false", async () => {
			const { default: Keyboard } = await import("@/input/Keyboard");
			const kb = new Keyboard(mockGame);
			keydownCb!({ code: "KeyW", type: "keydown" } as KeyboardEvent);
			keydownCb!({ code: "KeyS", type: "keydown" } as KeyboardEvent);
			keydownCb!({ code: "KeyA", type: "keydown" } as KeyboardEvent);
			keydownCb!({ code: "KeyD", type: "keydown" } as KeyboardEvent);
			kb.reset();
			expect(kb.isPressed("KeyW")).toBe(false);
			expect(kb.isPressed("KeyS")).toBe(false);
			expect(kb.isPressed("KeyA")).toBe(false);
			expect(kb.isPressed("KeyD")).toBe(false);
		});

		it("handles empty keys object", async () => {
			const { default: Keyboard } = await import("@/input/Keyboard");
			const kb = new Keyboard(mockGame);
			kb.reset();
			expect(kb.keys).toEqual({});
		});

		it("is called when the gameloopStopped event fires", async () => {
			const { default: Keyboard } = await import("@/input/Keyboard");
			const kb = new Keyboard(mockGame);
			keydownCb!({ code: "KeyW", type: "keydown" } as KeyboardEvent);
			expect(kb.isPressed("KeyW")).toBe(true);
			EventSystem.dispatchEvent("gameloopStopped");
			expect(kb.isPressed("KeyW")).toBe(false);
		});

		it("is called when the window blur event fires", async () => {
			const { default: Keyboard } = await import("@/input/Keyboard");
			const kb = new Keyboard(mockGame);
			keydownCb!({ code: "KeyW", type: "keydown" } as KeyboardEvent);
			expect(kb.isPressed("KeyW")).toBe(true);
			blurCb!();
			expect(kb.isPressed("KeyW")).toBe(false);
		});
	});
});
