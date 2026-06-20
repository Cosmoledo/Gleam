import Vec2 from "@/math/Vec2";
import type Rect from "@/math/Rect";
import { random2Pi, randomBetweenInt } from "@/utilities/Math";

/**
 * Single particle drawn as a filled circle. The constructor seeds a random velocity (random angle, per-axis speed in `[50, 150]` px/s) and a random `maxLifeTime` in `[0.5, 1.5]` s — spawn many at once for spark/dust effects. Each tick `update(dt)` advances `lifetime` and `pos`; the particle is "dead" when {@link alive} flips to `false`.
 */
export default class Particle {
	/** CSS color string passed to `context.fillStyle` in {@link draw}. */
	protected color: string;
	/** Accumulated time (seconds) since spawn or last {@link resetLifetime}. */
	protected lifetime: number = 0;
	/** Lifetime cap in seconds, randomized to `[0.5, 1.5]` at construction. */
	protected maxLifeTime: number;
	/** Top-left position. Cloned from the constructor arg so the caller's `Vec2` isn't aliased. */
	protected pos: Vec2;
	/** Circle radius (pixels). */
	protected size: number;
	/** Velocity in px/s. Seeded randomly by the constructor (random angle, random magnitude per axis). */
	protected vel: Vec2;
	/** Backing storage for the {@link rect} getter. Subclasses can read it; the public-facing accessor is {@link rect}. */
	protected _rect: Rect;

	/** `false` once {@link lifetime} reaches {@link maxLifeTime}. Owners typically filter dead particles out of their list each frame, or call {@link resetLifetime} to recycle. */
	public get alive(): boolean {
		return this.lifetime < this.maxLifeTime;
	}

	/** Read-only AABB tracking `pos` and the particle's `size`. Recomputed each {@link update}. */
	public get rect(): Readonly<Rect> {
		return this._rect;
	}

	constructor(pos: Vec2, color: string, size: number = 2) {
		this.pos = pos.clone();
		this.color = color;
		this.size = size;

		this._rect = pos.toRectAddSize(size);

		this.vel = Vec2.fromAngle(
			random2Pi(),
			randomBetweenInt(50, 150),
			randomBetweenInt(50, 150),
		);

		this.maxLifeTime = 0.5 + Math.random();
	}

	/** Fill a circle at `pos + offset` using {@link color}. `offset` is useful for shifting by a camera/world transform without mutating `pos`. */
	public draw(
		context: CanvasRenderingContext2D,
		offset: Vec2 = new Vec2(),
	): void {
		context.fillStyle = this.color;
		context.drawCircle(
			{
				x: this.pos.x + offset.x,
				y: this.pos.y + offset.y,
			},
			this.size,
			"fill",
		);
	}

	/** Integrate lifetime, position, and bounding rect. */
	public update(dt: number): void {
		this.lifetime += dt;
		this.pos.x += this.vel.x * dt;
		this.pos.y += this.vel.y * dt;
		this._rect.set(this.pos.x, this.pos.y);
	}

	/** Recycle a dead particle by subtracting `maxLifeTime` from `lifetime` — preserves any overshoot so a pool of pre-allocated particles can stay phase-stable across loops. Note this doesn't re-randomize `vel` or `pos`; mutate those externally if you want a fresh trajectory. */
	public resetLifetime(): void {
		this.lifetime -= this.maxLifeTime;
	}
}
