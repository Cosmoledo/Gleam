// Gleam exposes the engine via named imports:
//   Game           - abstract base; subclass and override init/update/draw
//   CANVAS_TYPES   - canvas role symbols (MAIN, BACKGROUND, ...)
//   Vec2 / Rect    - geometry primitives used throughout the engine
//   KEYBOARD_KEYS  - DOM KeyboardEvent.code constants (KEY_LEFT, ...)
import {
	Game,
	CANVAS_TYPES,
	Vec2,
	Rect,
	KEYBOARD_KEYS,
} from "@cosmoledo/gleam";

// Layout knobs for the brick grid. Kept module-level so the
// game class stays focused on behavior.
const BRICK_COLS = 10;
const BRICK_ROWS = 5;
const BRICK_W = 56;
const BRICK_H = 18;
const BRICK_PAD = 4;
const BRICK_TOP = 48;
const ROW_COLORS = ["#ff5d73", "#ffa45d", "#ffd95d", "#7ee787", "#58c8ff"];

// Bottom paddle. Owns a Rect (Gleam's AABB primitive) and reads
// the engine's Keyboard each frame to slide horizontally.
class Paddle {
	// W stays public because the game class uses it to center the
	// ball and compute the catch angle. H/SPEED are paddle-only.
	static W = 96;
	static #H = 12;
	static #SPEED = 420; // pixels per second

	rect;

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	constructor(x, y) {
		this.rect = new Rect(x, y, Paddle.W, Paddle.#H);
	}

	/** @param {CanvasRenderingContext2D} ctx */
	draw(ctx) {
		ctx.fillStyle = "#e8e8ea";
		ctx.fillRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
	}

	// dt is delta-time in SECONDS (Settings.fps). Multiplying speed
	// by dt gives frame-rate-independent movement.
	/**
	 * @param {number} dt
	 * @param {import("@cosmoledo/gleam").Keyboard} keyboard
	 * @param {number} maxX
	 */
	update(dt, keyboard, maxX) {
		// keyboard.isActive(code) takes a KeyboardEvent.code string.
		// KEYBOARD_KEYS just spares you the magic strings.
		const left =
			keyboard.isActive(KEYBOARD_KEYS.KEY_LEFT) ||
			keyboard.isActive(KEYBOARD_KEYS.KEY_A);
		const right =
			keyboard.isActive(KEYBOARD_KEYS.KEY_RIGHT) ||
			keyboard.isActive(KEYBOARD_KEYS.KEY_D);

		if (left) {
			this.rect.x -= Paddle.#SPEED * dt;
		}

		if (right) {
			this.rect.x += Paddle.#SPEED * dt;
		}

		// Clamp to the play area.
		this.rect.x = Math.max(0, Math.min(maxX - Paddle.W, this.rect.x));
	}
}

// The ball. Stores position and velocity as Vec2 — Gleam's 2D
// vector class with chainable mutators (add, set, normalize, ...).
// For collisions we treat the ball as its bounding Rect so we
// can lean on Rect.collide / Rect.collideSide from the lib.
class Ball {
	static R = 7;
	static SPEED = 320; // pixels per second

	pos = new Vec2();
	vel = new Vec2();

