import { defineMethod } from "@/utilities/Prototype";

import "./Audio";
import "./CanvasRenderingContext2D";
import "./HTMLCanvasElement";

// #region subImage
declare global {
	interface HTMLImageElement {
		/**
		 * Crop a `(w, h)` sub-region starting at `(x, y)` into a new canvas.
		 * @param w default `this.width`
		 * @param h default `this.height`
		 */
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
defineMethod(
	HTMLImageElement.prototype,
	"subImage",
	HTMLCanvasElement.prototype.subImage as HTMLImageElement["subImage"],
);
// #endregion
