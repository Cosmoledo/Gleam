import "./Audio";
import "./CanvasRenderingContext2D";
import "./HTMLCanvasElement";
import "./Storage";

HTMLImageElement.prototype.subImage = HTMLCanvasElement.prototype
	.subImage as any;
HTMLImageElement.prototype.rotateByAligned = HTMLCanvasElement.prototype
	.rotateByAligned as any;
