import CanvasManager from "@/core/CanvasManager";
import EventSystem from "@/core/EventSystem";
import Gameloop from "./Gameloop";
import Keyboard from "@/input/Keyboard";
import Pointer from "@/input/Pointer";
import Settings, { type SettingsOverrides } from "@/core/Settings";
import { debounce } from "@/utilities/Functions";

import "@/localization/Translator";
import "@/prototypes/index";

/**
 * Abstract base for a Gleam game. Subclass it and implement {@link init}, {@link update}, and {@link draw}. The constructor wires up {@link CanvasManager}, {@link Gameloop}, {@link Keyboard}, and {@link Pointer}; the subclass must register at least one canvas with `canman.setupCanvas(...)` and then call {@link preInit} to start everything.
 *
 * **Singleton-per-page.** The framework registers global listeners on `window`/`document` and writes `history.scrollRestoration`; multiple instances on the same page will fight each other.
 */
export default abstract class Game {
	/** Canvas registry + 2D context exposure. Register canvases here from the constructor (`canman.setupCanvas(CANVAS_TYPES.MAIN, "#game")`) before calling {@link preInit}. */
	public canman = new CanvasManager();
	/** The fixed-step driver. Started automatically by `preInit` when `Settings.autoloop` is `true`. */
	public gameloop: Gameloop;
	/** Live keyboard state. See {@link Keyboard}. */
	public keyboard: Keyboard;
	/** Live pointer (mouse / pen / touch) state. See {@link Pointer}. */
	public pointer: Pointer;
	private initialized = false;

	constructor(settingOverrides: SettingsOverrides = {}) {
		Settings.init(settingOverrides, this);

		history.scrollRestoration = "manual";

		this.gameloop = new Gameloop(this);
		this.keyboard = new Keyboard(this);
		this.pointer = new Pointer(this);
	}

	/** Render the current frame. Called by {@link Gameloop} after the canvas is cleared. Subclasses must override — the default throws. */
	public draw(_context: CanvasRenderingContext2D): void {
		throw new Error("Override draw function!");
	}

	/** Advance the simulation by `dt` seconds (= `Settings.fps`). Called by {@link Gameloop} zero-or-more times per frame depending on real-time accumulation. Subclasses must override — the default throws. */
	public update(_dt: number): void {
		throw new Error("Override update function!");
	}

	/** One-time setup hook (assets, world build) invoked by {@link preInit}. Can be `async`; the loop waits for it to resolve before starting. **Do not call directly** — kick off via {@link preInit} from the constructor. Subclasses must override — the default throws. */
	public async init(): Promise<void> {
		throw new Error(
			"Override init() and start the game via preInit() — do not call init() directly.",
		);
	}

	/** Finalise engine wiring and start the loop. Call once from the subclass constructor *after* registering canvases. Steps: `canman.finishSetup()` → install debounced `window.resize` → reset `gameloop.levelTime` → `await this.init()` (if `doInit`) → dispatch `"resized"` → start the loop if `Settings.autoloop`. Throws if called twice. Pass `doInit: false` to skip the `init()` await (useful for tests). */
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
