import EventSystem from "./EventSystem";
import Settings from "./Settings";
import type Game from "./Game";
import { rafLoop } from "@/utilities/Functions";

/** rAF gaps larger than this (s) reset the accumulator instead of running catch-up steps — keeps a backgrounded tab or paused debugger from fast-forwarding the simulation on resume. */
export const MAX_DT_SECONDS = 0.25;
/** Hard cap on update steps per rendered frame. If simulation can't keep up, it falls behind in `levelTime` rather than blocking the main thread. */
export const MAX_STEPS_PER_FRAME = 5;

/**
 * Fixed-step game loop. Owned by `Game` (`game.gameloop`) — usually started automatically by `preInit()` when `Settings.autoloop` is `true`. Each rendered frame:
 *
 * 1. Accumulates real time
 * 2. Runs `game.update(Settings.fps)` zero-or-more times until the accumulator is drained (bounded by {@link MAX_STEPS_PER_FRAME} to avoid runaway catch-up)
 * 3. Clears the canvas (per `Settings.doNotClear` / `Settings.useClearRect`) and calls `game.draw(context)`
 *
 * Fires the {@link EventSystem} `"gameloopStopped"` event when teardown completes (not when {@link stopLoop} is called).
 */
export default class Gameloop {
	/** Simulation time in milliseconds. Advances by `Settings.fps * 1000` per update step, so it reflects simulated time, not wall-clock — paused/dropped frames don't add. Use this for time-driven spawning, animations, etc. */
	public levelTime = 0;
	private _isLooping = false;
	private accumulator = 0;
	private game: Game;
	private stop = false;

	/** `true` while the rAF callback is registered. Goes `false` only after the final frame fires the `"gameloopStopped"` event. */
	public get isLooping(): boolean {
		return this._isLooping;
	}

	constructor(game: Game) {
		this.game = game;
	}

	/** Begin the rAF loop. Throws if {@link stopLoop} was called but teardown hasn't completed yet — wait for the `"gameloopStopped"` event before restarting. */
	public startLoop(): void {
		if (this._isLooping && this.stop) {
			throw new Error(
				"Gameloop teardown is pending; wait for the \"gameloopStopped\" event before restarting.",
			);
		}

		this.stop = false;
		this.looper();
	}

	/** Request that the loop stop on its next tick. Asynchronous — the loop tears down on the following frame and dispatches `"gameloopStopped"` when done. */
	public stopLoop(): void {
		this.stop = true;
	}

	private draw(context: CanvasRenderingContext2D): void {
		if (!Settings.doNotClear) {
			if (Settings.useClearRect) {
				context.clearRect(
					0,
					0,
					this.game.canman.canvas.width,
					this.game.canman.canvas.height,
				);
			} else {
				context.fillStyle = Settings.backgroundColor;
				context.fillRect(
					0,
					0,
					this.game.canman.canvas.width,
					this.game.canman.canvas.height,
				);
			}
		}

		this.game.draw(context);
	}

	private looper(): void {
		if (this._isLooping) {
			return;
		}

		this._isLooping = true;
		const context = this.game.canman.canvasContext;

		const stopLoop = rafLoop(dt => {
			if (this.stop) {
				this._isLooping = false;
				EventSystem.dispatchEvent("gameloopStopped");
				console.log("Simulation stopped.");
				stopLoop();
				return;
			}

			// Snap on big gaps (tab backgrounded, debugger break) — running
			// many updates to catch up would fast-forward the player.
			if (dt > MAX_DT_SECONDS) {
				this.accumulator = 0;
			} else {
				this.accumulator += dt;
			}

			let steps = MAX_STEPS_PER_FRAME;
			while (steps-- > 0 && this.accumulator >= Settings.fps) {
				this.game.update(Settings.fps);
				this.accumulator -= Settings.fps;
				this.levelTime += Settings.fps * 1000;
			}

			this.draw(context);
		});

		console.log("Simulation started.");
	}
}
