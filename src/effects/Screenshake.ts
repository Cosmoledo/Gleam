import { randomBeetweenFloat } from "@/utilities/Math";
import Game from "@/core/Game";

interface ShakeType {
	step: number;
	update: (style: CSSStyleDeclaration, time: number) => void;
}

export const SHAKE_TYPES = {
	NORMAL: {
		step: 0.04,
		update(style: CSSStyleDeclaration, time: number): void {
			const tr = "rotate(" + randomBeetweenFloat(-2, 2) * time + "deg)";
			style.transform = style.webkitTransform = tr;

			const blur = time * 5;
			style.filter = "blur(" + blur + "px)";
		},
	},
	FAST: {
		step: 0.25,
		update(style: CSSStyleDeclaration, time: number): void {
			const blur = time * 3;
			style.filter = "blur(" + blur + "px)";
		},
	},
} as any;

export default class Screenshake {
	private style: CSSStyleDeclaration;
	private time: number;
	private step: number;

	private shakeType!: ShakeType;

	constructor(element: HTMLElement) {
		this.style = element.style;
		this.time = 0;
		this.step = 0.04;
	}

	public shake(shakeType: ShakeType = SHAKE_TYPES.NORMAL): void {
		if (Game.settings.localStorage.isMobile) {
			return;
		}

		this.shakeType = shakeType;
		this.step = shakeType.step;
		this.time = 1;
		this.update();
	}

	private update(): void {
		const update = (): void => {
			this.shakeType.update(this.style, this.time);

			this.time -= this.step;
			if (this.time >= 0) {
				requestAnimationFrame(update);
			} else {
				this.time = 0;
				this.style.transform = "none";
				this.style.filter = "";
			}
		};

		update();
	}
}
