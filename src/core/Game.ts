import { debounce, rafLoop } from "@/utilities/Functions";
import { EventSystem, EVENT_NAMES } from "@/core/EventSystem";
import CanvasManager from "@/core/CanvasManager";
import Keyboard from "@/input/Keyboard";
import Mouse from "@/input/Mouse";
import Settings, { type SettingsOverrides } from "@/core/Settings";
import Sound from "@/core/Sound";

import "@/prototypes/index";
import "@/localization/Translator";

export default abstract class Game {
	public canman = new CanvasManager();
	public events = new EventSystem();
	public keyboard: Keyboard;
	public levelTime = 0;
	private accumulator = 0;
	private loopHasStarted = false;
	private stop = false;

	constructor(settingOverrides: SettingsOverrides = {}) {
		Settings.init(settingOverrides, this);

		history.scrollRestoration = "manual";

		this.canman = new CanvasManager();
		this.keyboard = new Keyboard(this);
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

	public isStopped(): boolean {
		return this.stop;
	}

	protected async preInit(doInit = true): Promise<void> {
		this.canman.finishSetup(this);

		document.addEventListener(
			"contextmenu",
			(event: Event) => {
				event.preventDefault();
			},
			false,
		);

		window.addEventListener(
			"resize",
			debounce(
				() => this.events.dispatchEvent(EVENT_NAMES.AFTER_RESIZE),
				250,
			),
			false,
		);

		this.levelTime = 0;

		if (doInit) {
			await this.init();
		}

		this.events.dispatchEvent(EVENT_NAMES.AFTER_RESIZE);

		if (Settings.autoloop) {
			this.looper();
		}
	}

	private looper(): void {
		if (this.loopHasStarted) {
			return;
		}

		this.loopHasStarted = true;
		const context = this.canman.canvasContext;

		const stopLoop = rafLoop(dt => {
			if (this.stop) {
				this.events.dispatchEvent(EVENT_NAMES.STOP);
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
					this.canman.canvas.width,
					this.canman.canvas.height,
				);
			} else {
				context.fillStyle = Settings.backgroundColor;
				context.fillRect(
					0,
					0,
					this.canman.canvas.width,
					this.canman.canvas.height,
				);
			}
		}

		this.draw(context);
	}

	private preUpdate(dt: number): void {
		this.update(dt);
	}
}
