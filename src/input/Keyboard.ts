import EventSystem from "@/core/EventSystem";
import Settings from "@/core/Settings";
import type Game from "@/core/Game";
import { type Control } from "./Control";

/** `KeyboardEvent.code` constants for the keys Gleam tracks by name. Pass to {@link Keyboard.isActive} / {@link Keyboard.stop}. */
export const KEYBOARD_KEYS = {
	/** Digit row `0`. */
	KEY_0: "Digit0",
	/** Digit row `1`. */
	KEY_1: "Digit1",
	/** Digit row `2`. */
	KEY_2: "Digit2",
	/** Digit row `3`. */
	KEY_3: "Digit3",
	/** Digit row `4`. */
	KEY_4: "Digit4",
	/** Digit row `5`. */
	KEY_5: "Digit5",
	/** Digit row `6`. */
	KEY_6: "Digit6",
	/** Digit row `7`. */
	KEY_7: "Digit7",
	/** Digit row `8`. */
	KEY_8: "Digit8",
	/** Digit row `9`. */
	KEY_9: "Digit9",
	/** Letter `A`. */
	KEY_A: "KeyA",
	/** Letter `B`. */
	KEY_B: "KeyB",
	/** Letter `C`. */
	KEY_C: "KeyC",
	/** Letter `D`. */
	KEY_D: "KeyD",
	/** Down arrow. */
	KEY_DOWN: "ArrowDown",
	/** Letter `E`. */
	KEY_E: "KeyE",
	/** Enter / Return. */
	KEY_ENTER: "Enter",
	/** Escape. Note: in `Settings.debug` mode this stops the gameloop. */
	KEY_ESCAPE: "Escape",
	/** Letter `F`. */
	KEY_F: "KeyF",
	/** Letter `G`. */
	KEY_G: "KeyG",
	/** Letter `H`. */
	KEY_H: "KeyH",
	/** Letter `I`. */
	KEY_I: "KeyI",
	/** Letter `J`. */
	KEY_J: "KeyJ",
	/** Letter `K`. */
	KEY_K: "KeyK",
	/** Letter `L`. */
	KEY_L: "KeyL",
	/** Left arrow. */
	KEY_LEFT: "ArrowLeft",
	/** Letter `M`. */
	KEY_M: "KeyM",
	/** Letter `N`. */
	KEY_N: "KeyN",
	/** Letter `O`. */
	KEY_O: "KeyO",
	/** Letter `P`. */
	KEY_P: "KeyP",
	/** Letter `Q`. */
	KEY_Q: "KeyQ",
	/** Letter `R`. */
	KEY_R: "KeyR",
	/** Right arrow. */
	KEY_RIGHT: "ArrowRight",
	/** Letter `S`. */
	KEY_S: "KeyS",
	/** Space bar. */
	KEY_SPACE: "Space",
	/** Letter `T`. */
	KEY_T: "KeyT",
	/** Tab. */
	KEY_TAB: "Tab",
	/** Letter `U`. */
	KEY_U: "KeyU",
	/** Up arrow. */
	KEY_UP: "ArrowUp",
	/** Letter `V`. */
	KEY_V: "KeyV",
	/** Letter `W`. */
	KEY_W: "KeyW",
	/** Letter `X`. */
	KEY_X: "KeyX",
	/** Letter `Y`. */
	KEY_Y: "KeyY",
	/** Letter `Z`. */
	KEY_Z: "KeyZ",
} as const;

/** A tracked key's `KeyboardEvent.code` — one of the values of {@link KEYBOARD_KEYS}. */
export type KeyboardKey = (typeof KEYBOARD_KEYS)[keyof typeof KEYBOARD_KEYS];

/**
 * Keyboard state. Wired into `Game` automatically. The preferred way to consume input is to poll {@link isActive} from `update` — game input is held-state-based ("is W held this frame?"), and combining with {@link stop} handles one-shot actions cleanly. The {@link EventSystem} `"inputKeyboard"` event (payload: `(keys, event)`) is available for cases that genuinely need edge-triggered handling.
 *
 * State is cleared on `window` blur and on `gameloopStopped` so held keys don't stay "pressed" when focus or the loop is lost. In `Settings.debug` mode, pressing Escape stops the gameloop.
 */
export default class Keyboard implements Control<KeyboardKey> {
	/** Live map of `KeyboardEvent.code` → pressed state. Codes only appear after the key has been touched at least once; missing codes read as `undefined` (use {@link isActive} for a safe `boolean`). */
	private keys: Record<string, boolean> = {};

	constructor(game: Game) {
		const keyEvent = (event: KeyboardEvent): void => {
			const code = event.code;

			const pressed = event.type === "keydown";
			this.keys[code] = pressed;

			if (
				Settings.debug &&
				code === KEYBOARD_KEYS.KEY_ESCAPE &&
				pressed
			) {
				game.gameloop.stopLoop();
			}

			EventSystem.dispatchEvent("inputKeyboard", this.keys, event);
		};

		window.addEventListener("keydown", keyEvent, false);
		window.addEventListener("keyup", keyEvent, false);
		window.addEventListener("blur", () => this.reset(), false);

		EventSystem.addEventListener("gameloopStopped", () => this.reset(), {
			priority: true,
		});
	}

	/** Mark every tracked control as released. Called automatically on `window` blur and on `gameloopStopped`. */
	public reset(): void {
		for (const key in this.keys) {
			this.keys[key] = false;
		}
	}

	/** Force `code` to read as released. Holds until the next `keydown` for that key — so a momentary tap is consumed until it's pressed again, but a physically held key re-surfaces on the next OS auto-repeat `keydown`. */
	public stop(code: KeyboardKey): void {
		this.keys[code] = false;
	}

	/** `true` when the control is active. Safe for untouched unknown controls (returns `false` rather than `undefined`). */
	public isActive(code: KeyboardKey): boolean {
		return !!this.keys[code];
	}
}
