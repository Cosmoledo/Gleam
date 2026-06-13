import CanvasManager from "@/core/CanvasManager";
import EventSystem from "@/core/EventSystem";
import Gameloop from "./Gameloop";
import Keyboard from "@/input/Keyboard";
import Pointer from "@/input/Pointer";
import Settings, { type SettingsOverrides } from "@/core/Settings";
import { debounce } from "@/utilities/Functions";

import "@/localization/Translator";
import "@/prototypes/index";

export default abstract class Game {
	public canman = new CanvasManager();
	public gameloop: Gameloop;
	public keyboard: Keyboard;
	public pointer: Pointer;
	private initialized = false;

	constructor(settingOverrides: SettingsOverrides = {}) {
		Settings.init(settingOverrides, this);

		history.scrollRestoration = "manual";

		this.gameloop = new Gameloop(this);
		this.keyboard = new Keyboard(this);
		this.pointer = new Pointer(this);
	}

	public draw(_context: CanvasRenderingContext2D): void {
		throw new Error("Override draw function!");
	}

	public update(_dt: number): void {
		throw new Error("Override update function!");
	}

	public async init(): Promise<void> {
		throw new Error(
			"Override init() and start the game via preInit() — do not call init() directly.",
		);
	}

	protected async preInit(doInit = true): Promise<void> {
		if (this.initialized) {
			throw new Error(
				"preInit() may only be called once per Game instance.",
			);
		}
		this.initialized = true;

		this.canman.finishSetup();

		window.addEventListener(
			"resize",
			debounce(() => EventSystem.dispatchEvent("resized"), 250),
			false,
		);

		this.gameloop.levelTime = 0;

		if (doInit) {
			await this.init();
		}

		EventSystem.dispatchEvent("resized");

		if (Settings.autoloop) {
			this.gameloop.startLoop();
		}
	}
}
