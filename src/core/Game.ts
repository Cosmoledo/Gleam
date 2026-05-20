import { clamp } from "@/utilities/Number";
import { EVENT_NAMES, KEYBOARD_KEYS, MOUSE_TYPES } from "@/core/Constants";
import { getCanvasConstruct } from "@/utilities/Functions";
import Sound from "@/core/Sound";
import Vec2 from "@/core/Vec2";

import "@/prototypes/index";
import "@/localization/Translator";

export default abstract class Game {
	public static settings: GameLIB.Settings = {
		antialias: false,
		autoloop: true,
		backgroundColor: "#444",
		debug: false,
		doNotClear: false,
		enableResize: true,
		font: "Arial",
		fps: 1 / 60,
		localStorage: {
			isMobile: false,
			language: "",
		},
		triedToClose: (): void => void 0,
		useClearRect: true,
		warnBeforeCLose: false,
	};
	public canvasHolder: Map<string, GameLIB.CanvasHolder> = new Map();
	public levelTime = 0;
	public mouse: GameLIB.Mouse = {
		altKey: false,
		ctrlKey: false,
		hasMoved: false,
		posReal: new Vec2(),
		posRealLast: new Vec2(),
		posScaled: new Vec2(),
		posScaledLast: new Vec2(),
		pressed: [],
		released: [],
		shiftKey: false,
		size: new Vec2(10, 10),
		type: MOUSE_TYPES.NONE,
		target: null,
		calcTarget() {
			this.target = document.elementFromPoint(
				this.posReal.x,
				this.posReal.y,
			) as HTMLElement;
		},
		update: (event: MouseEvent) => {
			this.mouse.posRealLast = this.mouse.posReal.clone();
			this.mouse.posReal.set(
				event.clientX + this.mouse.size.x * 0.5,
				event.clientY + this.mouse.size.y * 0.5,
			);

			this.mouse.posScaledLast = this.mouse.posScaled.clone();
			this.mouse.posScaled.set(
				clamp(
					(((event.clientX +
						this.mouse.size.x * 0.5 -
						this.canvasBoundingClientRect.left) /
						this.canvasBoundingClientRect.width) *
						this.width) |
						0,
					0,
					this.width,
				),
				clamp(
					(((event.clientY +
						this.mouse.size.y * 0.5 -
						this.canvasBoundingClientRect.top) /
						this.canvasBoundingClientRect.height) *
						this.height) |
						0,
					0,
					this.height,
				),
			);
		},
	};
	public resizedSize!: Vec2;
	public ratio = 1;
	public canvasBoundingClientRect!: DOMRect;
	private accumulator = 0;
	private eventListener: Record<
		string,
		{ callback: (args: any) => void; options: { once: boolean } }[]
	> = {};
	private keys: boolean[] = [];
	private lastTime = 0;
	private loopHasStarted = false;
	private step: number = 1 / 60;
	private stop = false;

	public get settings(): GameLIB.Settings {
		return Game.settings;
	}

	public get isMobile(): boolean {
		const mobileTest1 =
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent,
			);

		// https://coderwall.com/p/i817wa/one-line-function-to-detect-mobile-devices-with-javascript
		const mobileTest2 =
			typeof window.orientation !== "undefined" ||
			navigator.userAgent.indexOf("IEMobile") !== -1;

