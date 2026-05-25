import Rect from "@/core/Rect";
import Vec2 from "@/core/Vec2";

export default class Projectile {
	public maxLifetime = Infinity;
	public payload: any;
	public speed = 1200;
	protected image: HTMLCanvasElement;
	protected lifetime = 0;
	protected pos: Vec2;
	protected rotation = 0;
	protected vel: Vec2;
	protected _rect: Rect;

	public get alive(): boolean {
		return this.lifetime < this.maxLifetime;
	}

	public get rect(): Rect {
		return this._rect;
	}

	constructor(pos: Vec2, image: HTMLCanvasElement, vel: Vec2 = new Vec2()) {
		this.pos = pos.clone();
		this.image = image;
		this.vel = vel.clone();

		this._rect = pos.toRectAddSize(this.image.width, this.image.height);

		this.rotation = Math.atan2(this.vel.y, this.vel.x);
	}

	public draw(
		context: CanvasRenderingContext2D,
		offset: Vec2 = new Vec2(),
	): void {
		context.drawImage(
			this.image.rotateBy(this.rotation),
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

	public remove(): void {
		this.lifetime = this.maxLifetime * 2;
	}
}
