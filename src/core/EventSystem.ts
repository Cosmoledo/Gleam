import type ControllerCursor from "@/input/ControllerCursor";
import type Mouse from "@/input/Mouse";

export const EVENT_NAMES = {
	GAMELOOP_STOPPED: "gameloopStopped",
	INPUT_CONTROLLER_CONNECTED: "inputControllerConnected",
	INPUT_CONTROLLER_DISCONNECTED: "inputControllerDisconnected",
	INPUT_KEYBOARD: "inputKeyboard",
	INPUT_MOUSE: "inputMouse",
	RESIZED: "resized",
} as const;

export type GameEventMap = {
	[EVENT_NAMES.GAMELOOP_STOPPED]: [];
	[EVENT_NAMES.INPUT_CONTROLLER_CONNECTED]: [
		buttons: boolean[],
		cursors: ControllerCursor[],
	];
	[EVENT_NAMES.INPUT_CONTROLLER_DISCONNECTED]: [];
	[EVENT_NAMES.INPUT_KEYBOARD]: [keys: Record<string, boolean>, code: string];
	[EVENT_NAMES.INPUT_MOUSE]: [mouse: Mouse];
	[EVENT_NAMES.RESIZED]: [];
};

export type GameEventListener<K extends keyof GameEventMap> = {
	callback: (...args: GameEventMap[K]) => void;
	options: { once: boolean };
	consumed?: boolean;
};

export class EventSystem {
	private eventListener: {
		[K in keyof GameEventMap]?: GameEventListener<K>[];
	} = {};

	public addEventListener<K extends keyof GameEventMap>(
		eventName: K,
		callback: (...args: GameEventMap[K]) => void,
		once: boolean = false,
	): void {
		const event: GameEventListener<K> = { callback, options: { once } };
		const list = this.eventListener[eventName];

		if (list) {
			list.push(event);
		} else {
			(this.eventListener as Record<K, GameEventListener<K>[]>)[
				eventName
			] = [event];
		}
	}

	public dispatchEvent<K extends keyof GameEventMap>(
		eventName: K,
		...params: GameEventMap[K]
	): void {
		const events = this.eventListener[eventName];

		if (!events) {
			return;
		}

		const snapshot = events.slice();

		for (let i = snapshot.length - 1; i >= 0; i--) {
			const entry = snapshot[i];

			if (entry.consumed) {
				continue;
			}

			if (entry.options.once) {
				entry.consumed = true;
			}

			entry.callback(...params);
		}

		for (let i = events.length - 1; i >= 0; i--) {
			if (events[i].consumed) {
				events.splice(i, 1);
			}
		}
	}
}