		return mobileTest1 || mobileTest2;
	}

	constructor(settings?: GameLIB.MaybeSettings) {
		Object.assign(this.settings, settings);

		if (this.settings.debug) {
			// debug hook: expose instance on window for devtools inspection
			(window as any).game = this;
		}

		if (this.settings.warnBeforeCLose) {
			window.addEventListener(
				"beforeunload",
				(event: BeforeUnloadEvent) => {
					if (this.settings.triedToClose) {
						this.settings.triedToClose();
					}

					event.preventDefault();
					event.returnValue = true;
					return "Are you sure?";
				},
				false,
			);
		}

		this.step = this.settings.fps;
		history.scrollRestoration = "manual";

		Game.settings.localStorage.isMobile = localStorage.getOrSetDefault(
			"isMobile",
			this.isMobile,
		);

		Game.settings.localStorage.language = localStorage.getOrSetDefault(
			"language",
			navigator.language.split("-")[0] || "en",
		);
	}

	public changeSetting(key: string, value: string): void {
		if (
			Object.prototype.hasOwnProperty.call(
				Game.settings.localStorage,
				key,
			)
		) {
			localStorage.setItem(key, value);
			Game.settings.localStorage[key] = value;
		} else {
			Game.settings[key] = value;
		}
	}

	public async init(): Promise<void> {
		throw new Error("Override init function!");
	}

	public draw(_context: CanvasRenderingContext2D): void {
		throw new Error("Override draw function!");
	}

	public update(_dt: number): void {
		throw new Error("Override update function!");
	}

	public getCanvas(): HTMLCanvasElement {
		return this.canvasHolder.get("main")!.canvas;
	}

	public getCanvasContext(): CanvasRenderingContext2D {
		return this.canvasHolder.get("main")!.context;
	}

	public addEventListener(
		eventName: string,
		callback: (...args: any[]) => void,
		once: boolean = false,
	): void {
		const event = { callback, options: { once } };

		if (this.eventListener[eventName]) {
			this.eventListener[eventName].push(event);
		} else {
			this.eventListener[eventName] = [event];
		}
	}

	public isKeyPressed(keyCode: number): boolean {
		return this.keys[keyCode];
	}

	public stopKeyPress(keyCode: number): void {
		this.keys[keyCode] = false;
	}

	public isStopped(): boolean {
		return this.stop;
	}

	public startLoop(): void {
		this.stop = false;
		this.looper();
	}

	public stopLoop(): void {
		this.stop = true;

		if ("sound" in this) {
			(this.sound as Sound).pause();
		}
	}

	public dispatchEvent(eventName: string, ...params: any[]): void {
		const events = this.eventListener[eventName];

		if (!events) {
			return;
		}

		for (let i = events.length - 1; i >= 0; i--) {
			events[i].callback.apply(this, [params]);

			if (events[i].options.once) {
				events.splice(i, 1);
			}
		}
	}

	public setFontSize(size: number, font: string = this.settings.font): void {
		this.getCanvasContext().font = `${size}px "${font}"`;
	}

	public get width(): number {
		return this.getCanvas().width;
	}

	public set width(width: number) {
		this.getCanvas().width = width;
	}

	public get height(): number {
		return this.getCanvas().height;
	}

	public set height(height: number) {
		this.getCanvas().height = height;
	}

	public get size(): Vec2 {
		return new Vec2(this.width, this.height);
	}

	protected setupCanvas(
		canvasType: symbol,
		selector: string,
		resize: boolean = true,
	): GameLIB.CanvasHolder {
		if (!document.querySelector(selector)) {
			throw new Error("Canvas '" + selector + "' does not exist!");
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

		this.canvasHolder.set(selector.replace("#", ""), newCanvas);

		this.canvasBoundingClientRect =
			this.getCanvas().getBoundingClientRect();

		this.addEventListener(EVENT_NAMES.AFTER_RESIZE, () =>
			setTimeout(
				() =>
					(this.canvasBoundingClientRect =
						this.getCanvas().getBoundingClientRect()),
				0,
			),
		);

		return newCanvas;
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

		if (this.settings.debug) {
			this.addEventListener(EVENT_NAMES.KEY, (keys: boolean[]): void => {
				if (keys[KEYBOARD_KEYS.KEY_ESCAPE]) {
					this.stopLoop();
				}
			});
		}

		if (this.settings.enableResize) {
			this.addEventListener(EVENT_NAMES.AFTER_RESIZE, (): void =>
				this.resize(),
			);
			this.resize();
		}

		let resizeTimer: any;
		window.addEventListener(
			"resize",
			(): void => {
				clearTimeout(resizeTimer);
				resizeTimer = setTimeout(
					() => this.dispatchEvent(EVENT_NAMES.AFTER_RESIZE),
					250,
				);
			},
			false,
		);

		this.levelTime = 0;

		this.setupMouseListener();
		this.setupKeyListener();

		if (doInit) {
			await this.init();
		}

		this.dispatchEvent(EVENT_NAMES.AFTER_RESIZE);

		if (this.settings.autoloop) {
			this.looper();
		}
	}

	private setupMouseListener(): void {
		const TYPES: {
			[key: string]: symbol;
		} = {
			pointermove: MOUSE_TYPES.MOVE,
			mousedown: MOUSE_TYPES.DOWN,
			mouseup: MOUSE_TYPES.UP,
		};

		const mouseMoveEvent = (event: MouseEvent): void => {
			if (event.target === this.getCanvas()) {
				event.preventDefault();
			}

			this.mouse.type = TYPES[event.type];
			this.mouse.altKey = event.altKey;
			this.mouse.ctrlKey = event.ctrlKey;
			this.mouse.shiftKey = event.shiftKey;
			this.mouse.target = event.target as HTMLElement;

			this.mouse.hasMoved = true;

			this.mouse.update(event);

			this.dispatchEvent(EVENT_NAMES.MOUSE, this.mouse);
		};

		const mouseStateChangeEvent = (event: MouseEvent): void => {
			if (event.target === this.getCanvas()) {
				event.preventDefault();
			}

			this.mouse.type = TYPES[event.type];

			if (event.type === "mousedown") {
				this.mouse.pressed[event.button] = true;
				this.mouse.released[event.button] = false;
			} else if (event.type === "mouseup") {
				this.mouse.pressed[event.button] = false;
				this.mouse.released[event.button] = true;
			}

			this.dispatchEvent(EVENT_NAMES.MOUSE, this.mouse);
		};

		window.addEventListener("pointermove", mouseMoveEvent, false);
		window.addEventListener("mousedown", mouseStateChangeEvent, false);
		window.addEventListener("mouseup", mouseStateChangeEvent, false);
	}

	private setupKeyListener(): void {
		const keyValues = Object.values(KEYBOARD_KEYS) as number[];

		const keyEvent = (event: KeyboardEvent): void => {
			const keyCode = event.which || event.keyCode;

			if (keyValues.includes(keyCode)) {
				if (event.type === "keydown") {
					this.keys[keyCode] = true;
				} else if (event.type === "keyup") {
					this.keys[keyCode] = false;
				}

				this.dispatchEvent(EVENT_NAMES.KEY, this.keys, keyCode);
			}
		};

		window.addEventListener("keydown", keyEvent, false);
		window.addEventListener("keyup", keyEvent, false);
	}

	private looper(): void {
		if (this.loopHasStarted) {
			return;
		}

		this.lastTime = 0;
		const start = performance.now();
		const context = this.getCanvasContext();
		const myLopper = (fullTime = 0): void => {
			if (this.stop) {
				// this.getCanvas().style.display = "none";
				this.dispatchEvent(EVENT_NAMES.STOP);
				// this.eventListener = {};
				this.keys.length = 0;
				console.log("Simulation stopped.");
				this.loopHasStarted = false;
				return;
			}

			fullTime = Math.max(0, fullTime - start);
			this.accumulator += (fullTime - this.lastTime) / 1000;
			this.levelTime += fullTime - this.lastTime;
			this.lastTime = fullTime;

			while (this.accumulator > this.step) {
				this.preUpdate(this.step);
				this.accumulator -= this.step;
			}
			this.preDraw(context);

			requestAnimationFrame(myLopper);
		};
		this.loopHasStarted = true;
		requestAnimationFrame(myLopper);
		console.log("Simulation started.");
	}

	private preDraw(context: CanvasRenderingContext2D): void {
		if (!this.settings.doNotClear) {
			if (this.settings.useClearRect) {
				context.clearRect(
					0,
					0,
					this.getCanvas().width,
					this.getCanvas().height,
				);
			} else {
				context.fillStyle = this.settings.backgroundColor;
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
