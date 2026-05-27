import { EVENT_NAMES } from "./EventSystem";
import { getCanvasConstruct } from "@/utilities/Canvas";
import Game from "./Game";
import Settings from "@/core/Settings";
import Vec2 from "@/core/Vec2";

export const CANVAS_TYPES = {
	ANY: Symbol("any"),
	DEFAULT: Symbol("default"),
	BACKGROUND: Symbol("background"),
	MAIN: Symbol("main"),
} as const;

export interface CanvasHolder extends GameLIB.CanvasConstruct {
	id: string;
	resize: boolean;
	type: symbol;
}

export default class CanvasManager {
	public canvasBoundingClientRect!: DOMRect;
	public canvasHolder: Record<string, CanvasHolder> = {};
	public ratio = 1;
	public resizedSize: Vec2 = new Vec2();
	private mainHolder!: CanvasHolder;

	public get canvas(): HTMLCanvasElement {
		return this.mainHolder.canvas;
	}

	public get canvasContext(): CanvasRenderingContext2D {
		return this.mainHolder.context;
	}

	public get height(): number {
		return this.canvas.height;
	}

	public set height(height: number) {
		this.canvas.height = height;
	}

	public get size(): Vec2 {
		return new Vec2(this.width, this.height);
	}

	public get width(): number {
		return this.canvas.width;
	}

	public set width(width: number) {
		this.canvas.width = width;
	}

	public finishSetup(game: Game): void {
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

		this.canvasBoundingClientRect = this.canvas.getBoundingClientRect();

		if (Settings.enableResize) {
			game.events.addEventListener(EVENT_NAMES.AFTER_RESIZE, (): void =>
				this.resize(),
			);
		}
	}

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

	public setFontSize(size: number, font: string = Settings.font): void {
		this.canvasContext.font = `${size}px "${font}"`;
	}

	public setupCanvas(
		canvasType: symbol,
		selector: string,
		resize: boolean = true,
	): CanvasHolder {
		if (!document.querySelector(selector)) {
			throw new Error("Canvas '" + selector + "' does not exist!");
		}

		const name = selector.replace("#", "");

		if (this.canvasHolder[name]) {
			throw new Error(
				"Canvas '" + selector + "' was already registered!",
			);
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

		this.canvasHolder[name] = newCanvas;

		return newCanvas;
	}
}
