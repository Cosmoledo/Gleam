// Particle demo — the bare `Particle` class, nothing subclassed:
//
//   Particle - a filled circle with a random outward velocity (random
//              angle, 50-150 px/s per axis) and a random 0.5-1.5s
//              lifetime, both seeded in its constructor. update(dt)
//              advances it; `alive` flips to false when its time is up.
//
// Hold the mouse to spray sparks at the cursor. Each spawn is one
// Particle; the burst shape is just many of them flying out at once.
// We keep a flat array, tick every particle, then drop the dead ones by
// removing on `alive`. Rendering is Particle.draw(), which internally
// calls the ctx.drawCircle prototype helper (installed for free because
// we subclass Game).
import {
	Game,
	CANVAS_TYPES,
	Particle,
	Vec2,
	Color,
	POINTER_KEYS,
	randomBetweenInt,
} from "@cosmoledo/gleam";

// New Particles spawned per simulation tick while the button is held.
const EMIT_PER_TICK = 4;

class ParticleDemo extends Game {
	/** Every live spark. Dead ones are removed each update. @type {Particle[]} */
	#particles = [];

	constructor() {
		// enableResize:false keeps the canvas at its declared 640x360.
		super({
			fps: 1 / 60, // fixed step in SECONDS — 60 Hz
			backgroundColor: "#0e0e10",
			enableResize: false,
		});

		this.canman.setupCanvas(CANVAS_TYPES.MAIN, "#game");
		this.preInit();
	}

	async init() {
		// A welcome burst at center so the canvas isn't empty on load.
		this.#burst(
			new Vec2(this.canman.width / 2, this.canman.height / 2),
			60,
		);
	}

	/** @param {number} dt seconds since the last tick (= Settings.fps) */
	update(dt) {
		// Spray while the left button is held, following the cursor.
		if (this.pointer.isActive(POINTER_KEYS.LEFT)) {
			this.#burst(this.pointer.posScaled, EMIT_PER_TICK);
		}

		// Advance every particle and remove the ones whose time is up.
		for (let i = this.#particles.length - 1; i >= 0; i--) {
			this.#particles[i].update(dt);

			if (!this.#particles[i].alive) {
				this.#particles.splice(i, 1);
			}
		}
	}

	/** @param {CanvasRenderingContext2D} ctx */
	draw(ctx) {
		// Particle.draw sets its own fillStyle and calls ctx.drawCircle.
		this.#particles.forEach(particle => particle.draw(ctx));

		// Crosshair at the cursor — drawCircle again, this time by us.
		ctx.strokeStyle = "#e8e8ea";
		ctx.drawCircle(this.pointer.posScaled, 12, "stroke");

		// HUD.
		ctx.fillStyle = "#8a8a93";
		ctx.font = "13px system-ui, sans-serif";
		ctx.writeText(
			"hold the mouse to spray sparks",
			this.canman.width / 2,
			26,
		);
		ctx.writeText(
			`${this.#particles.length} alive`,
			this.canman.width / 2,
			this.canman.height - 20,
		);
	}

	/**
	 * Spawn `count` particles at `pos`, each a vivid random color and a
	 * small random size. Particle clones the position, so passing the
	 * live pointer vector doesn't alias it.
	 * @param {Vec2} pos
	 * @param {number} count
	 */
	#burst(pos, count) {
		for (let i = 0; i < count; i++) {
			// Random hue, high saturation, lightness in [50, 100] so every
			// spark stays vivid on the dark background.
			const color = Color.fromHSL(
				randomBetweenInt(0, 360),
				80,
				randomBetweenInt(50, 100),
			).toHex();

			this.#particles.push(
				new Particle(pos, color, randomBetweenInt(2, 5)),
			);
		}
	}
}

/**
 * @param {(desc: string) => void} setDesc
 */
export function init(setDesc) {
	setDesc("bare Particle &middot; hold the mouse to spray radial sparks");

	new ParticleDemo();
}
