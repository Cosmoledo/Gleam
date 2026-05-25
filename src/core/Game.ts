import { debounce, rafLoop } from "@/utilities/Functions";
import { getCanvasConstruct } from "@/utilities/Canvas";
import Settings, { type SettingsOverrides } from "@/core/Settings";
import Sound from "@/core/Sound";
import Vec2 from "@/core/Vec2";
import Keyboard from "@/input/Keyboard";
import Mouse from "@/input/Mouse";
import {
	EventSystem,
	EVENT_NAMES,
	type GameEventMap,
} from "@/core/EventSystem";
import "@/prototypes/index";
import "@/localization/Translator";

export default abstract class Game {
	public canvasBoundingClientRect!: DOMRect;
	public canvasHolder: Map<string, GameLIB.CanvasHolder> = new Map();
	public levelTime = 0;
	public ratio = 1;
	public resizedSize!: Vec2;
	private accumulator = 0;
	private readonly eventTarget = new EventSystem();
	private keyboard!: Keyboard;
	private loopHasStarted = false;
	private stop = false;

	public get height(): number {
		return this.getCanvas().height;
	}

	public set height(height: number) {
		this.getCanvas().height = height;
	}

	public get size(): Vec2 {
		return new Vec2(this.width, this.height);
	}

	public get width(): number {
		return this.getCanvas().width;
	}

	public set width(width: number) {
		this.getCanvas().width = width;
	}

	constructor(settingOverrides: SettingsOverrides = {}) {
		Settings.init(settingOverrides, this);

		history.scrollRestoration = "manual";
		new Mouse(this);
	}

	public draw(_context: CanvasRenderingContext2D): void {
		throw new Error("Override draw function!");
	}

	public update(_dt: number): void {
		throw new Error("Override update function!");
	}

	public async init(): Promise<void> {
		throw new Error("Override init function!");
	}

	public addEventListener<K extends keyof GameEventMap>(
		eventName: K,
		callback: (...args: GameEventMap[K]) => void,
		once: boolean = false,
	): void {
		this.eventTarget.addEventListener(eventName, callback, once);
	}

	public dispatchEvent<K extends keyof GameEventMap>(
		eventName: K,
		...params: GameEventMap[K]
	): void {
		this.eventTarget.dispatchEvent(eventName, ...params);
	}

	public setFontSize(size: number, font: string = Settings.font): void {
		this.getCanvasContext().font = `${size}px "${font}"`;
	}

	public startLoop(): void {
		this.stop = false;
		this.looper();
	}

	public stopKeyPress(code: string): void {
		this.keyboard.stopPress(code);
	}

	public stopLoop(): void {
		this.stop = true;

		if ("sound" in this) {
			(this.sound as Sound).pause();
		}
	}

	public getCanvas(): HTMLCanvasElement {
		return this.canvasHolder.get("main")!.canvas;
	}

	public getCanvasContext(): CanvasRenderingContext2D {
		return this.canvasHolder.get("main")!.context;
	}

	public isKeyPressed(code: string): boolean {
		return this.keyboard.isPressed(code);
	}

	public isStopped(): boolean {
		return this.stop;
	}

	protected async preInit(doInit = true): Promise<void> {
		if (this.canvasHolder.size === 0) {
			throw new Error(
				"No canvas registered, use for registering 'setupCanvas'!",
			);
		}

		document.addEventListener(
			"contextmenu",
			(event: Event) => {
				event.preventDefault();
			},
			false,
		);

		if (Settings.enableResize) {
			this.addEventListener(EVENT_NAMES.AFTER_RESIZE, (): void =>
				this.resize(),
			);
			this.resize();
		}

		window.addEventListener(
			"resize",
			debounce(() => this.dispatchEvent(EVENT_NAMES.AFTER_RESIZE), 250),
			false,
		);

		this.levelTime = 0;

		this.keyboard = new Keyboard(this);

		if (doInit) {
			await this.init();
		}

		this.dispatchEvent(EVENT_NAMES.AFTER_RESIZE);

		if (Settings.autoloop) {
			this.looper();
		}
	}

	protected resize(): void {
		const windowRatio = window.innerHeight / window.innerWidth;

		this.canvasHolder.forEach(ch => {
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

			if (ch.canvas === this.getCanvas()) {
				this.resizedSize = new Vec2(width, height);
				this.ratio = width / this.width;
			}

			ch.canvas.style.width = width + "px";
			ch.canvas.style.height = height + "px";
		});

		this.canvasBoundingClientRect =
			this.getCanvas().getBoundingClientRect();
	}

	protected setupCanvas(
		canvasType: symbol,
		selector: string,
		resize: boolean = true,
	): GameLIB.CanvasHolder {
		if (!document.querySelector(selector)) {
			throw new Error("Canvas '" + selector + "' does not exist!");
		}

		const name = selector.replace("#", "");

		if (this.canvasHolder.has(name)) {
			throw new Error(
				"Canvas '" + selector + "' was already registered!",
			);
		}

		const newCanvas: GameLIB.CanvasHolder = Object.assign(
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

		this.canvasHolder.set(name, newCanvas);

		this.canvasBoundingClientRect =
			this.getCanvas().getBoundingClientRect();

		return newCanvas;
	}

	private looper(): void {
		if (this.loopHasStarted) {
			return;
		}

		this.loopHasStarted = true;
		const context = this.getCanvasContext();

		const stopLoop = rafLoop(dt => {
			if (this.stop) {
				this.dispatchEvent(EVENT_NAMES.STOP);
				this.keyboard.reset();
				this.loopHasStarted = false;
				console.log("Simulation stopped.");
				stopLoop();
				return;
			}

			this.accumulator += dt;
			this.levelTime += dt * 1000;

			while (this.accumulator > Settings.fps) {
				this.preUpdate(Settings.fps);
				this.accumulator -= Settings.fps;
			}

			this.preDraw(context);
		});

		console.log("Simulation started.");
	}

	private preDraw(context: CanvasRenderingContext2D): void {
		if (!Settings.doNotClear) {
			if (Settings.useClearRect) {
				context.clearRect(
					0,
					0,
					this.getCanvas().width,
					this.getCanvas().height,
				);
			} else {
				context.fillStyle = Settings.backgroundColor;
				context.fillRect(
					0,
					0,
					this.getCanvas().width,
					this.getCanvas().height,
				);
			}
		}

		this.draw(context);
	}

	private preUpdate(dt: number): void {
		this.update(dt);
	}
}
