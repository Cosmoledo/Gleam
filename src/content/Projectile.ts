import Vec2 from "@/math/Vec2";
import type Rect from "@/math/Rect";

/**
 * A self-propelled sprite — `update(dt)` advances `pos` along `vel * speed`, accumulates `lifetime`, and flips {@link alive} to `false` once `lifetime >= maxLifetime`. The image is pre-baked to a rotated canvas matching the velocity direction; call {@link rebuildRotation} after re-aiming.
 *
 * The `T` generic types the optional {@link payload} so callers can attach typed metadata (damage, owner, etc.) without losing inference.
 */
export default class Projectile<T = unknown> {
	/** Seconds after which {@link alive} flips to `false`. Defaults to `Infinity` — no natural expiry. */
	public maxLifetime = Infinity;
	/** Caller-supplied data. Typed via the class generic so consumers can read `projectile.payload` without casting. */
	public payload?: T;
	/** Magnitude multiplier applied to `vel` each update: `pos += vel * speed * dt`. Pass a unit-length `vel` to make this read as "pixels per second". */
	public speed = 1200;
	/** Current pre-rotated sprite. Re-baked by {@link rebuildRotation} from the un-rotated `originalImage`. */
	protected image!: HTMLCanvasElement;
	/** Accumulated time (seconds). Drives the {@link alive} check against {@link maxLifetime}. */
	protected lifetime = 0;
	/** Top-left position. Cloned from the constructor arg so the caller's `Vec2` isn't aliased. */
	protected pos: Vec2;
	/** Current sprite rotation in radians, kept in sync with `vel` by {@link rebuildRotation}. */
	protected rotation = 0;
	/** Velocity direction vector. Multiplied by {@link speed} each update — pass a unit vector for `speed`-as-px-per-second semantics. Cloned from the constructor arg. */
	protected vel: Vec2;
	/** Backing storage for the {@link rect} getter. Subclasses can read it; mutate via `pos`/{@link rebuildRotation} instead of touching it directly. */
	protected _rect: Rect;
	private originalImage: HTMLCanvasElement;

	/** `false` once {@link lifetime} reaches {@link maxLifetime}. Owners typically filter dead projectiles out of their list each frame. */
	public get alive(): boolean {
		return this.lifetime < this.maxLifetime;
	}

	/** Read-only AABB tracking `pos` and the (rotated) image size. Recomputed in {@link update} and {@link rebuildRotation}. */
	public get rect(): Readonly<Rect> {
		return this._rect;
	}

	constructor(pos: Vec2, image: HTMLCanvasElement, vel: Vec2 = new Vec2()) {
		this.pos = pos.clone();
		this.originalImage = image;
		this.vel = vel.clone();

		this._rect = pos.toRectAddSize(image.width, image.height);

		this.rebuildRotation();
	}

	/** Blit the pre-rotated image at `pos + offset`. `offset` is useful for shifting by a camera/world transform without mutating `pos`. */
	public draw(
		context: CanvasRenderingContext2D,
		offset: Vec2 = new Vec2(),
	): void {
		context.drawImage(
			this.image,
			this.pos.x + offset.x,
			this.pos.y + offset.y,
		);
	}

	/** Integrate motion and advance lifetime. Doesn't re-bake the rotation — call {@link rebuildRotation} after mutating `vel`. */
	public update(dt: number): void {
		this.lifetime += dt;

		this.pos.x += this.vel.x * this.speed * dt;
		this.pos.y += this.vel.y * this.speed * dt;

		this._rect.set(this.pos.x, this.pos.y);
	}

	/**
	 * Re-bake the sprite to match the current `vel` direction (rotation = `atan2(vel.y, vel.x)`) and update `rect` to the new bounds. Allocates a fresh rotated canvas every call — no internal cache, so heavy re-aiming (homing/seeking) is a candidate for adding quantized caching.
	 */
	public rebuildRotation(): void {
		this.rotation = Math.atan2(this.vel.y, this.vel.x);
		this.image = this.originalImage.rotateBy(this.rotation);
		this._rect.w = this.image.width;
		this._rect.h = this.image.height;
	}

	/** Force {@link alive} to `false` immediately (sets `lifetime` past `maxLifetime`). Use when the projectile should die on collision/impact, not from natural expiry. */
	public remove(): void {
		this.lifetime = this.maxLifetime * 2;
	}
}
