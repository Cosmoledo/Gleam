import type ControllerCursor from "@/input/ControllerCursor";
import type Mouse from "@/input/Mouse";
import { throttleByKey } from "@/utilities/Functions";

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

	private static logListenerError = throttleByKey(
		(count: number, eventName: string, err: unknown) => {
			const suffix = count > 1 ? ` (x${count} since last log)` : "";

			console.error(
				`EventSystem listener for "${eventName}" threw${suffix}:`,
				err,
			);
		},
		1000,
	);

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

		snapshot.forEach(entry => {
			if (entry.consumed) {
				return;
			}

			if (entry.options.once) {
				entry.consumed = true;
			}

			try {
				entry.callback(...params);
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				this.logListenerError(`${eventName}:${msg}`, eventName, err);
			}
		});

		for (let i = events.length - 1; i >= 0; i--) {
			if (events[i].consumed) {
				events.splice(i, 1);
			}
		}
	}
}
