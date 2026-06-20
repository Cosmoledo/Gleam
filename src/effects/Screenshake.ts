import { rafLoop } from "@/utilities/Functions";
import { randomBetweenFloat } from "@/utilities/Math";

export type CssStyleKey = {
	[K in keyof CSSStyleDeclaration]: K extends string
		? CSSStyleDeclaration[K] extends string
			? K
			: never
		: never;
}[keyof CSSStyleDeclaration];

export type CssProxy = (key: CssStyleKey, value: string) => void;

export interface ShakeType {
	step: number;
	update: (updateCss: CssProxy, time: number) => void;
}

export const SHAKE_TYPES = {
	NORMAL: {
		step: 3,
		update(updateCss: CssProxy, time: number): void {
			const tr = `rotate(${randomBetweenFloat(-2, 2) * time}deg)`;
			updateCss("transform", tr);
			updateCss("webkitTransform", tr);

			updateCss("filter", `blur(${time * 5}px)`);
		},
	},
	FAST: {
		step: 15,
		update(updateCss: CssProxy, time: number): void {
			updateCss("filter", `blur(${time * 3}px)`);
		},
	},
} satisfies Record<string, ShakeType>;

/**
 * Only the built-in shake types (NORMAL, FAST) are supported today.
 * Letting callers define their own could be a possible feature — impact pulses, slow rumble, directional jolts.
 */
export default class Screenshake {
	private isShaking: boolean = false;
	private shakeType: ShakeType = SHAKE_TYPES.NORMAL;
	private style: CSSStyleDeclaration;

	constructor(element: HTMLElement) {
		this.style = element.style;
	}

	/** Best-effort style restore: each key the shake writes is snapshotted on first write and rewritten when the shake ends or is disposed. */
	public shake(
		shakeType: ShakeType = SHAKE_TYPES.NORMAL,
	): null | (() => void) {
		if (this.isShaking) {
			return null;
		}

		this.isShaking = true;
		this.shakeType = shakeType;
		let timer = 1;

		const originalValue = new Map<string, string>();
		const updateCssProxy: CssProxy = (key, value) => {
			if (!originalValue.has(key)) {
				originalValue.set(key, this.style[key]);
			}

			this.style[key] = value;
		};

		const stopLoop = rafLoop(dt => {
			this.shakeType.update(updateCssProxy, timer);
			timer -= this.shakeType.step * dt;

			if (timer <= 0) {
				dispose();
			}
		});

		let alive = true;
		const dispose = (): void => {
			// `alive` is per-shake, so a stale dispose handle from a previous shake can't restore its old snapshot over a later shake or flip the shared isShaking flag.
			if (!alive) {
				return;
			}
			alive = false;

			stopLoop();
			originalValue.forEach((value, key) => {
				this.style[key] = value;
			});
			this.isShaking = false;
		};

		return dispose;
	}
}
