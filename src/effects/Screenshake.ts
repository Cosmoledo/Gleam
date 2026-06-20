import { rafLoop } from "@/utilities/Functions";
import { randomBetweenFloat } from "@/utilities/Math";

/** String-valued keys of `CSSStyleDeclaration` — the ones safe to assign a `string` value to via {@link CssProxy}. */
export type CssStyleKey = {
	[K in keyof CSSStyleDeclaration]: K extends string
		? CSSStyleDeclaration[K] extends string
			? K
			: never
		: never;
}[keyof CSSStyleDeclaration];

/** Setter handed to {@link ShakeType.update} that writes a CSS value. Snapshots the prior value on first write per key so it can be restored on dispose. */
export type CssProxy = (key: CssStyleKey, value: string) => void;

/** Shape for a custom shake recipe. */
export interface ShakeType {
	/** Decay rate applied each frame: `timer -= step * dt`. Higher = shorter shake (3 ≈ ⅓s, 15 ≈ 1/15s). */
	step: number;
	/** Per-frame mutator. `time` decays from `1` to `0` over the shake — multiply your intensity by it for a natural fall-off. */
	update: (updateCss: CssProxy, time: number) => void;
}

/** Built-in shake recipes. Pass one to {@link Screenshake.shake}. */
export const SHAKE_TYPES = {
	/** ~0.33 s wobble combining a small random rotation with a blur fall-off. */
	NORMAL: {
		/** Decay rate — see {@link ShakeType.step}. */
		step: 3,
		/** Per-frame mutator — see {@link ShakeType.update}. */
		update(updateCss: CssProxy, time: number): void {
			const tr = `rotate(${randomBetweenFloat(-2, 2) * time}deg)`;
			updateCss("transform", tr);
			updateCss("webkitTransform", tr);

			updateCss("filter", `blur(${time * 5}px)`);
		},
	},
	/** ~0.07 s impact: blur-only fall-off, no rotation. */
	FAST: {
		/** Decay rate — see {@link ShakeType.step}. */
		step: 15,
		/** Per-frame mutator — see {@link ShakeType.update}. */
		update(updateCss: CssProxy, time: number): void {
			updateCss("filter", `blur(${time * 3}px)`);
		},
	},
} satisfies Record<string, ShakeType>;

/**
 * Shake an element by mutating its inline CSS each rAF tick. One shake per instance — re-calling {@link shake} while one is active returns `null`. The returned dispose function (and natural timer expiry) restores every CSS key the shake touched.
 *
 * Only the built-in {@link SHAKE_TYPES} (`NORMAL`, `FAST`) are supported today. Letting callers define their own would be a natural extension — impact pulses, slow rumble, directional jolts — since {@link ShakeType} is already public.
 */
export default class Screenshake {
	private isShaking: boolean = false;
	private shakeType: ShakeType = SHAKE_TYPES.NORMAL;
	private style: CSSStyleDeclaration;

	constructor(element: HTMLElement) {
		this.style = element.style;
	}

	/** Start a shake of the given `shakeType`. Returns a dispose function that stops the shake early and restores every CSS key it touched, or `null` if a shake is already active on this instance. Auto-stops and restores when the timer reaches zero. */
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
