// Ambient particles — a fixed pool recycled with Particle.resetLifetime():
//
// A hundred particles drift forever. Each glides in a straight line to a
// nearby random point, its velocity timed to arrive just as its lifetime
// runs out (except the first hop, which starts mid-life so it resets before
// arriving). Each particle's maxLifeTime is a distinct float, so the pool
// stays out of sync on its own — the mid-life start just reinforces it. When
// `alive` flips false we DON'T discard it — we
// call resetLifetime() to recycle the clock in place (its whole purpose:
// a phase-stable pool with zero allocation) and pick a fresh target. The
// pool never grows or shrinks; the result is a calm, endless float.
//
// This needs a subclass: the base Particle seeds a random velocity and
// can't be re-aimed from outside (vel/pos are protected).
import {
	Game,
	CANVAS_TYPES,
	Particle,
	Vec2,
	Color,
	clamp,
	randomBetweenInt,
	randomBetweenFloat,
} from "@cosmoledo/gleam";

const COUNT = 100;
// Keep spawns and drift targets this far inside the canvas edges.
const MARGIN = 15;

/** @typedef {{ w: number, h: number }} Bounds */

class FloatParticle extends Particle {
	/** Canvas extent used to pick targets. @type {Bounds} */
	#bounds;

	/** @param {Bounds} bounds */
	constructor(bounds) {
		super(
			new Vec2(
				randomBetweenInt(MARGIN, bounds.w - MARGIN),
				randomBetweenInt(MARGIN, bounds.h - MARGIN),
			),
			// Soft, low-saturation pastel for a calm ambient look.
			Color.fromHSL(randomBetweenInt(0, 360), 50, 70).toHex(),
			randomBetweenInt(4, 8),
		);

		this.maxLifeTime = randomBetweenFloat(2, 5);
		// Start mid-life so particles don't all retarget on the same tick.
		// Side-effect: the first hop resets before reaching its target.
		this.lifetime = randomBetweenFloat(0.1, this.maxLifeTime);

		this.#bounds = bounds;
		this.#retarget();
	}

	/** @param {number} dt seconds since the last tick */
	update(dt) {
		super.update(dt); // glide along vel, advance lifetime

		// Lifetime up → recycle the clock in place and drift somewhere new.
		if (!this.alive) {
			this.resetLifetime();
			this.#retarget();
		}
	}

	/**
	 * Drift to a nearby random point, picking the constant velocity
	 * (offset / maxLifeTime) that arrives just as the lifetime ends — except
	 * the first hop, which starts mid-life and so resets before arriving. The
	 * destination is clamped to a margin inside the canvas so drifters never
	 * wander off-screen. maxLifeTime is fixed per particle (set once in the
	 * constructor), so each keeps its own steady pace across resets.
	 */
	#retarget() {
		const targetX = clamp(
			this.pos.x + randomBetweenInt(-50, 50),
			MARGIN,
			this.#bounds.w - MARGIN,
		);
		const targetY = clamp(
			this.pos.y + randomBetweenInt(-50, 50),
			MARGIN,
			this.#bounds.h - MARGIN,
		);

		this.vel.x = (targetX - this.pos.x) / this.maxLifeTime;
		this.vel.y = (targetY - this.pos.y) / this.maxLifeTime;
	}
}

class AmbientParticeDemo extends Game {
	/** Fixed pool of drifters — never grows, never shrinks. @type {FloatParticle[]} */
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
		/** @type {Bounds} */
		const bounds = { w: this.canman.width, h: this.canman.height };
		for (let i = 0; i < COUNT; i++) {
			this.#particles.push(new FloatParticle(bounds));
		}
	}

	/** @param {number} dt seconds since the last tick */
	update(dt) {
		// Each particle re-targets itself on timeout — no spawning or removal.
		this.#particles.forEach(particle => particle.update(dt));
	}

	/** @param {CanvasRenderingContext2D} ctx */
	draw(ctx) {
		// Slightly translucent so overlaps read as soft blobs.
		ctx.globalAlpha = 0.75;
		this.#particles.forEach(particle => particle.draw(ctx));
		ctx.globalAlpha = 1;

		// HUD.
		ctx.fillStyle = "#8a8a93";
		ctx.font = "13px system-ui, sans-serif";
		ctx.writeText(
			"ambient drift · a fixed pool recycled with resetLifetime",
			this.canman.width / 2,
			26,
		);
	}
}

/**
 * @param {(desc: string) => void} setDesc
 */
export function init(setDesc) {
	setDesc(
		"ambient Particle drift &middot; a fixed pool recycled with resetLifetime",
	);

	new AmbientParticeDemo();
}
