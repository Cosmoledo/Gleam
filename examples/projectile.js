// Projectile — homing missiles built on `Projectile<T>`:
//
// The bare Projectile flies straight: update() advances pos along vel*speed
// and bakes the sprite to a canvas rotated to match vel. Re-aiming is a
// two-step move — mutate vel, then call rebuildRotation() to re-bake the
// sprite and rect to the new heading. That's exactly what homing needs, so
// this demo does it every frame.
//
//   HomingMissile - extends Projectile<Payload>. seek() turns vel toward the
//                   locked target by at most `turn` rad/s (a capped turn rate,
//                   so missiles arc instead of snapping), then calls
//                   rebuildRotation() so the drawn sprite follows. Its typed
//                   payload { damage, speed } — no cast — sets the missile's
//                   speed at spawn and supplies the damage read on impact.
//
// A turret sits at the bottom-center. Click or hold the left button to fire a
// missile at the pointer; it then locks the nearest drifting target and homes.
// On contact payload.damage comes off the target's HP and remove() kills the
// missile (die on impact, not fuel); missiles that miss — or fly off-screen —
// expire via maxLifetime and the wall check in update().
import {
	Game,
	CANVAS_TYPES,
	Projectile,
	Vec2,
	Rect,
	POINTER_KEYS,
	randomHslHex,
	randomBetweenInt,
	randomBetweenFloat,
	clamp,
} from "@cosmoledo/gleam";

// Fire at most this often while the button is held (seconds).
const FIRE_COOLDOWN = 0.18;
// Keep roughly this many targets drifting on screen.
const TARGET_COUNT = 6;

/**
 * Typed metadata attached to each missile via the Projectile generic, so
 * `missile.payload.damage` reads back without a cast.
 * @typedef {object} Payload
 * @property {number} damage HP removed from a target on impact
 * @property {number} speed forward speed applied to the projectile, px/s
 */

// A drifting target: a Rect that bounces off the walls, with hit points.
class Target {
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} hp
	 */
	constructor(x, y, hp) {
		this.rect = new Rect(x, y, 26, 26);
		this.vel = new Vec2(
			randomBetweenFloat(-60, 60),
			randomBetweenFloat(20, 70),
		);
		this.hp = hp;
		this.color = randomHslHex();
	}

	/**
	 * @param {number} dt seconds
	 * @param {number} width canvas width
	 * @param {number} height canvas height
	 */
	update(dt, width, height) {
		this.rect.x += this.vel.x * dt;
		this.rect.y += this.vel.y * dt;

		// Bounce off the walls; keep out of the turret's bottom strip.
		if (this.rect.x < 0 || this.rect.x + this.rect.w > width) {
			this.vel.x *= -1;
			this.rect.x = clamp(this.rect.x, 0, width - this.rect.w);
		}
		if (this.rect.y < 0 || this.rect.y + this.rect.h > height - 60) {
			this.vel.y *= -1;
			this.rect.y = clamp(this.rect.y, 0, height - 60 - this.rect.h);
		}
	}

	/** @param {CanvasRenderingContext2D} ctx */
	draw(ctx) {
		ctx.fillStyle = this.color;
		ctx.drawRect(this.rect, "fill");
		ctx.fillStyle = "#0e0e10";
		ctx.writeText(
			this.hp + "",
			this.rect.sides.centerPos.x,
			this.rect.sides.centerPos.y + 5,
		);
	}

	/**
	 * Center of a target.
	 * @returns {Vec2}
	 */
	center() {
		return this.rect.sides.centerPos;
	}
}

/**
 * A missile that steers toward a locked target instead of flying straight.
 * @extends {Projectile<Payload>}
 */
class HomingMissile extends Projectile {
	/**
	 * @param {Vec2} pos launch position (sprite top-left)
	 * @param {HTMLCanvasElement} image un-rotated sprite, pointing +x
	 * @param {Vec2} vel initial unit heading toward the pointer
	 * @param {number} homingTurn max turn rate, radians/second
	 * @param {Payload} payload typed metadata
	 */
	constructor(pos, image, vel, homingTurn, payload) {
		super(pos, image, vel);
		this.payload = payload;
		this.speed = payload.speed; // per-missile, read from the typed payload
		this.maxLifetime = 3; // seconds of fuel before it fizzles
		this.homingTurn = homingTurn;
	}

	/**
	 * Turn `vel` toward `target` by at most `homingTurn * dt` radians, then
	 * re-bake the sprite/rect to the new heading. Re-aiming vel WITHOUT this
	 * rebuildRotation() call would move the missile on the new course but leave
	 * the sprite pointing the old way.
	 * @param {Vec2} target center to steer toward
	 * @param {number} dt seconds
	 */
	seek(target, dt) {
		const current = this.vel.angle();
		const desired = this.center().angle(target);

		// Shortest signed turn, wrapped to [-PI, PI], then capped by the rate.
		let delta = desired - current;
		delta = Math.atan2(Math.sin(delta), Math.cos(delta));
		const maxStep = this.homingTurn * dt;
		delta = clamp(delta, -maxStep, maxStep);

		this.vel.set(Vec2.fromAngle(current + delta));
		this.rebuildRotation();
	}

	/**
	 * Sprite center in world space (pos is top-left).
	 * @returns {Vec2}
	 */
	center() {
		return this.rect.sides.centerPos;
	}
}

class ProjectileDemo extends Game {
	/** @type {number} */
	#homingTurn = Math.PI / 2;
	/** Live missiles; dead ones (impact or fuel) are filtered each update. @type {HomingMissile[]} */
	#missiles = [];
	/** @type {Target[]} */
	#targets = [];
	/** Fixed launch point at the bottom-center. @type {Vec2} */
	#turret = new Vec2();
	/** Seconds until the next shot may fire while held. */
	#cooldown = 0;
	#kills = 0;

