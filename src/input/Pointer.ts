import EventSystem from "@/core/EventSystem";
import Vec2 from "@/math/Vec2";
import type Game from "@/core/Game";
import { clamp } from "@/utilities/Number";

export const POINTER_KEYS = {
	LEFT: 0,
	MIDDLE: 1,
	RIGHT: 2,
	PREV: 3,
	FORWARD: 4,
} as const;

export default class Pointer {
	public lastEvent: PointerEvent | null = null;
	public hasMoved = false;
	public posReal = new Vec2();
	public posRealLast = new Vec2();
	public posScaled = new Vec2();
	public posScaledLast = new Vec2();
	public pressed: boolean[] = [];
	private game: Game;

	constructor(game: Game) {
		this.game = game;

		const pointerMoveEvent = (event: PointerEvent): void => {
			if (event.target === this.game.canman.canvas) {
				event.preventDefault();
			}

			this.lastEvent = event;
			this.hasMoved = true;

			this.update(event);

			EventSystem.dispatchEvent("inputPointer", this);
		};

		const pointerStateChangeEvent = (event: PointerEvent): void => {
			if (event.target === this.game.canman.canvas) {
				event.preventDefault();
			}

			this.lastEvent = event;

			this.pressed[event.button] = event.type === "pointerdown";

			EventSystem.dispatchEvent("inputPointer", this);
		};

		window.addEventListener("pointermove", pointerMoveEvent, false);
		window.addEventListener("pointerdown", pointerStateChangeEvent, false);
		window.addEventListener("pointerup", pointerStateChangeEvent, false);
		window.addEventListener("blur", () => this.reset(), false);

		// Attach to `document` (not `canvas`) so HTML UI overlays and any
		// secondary canvases also get right-click suppressed.
		document.addEventListener(
			"contextmenu",
			(event: Event) => {
				event.preventDefault();
			},
			false,
		);
	}

	public reset(): void {
		this.pressed.length = 0;
	}

	private update(event: PointerEvent): void {
		this.posRealLast = this.posReal.clone();
		this.posReal.set(event.clientX, event.clientY);

		this.posScaledLast = this.posScaled.clone();
		this.posScaled.set(
			clamp(
				(((event.clientX -
					this.game.canman.canvasBoundingClientRect.left) /
					this.game.canman.canvasBoundingClientRect.width) *
					this.game.canman.width) |
					0,
				0,
				this.game.canman.width,
			),
			clamp(
				(((event.clientY -
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
