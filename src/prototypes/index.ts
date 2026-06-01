import "./Audio";
import "./CanvasRenderingContext2D";
import "./HTMLCanvasElement";

export {};

declare global {
	interface HTMLImageElement {
		subImage(
			x: number,
			y: number,
			w?: number,
			h?: number,
		): HTMLCanvasElement;
	}
}

// Reuse the canvas implementations on images. It calls `drawImage(this, ...)`
// and reads `this.width / this.height` — all valid on HTMLImageElement too.
HTMLImageElement.prototype.subImage = HTMLCanvasElement.prototype
	.subImage as HTMLImageElement["subImage"];
