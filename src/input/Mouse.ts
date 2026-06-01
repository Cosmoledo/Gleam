import EventSystem from "@/core/EventSystem";
import Vec2 from "@/math/Vec2";
import type Game from "@/core/Game";
import { clamp } from "@/utilities/Number";

export const MOUSE_KEYS = {
	LEFT: 0,
	MIDDLE: 1,
	RIGHT: 2,
	PREV: 3,
	FORWARD: 4,
} as const;

export default class Mouse {
	public lastEvent: MouseEvent | null = null;
	public hasMoved = false;
	public posReal = new Vec2();
	public posRealLast = new Vec2();
	public posScaled = new Vec2();
	public posScaledLast = new Vec2();
	public pressed: boolean[] = [];
	public size = new Vec2(10, 10);
	private game: Game;

	constructor(game: Game) {
		this.game = game;

		const mouseMoveEvent = (event: MouseEvent): void => {
			if (event.target === this.game.canman.canvas) {
				event.preventDefault();
			}

			this.lastEvent = event;
			this.hasMoved = true;

			this.update(event);

			EventSystem.dispatchEvent("inputMouse", this);
		};

		const mouseStateChangeEvent = (event: MouseEvent): void => {
			if (event.target === this.game.canman.canvas) {
				event.preventDefault();
			}

			this.lastEvent = event;

			this.pressed[event.button] = event.type === "mousedown";

			EventSystem.dispatchEvent("inputMouse", this);
		};

		window.addEventListener("pointermove", mouseMoveEvent, false);
		window.addEventListener("mousedown", mouseStateChangeEvent, false);
		window.addEventListener("mouseup", mouseStateChangeEvent, false);
	}

	private update(event: MouseEvent): void {
		this.posRealLast = this.posReal.clone();
		this.posReal.set(
			event.clientX + this.size.x * 0.5,
			event.clientY + this.size.y * 0.5,
		);

		this.posScaledLast = this.posScaled.clone();
		this.posScaled.set(
			clamp(
				(((event.clientX +
					this.size.x * 0.5 -
					this.game.canman.canvasBoundingClientRect.left) /
					this.game.canman.canvasBoundingClientRect.width) *
					this.game.canman.width) |
					0,
				0,
				this.game.canman.width,
			),
			clamp(
				(((event.clientY +
					this.size.y * 0.5 -
					this.game.canman.canvasBoundingClientRect.top) /
					this.game.canman.canvasBoundingClientRect.height) *
					this.game.canman.height) |
					0,
				0,
				this.game.canman.height,
			),
		);
	}
}
