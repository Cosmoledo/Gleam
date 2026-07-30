// Minimal Gleam demo:
//   Game           - abstract base; subclass and override init/update/draw
//   CANVAS_TYPES   - canvas role symbols (MAIN, BACKGROUND, ...)
//   Vec2           - 2D vector with chainable mutators (add, set, ...)
//   randomHslHex   - random vivid hex color (random hue, controlled S/L)
import { Game, CANVAS_TYPES, Vec2, randomHslHex } from "@cosmoledo/gleam";

// A moving ball that bounces inside an axis-aligned box.
class Ball {
	#pos = new Vec2();
	#vel = new Vec2(); // pixels per second
	#radius;
	#color;

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} vx
	 * @param {number} vy
	 * @param {number} r
	 * @param {string} color
	 */
	constructor(x, y, vx, vy, r, color) {
		this.#pos.set(x, y);
		this.#vel.set(vx, vy);
		this.#radius = r;
		this.#color = color;
	}

	/** @param {CanvasRenderingContext2D} ctx */
	draw(ctx) {
		ctx.fillStyle = this.#color;
		ctx.beginPath();
		ctx.arc(this.#pos.x, this.#pos.y, this.#radius, 0, Math.PI * 2);
		ctx.fill();
	}

	// Integrate motion and bounce off the box walls.
	/**
	 * @param {number} dt
	 * @param {number} width
	 * @param {number} height
	 */
	update(dt, width, height) {
		this.#pos.add(this.#vel.x * dt, this.#vel.y * dt);

		if (this.#pos.x < this.#radius || this.#pos.x > width - this.#radius) {
			this.#vel.x *= -1;
		}

		if (this.#pos.y < this.#radius || this.#pos.y > height - this.#radius) {
			this.#vel.y *= -1;
		}
	}
}

// Subclass Game and the engine gives us this.canman (CanvasManager),
// this.keyboard, this.pointer, and this.gameloop for free.
class BouncingBallDemo extends Game {
	static #MAX_BALLS = 100;
	static #SPAWN_INTERVAL = 200; // ms between spawns

	/** @type {Ball[]} */
	#balls = [];
	#nextSpawnAt = 0; // levelTime (ms) at which to spawn the next ball

	constructor() {
		// super() takes SettingsOverrides. enableResize:false keeps
		// the canvas at its declared 640x360; otherwise the lib
		// would stretch it to the window.
		super({
			fps: 1 / 60, // fixed step in SECONDS — 60 Hz
			backgroundColor: "#0e0e10",
			enableResize: false,
		});

		// Register the <canvas id="game"> as the main render target.
		this.canman.setupCanvas(CANVAS_TYPES.MAIN, "#game");

		// Finish engine wiring, await init(), then start the loop.
		// Always call from the constructor.
		this.preInit();
	}

	// First ball spawns one interval after the loop starts.
	async init() {
		this.#nextSpawnAt = BouncingBallDemo.#SPAWN_INTERVAL;
	}

	// Fixed step. dt = Settings.fps (seconds). Multiplying speed
	// by dt gives frame-rate-independent motion.
	/** @param {number} dt */
	update(dt) {
		// gameloop.levelTime is total elapsed ms since the loop
		// started. Use it for time-driven events.
		if (
			this.gameloop.levelTime >= this.#nextSpawnAt &&
			this.#balls.length < BouncingBallDemo.#MAX_BALLS
		) {
			this.#spawn();
			this.#nextSpawnAt += BouncingBallDemo.#SPAWN_INTERVAL;
		}

		this.#balls.forEach(ball =>
			ball.update(dt, this.canman.width, this.canman.height),
		);
	}

	// Called every frame after the gameloop clears the canvas.
	/** @param {CanvasRenderingContext2D} ctx */
	draw(ctx) {
		this.#balls.forEach(ball => ball.draw(ctx));
	}

	#spawn() {
		const w = this.canman.width;
		const h = this.canman.height;
		const r = 8 + Math.random() * 16;
		const x = r + Math.random() * (w - 2 * r);
		const y = r + Math.random() * (h - 2 * r);
		const speed = () =>
			(100 + Math.random() * 200) * (Math.random() < 0.5 ? -1 : 1);

		this.#balls.push(new Ball(x, y, speed(), speed(), r, randomHslHex()));
	}
}

/**
 * @param {(desc: string) => void} setDesc
 */
export function init(setDesc) {
	setDesc("");

	// Constructing the Game starts everything (constructor -> preInit
	// -> init -> loop).
	new BouncingBallDemo();
}
