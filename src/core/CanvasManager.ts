import EventSystem from "./EventSystem";
import Settings from "@/core/Settings";
import Vec2 from "@/math/Vec2";
import { type CanvasConstruct, getCanvasConstruct } from "@/utilities/Canvas";

/** Role tags for canvases passed to {@link CanvasManager.setupCanvas}. Only `MAIN` is enforced (exactly one); the others are free-form labels you can use to group background/overlay canvases. */
export const CANVAS_TYPES = {
	/** Catch-all tag for canvases without a specific role. */
	ANY: Symbol("any"),
	/** Generic placeholder tag — distinct from `ANY` so consumers can differentiate. */
	DEFAULT: Symbol("default"),
	/** Background canvas (drawn behind the main one). */
	BACKGROUND: Symbol("background"),
	/** Primary render target. Exactly one canvas must be registered with this type before {@link CanvasManager.finishSetup}. */
	MAIN: Symbol("main"),
} as const;

/** Entry stored in {@link CanvasManager.canvasHolder} for each registered canvas. */
export interface CanvasHolder extends CanvasConstruct {
	/** Selector the canvas was registered under (also the map key). */
	id: string;
	/** Whether this canvas participates in {@link CanvasManager.resize} (rescaled to fit the window while preserving its buffer aspect ratio). */
	resize: boolean;
	/** Role tag — one of {@link CANVAS_TYPES}. */
	type: symbol;
}

/**
 * Tracks registered canvases and exposes the main 2D context. The width/height accessors and `size` getter all refer to the **buffer** dimensions (the canvas's `width`/`height` attributes — drawing-space pixels), while {@link resizedSize} and {@link ratio} describe the **display** size after CSS scaling.
 *
 * Owned by `Game` (`game.canman`). Lifecycle: subclass registers canvases via {@link setupCanvas} in its constructor, then `preInit()` calls {@link finishSetup}.
 */
export default class CanvasManager {
	/** Cached `getBoundingClientRect()` of the main canvas. Refreshed in {@link resize}. Used to map pointer client coords into canvas space. */
	public canvasBoundingClientRect!: DOMRect;
	/** Registry of every {@link setupCanvas}-registered canvas, keyed by selector. */
	public canvasHolder: Record<string, CanvasHolder> = {};
	/** Display-to-buffer scale factor after the last {@link resize} (`displayWidth / bufferWidth`). `1` until the first resize. */
	public ratio = 1;
	/** Display (CSS-pixel) size of the main canvas after the last {@link resize}. Independent of the buffer dimensions in {@link width}/{@link height}. */
	public resizedSize: Vec2 = new Vec2();
	private mainHolder!: CanvasHolder;

	/** Main canvas element (the one registered with `CANVAS_TYPES.MAIN`). */
	public get canvas(): HTMLCanvasElement {
		return this.mainHolder.canvas;
	}

	/** Main canvas 2D rendering context. */
	public get canvasContext(): CanvasRenderingContext2D {
		return this.mainHolder.context;
	}

	/** Main canvas **buffer** height (the drawing surface, not the CSS display size). */
	public get height(): number {
		return this.canvas.height;
	}

	/** Main canvas **buffer** height (the drawing surface, not the CSS display size). */
	public set height(height: number) {
		this.canvas.height = height;
	}

	/** Main canvas buffer dimensions as a new `Vec2`. */
	public get size(): Vec2 {
		return new Vec2(this.width, this.height);
	}

	/** Main canvas **buffer** width (the drawing surface, not the CSS display size). */
	public get width(): number {
		return this.canvas.width;
	}

	/** Main canvas **buffer** width (the drawing surface, not the CSS display size). */
	public set width(width: number) {
		this.canvas.width = width;
	}

	/** Finalize the canvas registry. Called once by `Game.preInit()`. Validates that exactly one `CANVAS_TYPES.MAIN` canvas is registered and that its buffer is non-zero, caches its bounding rect, and wires the `"resized"` listener if `Settings.enableResize`. Throws on duplicate calls or invalid registry state. */
	public finishSetup(): void {
		if (this.mainHolder) {
			throw new Error("Already set up.");
		}

		const mainCanvas = Object.values(this.canvasHolder).filter(
			holder => holder.type === CANVAS_TYPES.MAIN,
		);

		if (mainCanvas.length === 0) {
			throw new Error("No main canvas defined!");
		}

		if (mainCanvas.length > 1) {
			throw new Error("Multiple main canvas defined!");
		}

		this.mainHolder = mainCanvas[0];

		if (this.width === 0 || this.height === 0) {
			throw new Error("Main canvas has zero width or height.");
		}

		this.canvasBoundingClientRect = this.canvas.getBoundingClientRect();

		if (Settings.enableResize) {
			EventSystem.addEventListener("resized", (): void => this.resize(), {
				priority: true,
			});
		}
	}

	/** Rescale every opt-in canvas (`holder.resize === true`) to fit the window while preserving its buffer aspect ratio. Updates `style.width`/`style.height` only — buffer dimensions don't change. Refreshes {@link canvasBoundingClientRect}, {@link resizedSize}, and {@link ratio} from the main canvas. */
	public resize(): void {
		const windowRatio = window.innerHeight / window.innerWidth;

		Object.values(this.canvasHolder).forEach(ch => {
			if (!ch.resize) {
				return;
			}

			const canvasRatio = ch.canvas.height / ch.canvas.width;
			let width: number;
			let height: number;

			if (windowRatio < canvasRatio) {
				height = window.innerHeight;
				width = height / canvasRatio;
			} else {
				width = window.innerWidth;
				height = width * canvasRatio;
			}

			if (ch.canvas === this.canvas) {
				this.resizedSize = new Vec2(width, height);
				this.ratio = width / this.width;
			}

			ch.canvas.style.width = width + "px";
			ch.canvas.style.height = height + "px";
		});

		this.canvasBoundingClientRect = this.canvas.getBoundingClientRect();
	}

	/** Set the main context's `font` to `${size}px "${font}"`. Defaults the family to `Settings.font`. */
	public setFontSize(size: number, font: string = Settings.font): void {
		this.canvasContext.font = `${size}px "${font}"`;
	}

	/** Register a canvas at `selector` with the given role tag. Initializes its context (`fillStyle`/`strokeStyle` = white, font = `12px Arial`) and returns the {@link CanvasHolder}. `resize` defaults to `Settings.enableResize`. Throws if the selector doesn't match an element or has already been registered. */
	public setupCanvas(
		canvasType: symbol,
		selector: string,
		resize: boolean = Settings.enableResize,
	): CanvasHolder {
		if (!document.querySelector(selector)) {
			throw new Error("Canvas '" + selector + "' does not exist!");
		}

		if (this.canvasHolder[selector]) {
			throw new Error(`Canvas "${selector}" was already registered!`);
		}

		const newCanvas: CanvasHolder = Object.assign(
			{},
			getCanvasConstruct(selector),
			{
				id: selector,
				resize,
				type: canvasType,
			},
		);
		newCanvas.context.fillStyle = "white";
		newCanvas.context.strokeStyle = "white";
		newCanvas.context.font = "12px Arial";

		this.canvasHolder[selector] = newCanvas;

		return newCanvas;
	}
}
