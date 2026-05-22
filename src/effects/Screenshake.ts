import { randomBetweenFloat } from "@/utilities/Math";
import { rafLoop } from "@/utilities/Functions";

interface ShakeType {
	step: number;
	update: (style: CSSStyleDeclaration, time: number) => void;
}

export const SHAKE_TYPES = {
	NORMAL: {
		step: 3,
		update(style: CSSStyleDeclaration, time: number): void {
			const tr = "rotate(" + randomBetweenFloat(-2, 2) * time + "deg)";
			style.transform = style.webkitTransform = tr;

			const blur = time * 5;
			style.filter = "blur(" + blur + "px)";
		},
	},
	FAST: {
		step: 15,
		update(style: CSSStyleDeclaration, time: number): void {
			const blur = time * 3;
			style.filter = "blur(" + blur + "px)";
		},
	},
} satisfies Record<string, ShakeType>;

export default class Screenshake {
	private shakeType!: ShakeType;
	private style: CSSStyleDeclaration;
	private blocked: boolean = false;

	constructor(element: HTMLElement) {
		this.style = element.style;
	}

	public shake(shakeType: ShakeType = SHAKE_TYPES.NORMAL): boolean {
		if (this.blocked) {
			return false;
		}

		this.blocked = true;
		this.shakeType = shakeType;
		let timer = 1;

		const stopLoop = rafLoop(dt => {
			this.shakeType.update(this.style, timer);
			timer -= this.shakeType.step * dt;

			if (timer <= 0) {
				this.blocked = false;
				this.style.transform = "none";
				this.style.filter = "";
				stopLoop();
			}
		});

		return true;
	}
}