	// Square AABB around the ball, returned fresh on every access
	// so it always reflects the current pos.
	get rect() {
		return new Rect(
			this.pos.x - Ball.R,
			this.pos.y - Ball.R,
			Ball.R * 2,
			Ball.R * 2,
		);
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	constructor(x, y) {
		this.pos.set(x, y);
	}

	/** @param {CanvasRenderingContext2D} ctx */
	draw(ctx) {
		ctx.fillStyle = "#e8e8ea";
		ctx.beginPath();
		ctx.arc(this.pos.x, this.pos.y, Ball.R, 0, Math.PI * 2);
		ctx.fill();
	}

	// Integrate motion, then bounce off the three walls that should
	// reflect (left, right, top). The bottom is intentionally not
	// handled here — falling off the floor is a game-over signal
	// for BrickBreaker, not ball physics.
	/**
	 * @param {number} dt
	 * @param {number} width
	 */
	update(dt, width) {
		this.pos.add(this.vel.x * dt, this.vel.y * dt);

		if (this.pos.x < Ball.R) {
			this.pos.x = Ball.R;
			this.vel.x *= -1;
		}
		if (this.pos.x > width - Ball.R) {
			this.pos.x = width - Ball.R;
			this.vel.x *= -1;
		}
		if (this.pos.y < Ball.R) {
			this.pos.y = Ball.R;
			this.vel.y *= -1;
		}
	}

	// Rect.collideSide(other) reports which side of `this` rect was
	// hit from `other`'s direction — "top"/"bottom" -> vertical
	// bounce, "left"/"right" -> horizontal bounce.
	/** @param {Rect} rect */
	bounceOff(rect) {
		const side = rect.collideSide(this.rect);

		if (side === "left" || side === "right") {
			this.vel.x *= -1;
		} else {
			this.vel.y *= -1;
		}
	}

	/**
	 * @param {number} vx
	 * @param {number} vy
	 */
	launch(vx, vy) {
		this.vel.set(vx, vy);
	}
}

// A single brick. No update() — bricks are static until destroyed.
// Dead bricks are spliced out of the array.
class Brick {
	rect;
	#color;

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} w
	 * @param {number} h
	 * @param {string} color
	 */
	constructor(x, y, w, h, color) {
		this.rect = new Rect(x, y, w, h);
		this.#color = color;
	}

	/** @param {CanvasRenderingContext2D} ctx */
	draw(ctx) {
		ctx.fillStyle = this.#color;
		ctx.fillRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
	}
}

// The game itself. Subclass Game and implement init/update/draw.
// Gleam injects `this.canman` (CanvasManager), `this.keyboard`,
// `this.pointer`, and `this.gameloop` into every instance.
class BrickBreaker extends Game {
	/** @type {Paddle} */
	#paddle;
	/** @type {Ball} */
	#ball;
	/** @type {Brick[]} */
	#bricks = [];
	#launched = false;
	#status = "playing"; // "playing" | "won" | "lost"

	constructor() {
		// super() takes SettingsOverrides. Defaults live in
		// Gleam's Settings class.
		//   fps              - fixed update step in seconds (1/60 = 60 Hz)
		//   backgroundColor  - used when useClearRect is false (here we
		//                      keep the default clearRect path; the color
		//                      shows through any transparent draw)
		//   enableResize     - true would stretch the canvas to the
		//                      window. We want a fixed-size demo.
		super({
			fps: 1 / 60,
			backgroundColor: "#0e0e10",
			enableResize: false,
		});

		// Register the <canvas id="game"> as the main render target.
		this.canman.setupCanvas(CANVAS_TYPES.MAIN, "#game");

		// preInit() finishes engine wiring, then calls our init()
		// and starts the loop. Always call it from the constructor.
		this.preInit();
	}

	// Called once by preInit() after the canvas is ready and the
	// loop is wired up. Use it for one-time setup (here: build
	// the world). init can be async — Gleam awaits it before
	// starting the loop, which is handy for asset loading.
	async init() {
		this.#reset();
	}

	// Called every frame after the gameloop clears the canvas.
	/** @param {CanvasRenderingContext2D} ctx */
	draw(ctx) {
		this.#bricks.forEach(b => b.draw(ctx));
		this.#paddle.draw(ctx);
		this.#ball.draw(ctx);

		if (this.#status !== "playing") {
			const { width, height } = this.canman;

			// Dim overlay over the play area.
			ctx.fillStyle = "rgba(14, 14, 16, 0.8)";
			ctx.fillRect(0, 0, width, height);
			ctx.fillStyle = "#e8e8ea";
			ctx.textAlign = "center";
			ctx.font = "32px system-ui, sans-serif";
			ctx.fillText(
				this.#status === "won" ? "You win!" : "Game over",
				width / 2,
				height / 2 - 8,
			);
			ctx.font = "14px system-ui, sans-serif";
			ctx.fillStyle = "#8a8a93";
			ctx.fillText("press R to restart", width / 2, height / 2 + 20);
		}
	}

