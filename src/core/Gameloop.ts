import EventSystem from "./EventSystem";
import Settings from "./Settings";
import type Game from "./Game";
import { rafLoop } from "@/utilities/Functions";

const MAX_DT_SECONDS = 0.25;
const MAX_STEPS_PER_FRAME = 5;

export default class Gameloop {
	public levelTime = 0;
	private _isLooping = false;
	private accumulator = 0;
	private game: Game;
	private stop = false;

	public get isLooping(): boolean {
		return this._isLooping;
	}

	constructor(game: Game) {
		this.game = game;
	}

	public startLoop(): void {
		if (this._isLooping && this.stop) {
			throw new Error(
				"Gameloop teardown is pending; wait for the \"gameloopStopped\" event before restarting.",
			);
		}

		this.stop = false;
		this.looper();
	}

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
