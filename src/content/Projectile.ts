import Vec2 from "@/math/Vec2";
import type Rect from "@/math/Rect";

export default class Projectile<T = unknown> {
	public maxLifetime = Infinity;
	public payload?: T;
	public speed = 1200;
	protected image!: HTMLCanvasElement;
	protected lifetime = 0;
	protected pos: Vec2;
	protected rotation = 0;
	protected vel: Vec2;
	protected _rect: Rect;
	private originalImage: HTMLCanvasElement;

	public get alive(): boolean {
		return this.lifetime < this.maxLifetime;
	}

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

	public update(dt: number): void {
		this.lifetime += dt;

		this.pos.x += this.vel.x * this.speed * dt;
		this.pos.y += this.vel.y * this.speed * dt;

		this._rect.set(this.pos.x, this.pos.y);
	}

	/**
	 * Allocates a fresh rotated canvas on each call — no internal cache.
	 * Caching by quantized rotation could be a feature when projectiles need to re-aim every tick (homing/seeking).
	 */
	public rebuildRotation(): void {
		this.rotation = Math.atan2(this.vel.y, this.vel.x);
		this.image = this.originalImage.rotateBy(this.rotation);
		this._rect.w = this.image.width;
		this._rect.h = this.image.height;
	}

	public remove(): void {
		this.lifetime = this.maxLifetime * 2;
	}
}
