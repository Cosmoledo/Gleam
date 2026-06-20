import Vec2 from "@/math/Vec2";
import type Controller from "@/input/Controller";

/**
 * On-screen crosshairs driven by a {@link Controller}'s analog sticks. Each anchor in `sticks` gets its own crosshair that follows the corresponding stick's deflection with frame-rate-independent exponential smoothing (50 ms half-life). The caller owns the anchor positions and the crosshair image — any `CanvasImageSource` works (a loaded `HTMLImageElement`, a procedurally-drawn `HTMLCanvasElement`, an `ImageBitmap`, …).
 *
 * {@link update} polls the controller for you; don't call {@link Controller.poll} again from the same `update` step.
 */
export default class ControllerCursor {
	private controller: Controller;
	private crosshair: CanvasImageSource;
	private range: number;
	private sticks: { pos: Vec2; offset: Vec2 }[] = [];

	/**
	 * @param controller Gamepad input source.
	 * @param crosshair Drawn at each cursor position via `CanvasRenderingContext2D.drawImage`. The image's top-left is the draw origin — center the visible reticle inside the image, or offset the anchors to compensate.
	 * @param sticks Anchor positions, one per stick to track. Cloned at construction so caller mutation is harmless.
	 * @param range Max pixel deflection from anchor at full stick. Default `80`.
	 */
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

	/** Draw a crosshair at `anchor + offset` for each tracked stick. */
	public draw(context: CanvasRenderingContext2D): void {
		this.sticks.forEach(stick => {
			context.drawImage(
				this.crosshair,
				stick.pos.x + stick.offset.x,
				stick.pos.y + stick.offset.y,
			);
		});
	}

	/** Pull fresh stick state via {@link Controller.poll} and smooth each crosshair's offset toward `stickAxis * range`. Frame-rate independent — 50 ms to cover half the remaining distance. */
	public update(dt: number): void {
		const alpha = 1 - Math.pow(0.5, dt / 0.05);
		this.controller.poll().forEach((axi, index) => {
			const offset = this.sticks[index].offset;
			offset.x += (axi.x * this.range - offset.x) * alpha;
			offset.y += (axi.y * this.range - offset.y) * alpha;
		});
	}
}
