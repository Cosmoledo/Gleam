import Vec2 from "@/math/Vec2";
import type Rect from "@/math/Rect";
import { random2Pi, randomBetweenInt } from "@/utilities/Math";

export default class Particle {
	protected color: string;
	protected lifetime: number = 0;
	protected maxLifeTime: number;
	protected pos: Vec2;
	protected size: number;
	protected vel: Vec2;
	protected _rect: Rect;

	public get alive(): boolean {
		return this.lifetime < this.maxLifeTime;
	}

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

	public update(dt: number): void {
		this.lifetime += dt;
		this.pos.x += this.vel.x * dt;
		this.pos.y += this.vel.y * dt;
		this._rect.set(this.pos.x, this.pos.y);
	}

	public resetLifetime(): void {
		this.lifetime -= this.maxLifeTime;
	}
}
