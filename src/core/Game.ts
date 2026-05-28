import CanvasManager from "@/core/CanvasManager";
import Gameloop from "./Gameloop";
import Keyboard from "@/input/Keyboard";
import Mouse from "@/input/Mouse";
import Settings, { type SettingsOverrides } from "@/core/Settings";
import { debounce } from "@/utilities/Functions";
import { EVENT_NAMES, EventSystem } from "@/core/EventSystem";

import "@/localization/Translator";
import "@/prototypes/index";

export default abstract class Game {
	public canman = new CanvasManager();
	public events = new EventSystem();
	public gameloop: Gameloop;
	public keyboard: Keyboard;

	constructor(settingOverrides: SettingsOverrides = {}) {
		Settings.init(settingOverrides, this);

		history.scrollRestoration = "manual";

		this.gameloop = new Gameloop(this, this.update, this.preDraw);
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
		throw new Error("Override init function! And call preInit()");
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
			debounce(() => this.events.dispatchEvent(EVENT_NAMES.RESIZED), 250),
			false,
		);

		this.gameloop.levelTime = 0;

		if (doInit) {
			await this.init();
		}

		this.events.dispatchEvent(EVENT_NAMES.RESIZED);

		if (Settings.autoloop) {
			this.gameloop.startLoop();
		}
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
}
