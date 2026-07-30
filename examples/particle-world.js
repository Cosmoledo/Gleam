// Particle world — extending `Particle` so a shared world can steer it:
//
// The bare Particle only flies in a straight line (its update just does
// pos += vel*dt); its velocity is protected, so the only way to apply a
// force is to subclass and override update().
//
//   WorldParticle - overrides update() to fold wind (horizontal) and
//                   gravity (vertical) into velocity each tick, then
//                   defers to super.update() for the position/lifetime
//                   integration. maxLifeTime is taken from the world's
//                   lifetime slider instead of the base's random value.
//
// The three sliders below the canvas mutate one shared `world` object
// live, so dragging them re-steers particles already in flight.
//
// Spawning is the same allocate-and-drop pattern as particles.js: push a
// new WorldParticle each tick, then splice out the ones whose `alive`
// flipped false.
import {
	Game,
	CANVAS_TYPES,
	Particle,
	Vec2,
	randomHslHex,
	randomBetweenInt,
} from "@cosmoledo/gleam";

/**
 * Shared, live simulation parameters. The sliders mutate this in place;
 * every WorldParticle holds a reference and reads it each tick.
 * @typedef {object} World
 * @property {number} wind horizontal acceleration, px/s² (+ blows right)
 * @property {number} gravity vertical acceleration, px/s² (+ pulls down)
 * @property {number} lifetime lifetime cap applied at spawn, seconds
 */

// New sparks emitted per simulation tick.
const EMIT_PER_TICK = 4;

class WorldParticle extends Particle {
	/** Live world params, shared with every other particle. @type {World} */
	#world;

	/**
	 * @param {Vec2} pos
	 * @param {World} world
	 */
	constructor(pos, world) {
		super(pos, randomHslHex(), randomBetweenInt(2, 5));
		this.#world = world;
		// Override the base's random 0.5-1.5s cap with the world's setting.
		this.maxLifeTime = world.lifetime;
	}

	/** @param {number} dt seconds since the last tick */
	update(dt) {
		// Integrate the world forces into velocity (a = px/s²), then let the
		// base advance position, lifetime, and the bounding rect.
		this.vel.x += this.#world.wind * dt;
		this.vel.y += this.#world.gravity * dt;
		super.update(dt);
	}
}

class WorldParticleDemo extends Game {
	/** @type {World} */
	#world;
	/** Every live particle; dead ones are spliced out each update. @type {WorldParticle[]} */
	#particles = [];
	/** Stationary auto-spawn point; forces do the moving. @type {Vec2} */
	#emitter = new Vec2();

	/** @param {World} world */
	constructor(world) {
		super({
			fps: 1 / 60, // fixed step in SECONDS — 60 Hz
			backgroundColor: "#0e0e10",
			enableResize: false,
		});

		this.#world = world;
		this.canman.setupCanvas(CANVAS_TYPES.MAIN, "#game");
		this.preInit();
	}

	async init() {
		// Emit from the center; the wind/gravity sliders do the steering.
		this.#emitter.set(this.canman.width / 2, this.canman.height / 2);
	}

	/** @param {number} dt seconds since the last tick */
	update(dt) {
		// Auto-spray from the fixed emitter every tick — no input needed.
		for (let i = 0; i < EMIT_PER_TICK; i++) {
			this.#particles.push(new WorldParticle(this.#emitter, this.#world));
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

		// Ring marking the emitter.
		ctx.strokeStyle = "#e8e8ea";
		ctx.drawCircle(this.#emitter, 8, "stroke");

		// HUD.
		ctx.fillStyle = "#8a8a93";
		ctx.font = "13px system-ui, sans-serif";
		ctx.writeText(
			"auto-spawning · tweak the sliders below",
			this.canman.width / 2,
			26,
		);
		ctx.writeText(
			`${this.#particles.length} alive`,
			this.canman.width / 2,
			this.canman.height - 20,
		);
	}
}

/**
 * @param {(desc: string) => void} setDesc
 * @param {HTMLCanvasElement} canvas
 */
export function init(setDesc, canvas) {
	setDesc("extend Particle &middot; wind / gravity / lifetime sliders");

	/** @type {World} */
	const world = { wind: 300, gravity: 200, lifetime: 2 };

	// Slider specs: [world key, label, min, max, step, unit].
	/** @type {[keyof World, string, number, number, number, string][]} */
	const sliders = [
		["wind", "Wind", -1200, 1200, 10, "px/s²"],
		["gravity", "Gravity", -1200, 1200, 10, "px/s²"],
		["lifetime", "Lifetime", 0.3, 4, 0.1, "s"],
	];

	const controls = document.createElement("div");
	controls.className = "controls";
	controls.innerHTML = sliders
		.map(
			([key, label, min, max, step, unit]) =>
				`<label>${label}
					<input id="pw-${key}" type="range"
						min="${min}" max="${max}" step="${step}" value="${world[key]}" />
					<span id="pw-${key}-val">${world[key]} ${unit}</span>
				</label>`,
		)
		.join("");
	canvas.after(controls);

	sliders.forEach(([key, , , , , unit]) => {
		const input = /** @type {HTMLInputElement | null} */ (
			document.getElementById(`pw-${key}`)
		);
		const readout = document.getElementById(`pw-${key}-val`);

		input?.addEventListener("input", () => {
			const value = Number(input.value);
			world[key] = value;
			if (readout) {
				readout.textContent = `${value} ${unit}`;
			}
		});
	});

	new WorldParticleDemo(world);
}