	// Called every fixed step with dt = Settings.fps (seconds).
	// The gameloop will call update multiple times per frame if
	// rendering lags, so keep it deterministic.
	/** @param {number} dt */
	update(dt) {
		// R -> restart from any state
		if (this.keyboard.isActive(KEYBOARD_KEYS.KEY_R)) {
			// stop() consumes the held state so we don't
			// re-trigger on subsequent ticks while R is still down.
			this.keyboard.stop(KEYBOARD_KEYS.KEY_R);
			this.#reset();
			return;
		}

		// won/lost -> freeze the simulation, wait for R
		if (this.#status !== "playing") {
			return;
		}

		const { width, height } = this.canman;
		this.#paddle.update(dt, this.keyboard, width);

		// pre-launch -> stick the ball to the paddle; space launches
		if (!this.#launched) {
			this.#ball.pos.set(
				this.#paddle.rect.x + Paddle.W / 2,
				this.#paddle.rect.y - Ball.R - 1,
			);
			if (this.keyboard.isActive(KEYBOARD_KEYS.KEY_SPACE)) {
				this.#launched = true;
				this.#ball.launch(Ball.SPEED * 0.5, -Ball.SPEED);
			}
			return;
		}

		// playing -> integrate ball, handle collisions
		this.#ball.update(dt, width);

		// Ball off the bottom -> game over.
		if (this.#ball.pos.y > height + Ball.R) {
			this.#status = "lost";
			return;
		}

		// Paddle catch. The vel.y > 0 guard prevents re-triggering
		// while the ball is already moving away from the paddle
		// (can briefly happen when the paddle slides into the ball).
		// The `t` term modulates angle by where on the paddle the
		// ball lands: -0.5 (left edge) ... +0.5 (right edge).
		// Multiplying by 1.8 lets edges launch beyond 45°.
		if (
			this.#paddle.rect.collide(this.#ball.rect) &&
			this.#ball.vel.y > 0
		) {
			this.#ball.pos.y = this.#paddle.rect.y - Ball.R;
			const t = (this.#ball.pos.x - this.#paddle.rect.x) / Paddle.W - 0.5;
			this.#ball.launch(Ball.SPEED * t * 1.8, -Ball.SPEED);
		}

		// One brick per frame (good enough at this ball speed).
		const hitIndex = this.#bricks.findIndex(brick =>
			brick.rect.collide(this.#ball.rect),
		);
		if (hitIndex >= 0) {
			this.#ball.bounceOff(this.#bricks[hitIndex].rect);
			this.#bricks.splice(hitIndex, 1);
		}

		if (this.#bricks.length === 0) {
			this.#status = "won";
		}
	}

	// Builds a fresh world. Called from init() on first run and
	// from update() whenever R is pressed.
	#reset() {
		const { width, height } = this.canman;
		this.#paddle = new Paddle((width - Paddle.W) / 2, height - 36);
		this.#ball = new Ball(width / 2, this.#paddle.rect.y - Ball.R - 1);
		this.#launched = false;
		this.#status = "playing";
		this.#bricks = [];

		// Center the grid horizontally.
		const gridW = BRICK_COLS * (BRICK_W + BRICK_PAD) - BRICK_PAD;
		const offsetX = (width - gridW) / 2;
		for (let row = 0; row < BRICK_ROWS; row++) {
			for (let col = 0; col < BRICK_COLS; col++) {
				this.#bricks.push(
					new Brick(
						offsetX + col * (BRICK_W + BRICK_PAD),
						BRICK_TOP + row * (BRICK_H + BRICK_PAD),
						BRICK_W,
						BRICK_H,
						ROW_COLORS[row],
					),
				);
			}
		}
	}
}

/**
 * @param {(desc: string) => void} setDesc
 * @param {HTMLCanvasElement} canvas
 */
export function init(setDesc, canvas) {
	setDesc("← / → to move &middot; space to launch &middot; R to restart");
	canvas.height = 480;

	// Instantiating the Game starts everything (constructor calls
	// preInit, which awaits init, then kicks off the loop).
	new BrickBreaker();
}
