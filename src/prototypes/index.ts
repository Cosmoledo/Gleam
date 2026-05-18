import "./Audio";
import "./CanvasRenderingContext2D";
import "./HTMLCanvasElement";
import "./Storage";

// Bind methods and cast through unknown for cross-prototype compatibility
const subImageFn = HTMLCanvasElement.prototype.subImage.bind(
	HTMLCanvasElement.prototype,
) as unknown as (x: number, y: number, w?: number, h?: number) => HTMLImageElement;

const rotateByAlignedFn = HTMLCanvasElement.prototype.rotateByAligned.bind(
	HTMLCanvasElement.prototype,
) as unknown as (radians: number) => HTMLImageElement;

HTMLImageElement.prototype.subImage = subImageFn;
HTMLImageElement.prototype.rotateByAligned = rotateByAlignedFn;
