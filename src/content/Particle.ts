import { random2Pi, randomBeetweenInt } from "@/utilities/Math";
import Rect from "@/core/Rect";
import Vec2 from "@/core/Vec2";

export default class Particle {
	protected color: string;
	protected lifetime: number = 0;
	protected maxLifeTime: number;
	protected pos: Vec2;
	protected size: number;
	protected vel: Vec2;

	public get alive(): boolean {
		return this.lifetime < this.maxLifeTime;
	}

	public get rect(): Rect {
		return this.pos.concatLast(this.size, this.size);
	}

	constructor(pos: Vec2, color: string, size: number = 2) {
		this.pos = pos;
		this.color = color;
		this.size = size;

		this.vel = Vec2.fromAngle(
			random2Pi(),
			randomBeetweenInt(50, 150),
			randomBeetweenInt(50, 150),
		).normalize();

		this.maxLifeTime = 0.5 + Math.random();
	}

	public draw(
		context: CanvasRenderingContext2D,
		offset: Vec2 = new Vec2(),
	): void {
		context.fillCircle(this.pos.clone().add(offset), this.size, this.color);
	}

	public update(dt: number): void {
		this.lifetime += dt;
		this.pos.add(this.vel);
	}

	public resetLifetime(): void {
		this.lifetime -= this.maxLifeTime;
	}
}
