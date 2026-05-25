import { EVENT_NAMES } from "@/core/EventSystem";
import Game from "@/core/Game";
import Settings from "@/core/Settings";

export const KEYBOARD_KEYS = {
	KEY_0: "Digit0",
	KEY_1: "Digit1",
	KEY_2: "Digit2",
	KEY_3: "Digit3",
	KEY_4: "Digit4",
	KEY_5: "Digit5",
	KEY_6: "Digit6",
	KEY_7: "Digit7",
	KEY_8: "Digit8",
	KEY_9: "Digit9",
	KEY_A: "KeyA",
	KEY_B: "KeyB",
	KEY_C: "KeyC",
	KEY_D: "KeyD",
	KEY_DOWN: "ArrowDown",
	KEY_E: "KeyE",
	KEY_ENTER: "Enter",
	KEY_ESCAPE: "Escape",
	KEY_F: "KeyF",
	KEY_G: "KeyG",
	KEY_H: "KeyH",
	KEY_I: "KeyI",
	KEY_J: "KeyJ",
	KEY_K: "KeyK",
	KEY_L: "KeyL",
	KEY_LEFT: "ArrowLeft",
	KEY_M: "KeyM",
	KEY_N: "KeyN",
	KEY_O: "KeyO",
	KEY_P: "KeyP",
	KEY_Q: "KeyQ",
	KEY_R: "KeyR",
	KEY_RIGHT: "ArrowRight",
	KEY_S: "KeyS",
	KEY_SPACE: "Space",
	KEY_T: "KeyT",
	KEY_TAB: "Tab",
	KEY_U: "KeyU",
	KEY_UP: "ArrowUp",
	KEY_V: "KeyV",
	KEY_W: "KeyW",
	KEY_X: "KeyX",
	KEY_Y: "KeyY",
	KEY_Z: "KeyZ",
} as const;

export default class Keyboard {
	public keys: Record<string, boolean> = {};

	constructor(game: Game) {
		const keyEvent = (event: KeyboardEvent): void => {
			const code = event.code;

			if (event.type === "keydown") {
				this.keys[code] = true;
			} else if (event.type === "keyup") {
				this.keys[code] = false;
			}

			if (
				Settings.debug &&
				code === KEYBOARD_KEYS.KEY_ESCAPE &&
				event.type === "keydown"
			) {
				game.stopLoop();
			}

			game.events.dispatchEvent(EVENT_NAMES.KEY, this.keys, code);
		};

		window.addEventListener("keydown", keyEvent, false);
		window.addEventListener("keyup", keyEvent, false);
	}

	public isPressed(code: string): boolean {
		return !!this.keys[code];
	}

	public stopPress(code: string): void {
		this.keys[code] = false;
	}

	public reset(): void {
		for (const key in this.keys) {
			this.keys[key] = false;
		}
	}
}
