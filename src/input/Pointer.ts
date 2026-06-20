import EventSystem from "@/core/EventSystem";
import Vec2 from "@/math/Vec2";
import type Game from "@/core/Game";
import { clamp } from "@/utilities/Number";

/** Button indices that match `PointerEvent.button` and index into {@link Pointer.pressed}. */
export const POINTER_KEYS = {
	/** Primary button (left for right-handers). */
	LEFT: 0,
	/** Middle button / wheel click. */
	MIDDLE: 1,
	/** Secondary button (right for right-handers). */
	RIGHT: 2,
	/** "Back" side button (browser back). */
	PREV: 3,
	/** "Forward" side button. */
	FORWARD: 4,
} as const;

/**
 * Pointer (mouse / pen / touch) state. Wired into `Game` automatically. The preferred way to consume input is to subscribe to the {@link EventSystem} `"inputPointer"` event — it fires on every move and button transition, with this `Pointer` instance as the payload. If you need the latest state on a frame boundary instead, poll `game.pointer.posScaled` and `game.pointer.pressed[POINTER_KEYS.LEFT]` from `update`.
 *
 * Suppresses the browser context menu on right-click globally.
 */
export default class Pointer {
	/** Dirty bit set to `true` on every move and never cleared by the engine — flip it back to `false` after reading to detect "moved since last check". */
	public hasMoved = false;
	/** Last raw `PointerEvent` received. `null` until any pointer event fires. Use for properties not surfaced as Vec2/booleans (pressure, pointerType, etc.). */
	public lastEvent: PointerEvent | null = null;
	/** Viewport-space coordinates (`event.clientX/Y` — CSS pixels relative to the page). */
	public posReal = new Vec2();
	/** Previous tick's {@link posReal}. Subtract for a per-frame delta. */
	public posRealLast = new Vec2();
	/** Canvas-space coordinates, mapped from the bounding rect into the main canvas's pixel buffer and clamped to its size. This is the position to use for in-game logic. */
	public posScaled = new Vec2();
	/** Previous tick's {@link posScaled}. */
	public posScaledLast = new Vec2();
	/** Per-button pressed state. Index with {@link POINTER_KEYS} (e.g. `pressed[POINTER_KEYS.LEFT]`). Sparse — unindexed entries are `undefined`, not `false`. */
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

	/** Clear all pressed-button state. Called automatically on `window` blur so held buttons don't stay "pressed" forever when focus is lost. */
	public reset(): void {
		this.pressed.length = 0;
	}

	private update(event: PointerEvent): void {
		this.posRealLast.set(this.posReal.x, this.posReal.y);
		this.posReal.set(event.clientX, event.clientY);

		this.posScaledLast.set(this.posScaled.x, this.posScaled.y);
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
