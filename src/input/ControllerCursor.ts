import Vec2 from "@/math/Vec2";
import type Controller from "./Controller";

export default class ControllerCursor {
	private controller: Controller;
	private crosshair: CanvasImageSource;
	private range: number;
	private sticks: { pos: Vec2; offset: Vec2 }[] = [];

	constructor(
		controller: Controller,
		crosshair: CanvasImageSource,
		sticks: Vec2[],
		range = 80,
	) {
		this.controller = controller;
		this.crosshair = crosshair;
		this.range = range;

		sticks.forEach(stick =>
			this.sticks.push({ pos: stick.clone(), offset: new Vec2() }),
		);
	}

	public draw(context: CanvasRenderingContext2D): void {
		this.sticks.forEach(stick => {
			context.drawImage(
				this.crosshair,
				stick.pos.x + stick.offset.x,
				stick.pos.y + stick.offset.y,
			);
		});
	}

	public update(dt: number): void {
		const alpha = 1 - Math.pow(0.5, dt / 0.05);
		this.controller.poll().forEach((axi, index) => {
			const offset = this.sticks[index].offset;
			offset.x += (axi.x * this.range - offset.x) * alpha;
			offset.y += (axi.y * this.range - offset.y) * alpha;
		});
	}
}
