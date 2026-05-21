import "./Audio";
import "./CanvasRenderingContext2D";
import "./HTMLCanvasElement";
import "./Storage";

// Reuse the canvas implementations on images. Both call `drawImage(this, ...)`
// and read `this.width / this.height` — all valid on HTMLImageElement too.
HTMLImageElement.prototype.subImage = HTMLCanvasElement.prototype
	.subImage as HTMLImageElement["subImage"];

HTMLImageElement.prototype.rotateByAligned = HTMLCanvasElement.prototype
	.rotateByAligned as HTMLImageElement["rotateByAligned"];