	constructor() {
		super({
			fps: 1 / 60, // fixed step in SECONDS — 60 Hz
			backgroundColor: "#0e0e10",
			enableResize: false,
		});

		this.canman.setupCanvas(CANVAS_TYPES.MAIN, "#game");
		this.preInit();
	}

	async init() {
		this.#turret.set(this.canman.width / 2, this.canman.height - 40);
	}

	/** @param {number} dt seconds since the last tick */
	update(dt) {
		const { width, height } = this.canman;

		// Top up the target field.
		while (this.#targets.length < TARGET_COUNT) {
			this.#targets.push(
				new Target(
					randomBetweenInt(20, width - 46),
					randomBetweenInt(20, height / 2),
					randomBetweenInt(3, 5),
				),
			);
		}

		// Fire toward the pointer while the left button is held.
		this.#cooldown -= dt;
		if (this.pointer.isActive(POINTER_KEYS.LEFT) && this.#cooldown <= 0) {
			this.#fire();
			this.#cooldown = FIRE_COOLDOWN;
		}

		// Home, integrate, and resolve impacts.
		for (let i = this.#missiles.length - 1; i >= 0; i--) {
			const missile = this.#missiles[i];

			const target = this.#nearestTarget(missile.center());
			if (target) {
				missile.seek(target.center(), dt);
			}
			missile.update(dt);

			// Kill missiles that miss and leave the arena.
			if (
				missile.rect.x < 0 ||
				missile.rect.sides.right > width ||
				missile.rect.y < 0 ||
				missile.rect.sides.bottom > height
			) {
				missile.remove();
			}

			const hit = this.#targets.find(
				target => target.hp > 0 && missile.rect.collide(target.rect),
			);
			if (hit) {
				hit.hp -= missile.payload.damage;

				missile.remove();
			}

			if (!missile.alive) {
				this.#missiles.splice(i, 1);
			}
		}

		for (let i = this.#targets.length - 1; i >= 0; i--) {
			if (this.#targets[i].hp <= 0) {
				this.#targets.splice(i, 1);
				this.#kills++;
			} else {
				this.#targets[i].update(dt, width, height);
			}
		}
	}

	/** @param {CanvasRenderingContext2D} ctx */
	draw(ctx) {
		ctx.font = "13px system-ui, sans-serif";

		// Aim line to the pointer.
		ctx.strokeStyle = "#ffcf4d";
		ctx.strokeLine(
			this.#turret.x,
			this.#turret.y,
			this.pointer.posScaled.x,
			this.pointer.posScaled.y,
		);

		this.#targets.forEach(target => target.draw(ctx));
		this.#missiles.forEach(missile => missile.draw(ctx));

		// Turret.
		ctx.fillStyle = "#e8e8ea";
		ctx.drawCircle(this.#turret, 9, "fill");

		// HUD.
		ctx.fillStyle = "#8a8a93";
		ctx.writeText(
			"hold left button to fire homing missiles",
			this.canman.width / 2,
			26,
		);
		ctx.writeText(
			`${this.#missiles.length} in flight · ${this.#kills} kills`,
			this.canman.width / 2,
			this.canman.height - 8,
		);
	}

	/** Launch one missile from the turret toward the pointer. */
	#fire() {
		const heading = this.pointer.posScaled.clone().sub(this.#turret);
		if (heading.length() === 0) {
			return;
		}

		heading.normalize();

		// Each shot has its own hued sprite.
		const hue = randomBetweenInt(0, 360);
		const sprite = buildMissileSprite(`hsl(${hue} 90% 60%)`);

		// Projectile places the sprite by its top-left, and rotateBy() bakes it
		// into a square canvas sized to the diagonal — so offset the launch point
		// by half that to spawn centered on the turret.
		const size = Math.ceil(Math.hypot(sprite.width, sprite.height));
		const spawn = this.#turret.clone().sub(size / 2, size / 2);

		this.#missiles.push(
			new HomingMissile(spawn, sprite, heading, this.#homingTurn, {
				damage: randomBetweenInt(1, 2),
				speed: randomBetweenFloat(200, 500),
			}),
		);
	}

	/**
	 * Closest live target to a point, or null if the field is empty.
	 * @param {Vec2} from
	 * @returns {Target | null}
	 */
	#nearestTarget(from) {
		/** @type {Target | null} */
		let best = null;
		let bestDist = Infinity;

		this.#targets.forEach(target => {
			const dist = from.distance(target.center());
			if (dist < bestDist) {
				bestDist = dist;
				best = target;
			}
		});

		return best;
	}
}

/**
 * A small dart pointing along +x (rotation 0 in Projectile's convention), so
 * rebuildRotation aims it correctly from atan2(vel.y, vel.x).
 * @param {string} color CSS fill for the dart
 * @returns {HTMLCanvasElement}
 */
function buildMissileSprite(color) {
	const canvas = document.createElement("canvas");
	canvas.width = 18;
	canvas.height = 10;
	const ctx = /** @type {CanvasRenderingContext2D} */ (
		canvas.getContext("2d")
	);

	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.moveTo(18, 5); // nose (+x)
	ctx.lineTo(2, 0);
	ctx.lineTo(6, 5);
	ctx.lineTo(2, 10);
	ctx.closePath();
	ctx.fill();

	return canvas;
}

/**
 * @param {(desc: string) => void} setDesc
 */
export function init(setDesc) {
	setDesc("homing via rebuildRotation, remove on hit");

	new ProjectileDemo();
}
