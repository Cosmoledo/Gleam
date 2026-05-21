import "./Audio";
import "./CanvasRenderingContext2D";
import "./HTMLCanvasElement";
import "./Storage";

// Reuse the canvas implementations on images. It calls `drawImage(this, ...)`
// and reads `this.width / this.height` — all valid on HTMLImageElement too.
HTMLImageElement.prototype.subImage = HTMLCanvasElement.prototype
	.subImage as HTMLImageElement["subImage"];
