import type ControllerCursor from "@/input/ControllerCursor";
import type Mouse from "@/input/Mouse";

export interface GameEventMap {
	gameloopStopped: [];
	inputControllerConnected: [buttons: boolean[], cursors: ControllerCursor[]];
	inputControllerDisconnected: [];
	inputKeyboard: [keys: Record<string, boolean>, code: string];
	inputMouse: [mouse: Mouse];
	resized: [];
}

export interface AddEventListenerOptions {
	once?: boolean;
}

export type GameEventListener<K extends keyof GameEventMap> = {
	callback: (...args: GameEventMap[K]) => void;
	options: { once: boolean };
	consumed?: boolean;
};

export class EventSystem {
	private static eventListener: {
		[K in keyof GameEventMap]?: GameEventListener<K>[];
	} = {};

	public static addEventListener<K extends keyof GameEventMap>(
		eventName: K,
		callback: (...args: GameEventMap[K]) => void,
		options: AddEventListenerOptions = {},
	): void {
		const event: GameEventListener<K> = {
			callback,
			options: { once: options.once ?? false },
		};
		const list = this.eventListener[eventName];

		if (list) {
			list.push(event);
		} else {
			(this.eventListener as Record<K, GameEventListener<K>[]>)[
				eventName
			] = [event];
		}
	}

	public static dispatchEvent<K extends keyof GameEventMap>(
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
