import Settings from "./Settings";
import type Game from "./Game";
import type Sound from "@/audio/Sound";
import { EVENT_NAMES } from "./EventSystem";
import { rafLoop } from "@/utilities/Functions";

export default class Gameloop {
	public levelTime = 0;
	private accumulator = 0;
	private loopHasStarted = false;
	private stop = false;
	private game: Game;
	private draw: (context: CanvasRenderingContext2D) => void;
	private update: (dt: number) => void;

	constructor(
		game: Game,
		update: (dt: number) => void,
		draw: (context: CanvasRenderingContext2D) => void,
	) {
		this.game = game;
		this.update = update;
		this.draw = draw;
	}

	public startLoop(): void {
		this.stop = false;
		this.looper();
	}

	public stopLoop(): void {
		this.stop = true;

		if ("sound" in this) {
			(this.sound as Sound).stop();
		}
	}

	public isStopped(): boolean {
		return this.stop;
	}

	private looper(): void {
		if (this.loopHasStarted) {
			return;
		}

		this.loopHasStarted = true;
		const context = this.game.canman.canvasContext;

		const stopLoop = rafLoop(dt => {
			if (this.stop) {
				this.game.events.dispatchEvent(EVENT_NAMES.GAMELOOP_STOPPED);
				this.game.keyboard.reset();
				this.loopHasStarted = false;
				console.log("Simulation stopped.");
				stopLoop();
				return;
			}

			this.accumulator += dt;
			this.levelTime += dt * 1000;

			while (this.accumulator > Settings.fps) {
				this.update(Settings.fps);
				this.accumulator -= Settings.fps;
			}

			this.draw(context);
		});

		console.log("Simulation started.");
	}
}
