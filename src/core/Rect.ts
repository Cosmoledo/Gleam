import Polygon from "@/core/Polygon";
import Vec2 from "@/core/Vec2";

export default class Rect {
	public static fromBoundingClientRect(rect: DOMRect | HTMLElement): Rect {
		if (rect instanceof HTMLElement) {
			rect = rect.getBoundingClientRect();
		}

		return new Rect(rect.left, rect.top, rect.width, rect.height);
	}

	public static fromPolygon(polygon: Polygon): Rect {
		const x = polygon.points.map((vec: Vec2) => vec.x);
		const y = polygon.points.map((vec: Vec2) => vec.y);

		const rect = new Rect(Math.min(...x), Math.min(...y));

		rect.w = Math.max(...x) - rect.x;
		rect.h = Math.max(...y) - rect.y;

		rect.update();

		return rect;
	}

	public h = 0;
	public sides!: {
		bottom: number;
		center: Vec2;
		centerPos: Vec2;
		right: number;
	};
	public w = 0;
	public x = 0;
	public y = 0;

	constructor(x = 0, y = 0, w = 0, h = 0) {
		this.set(x, y, w, h);
	}

	public set(
		x: GameLIB.Vector4 | GameLIB.Vector2 | number = 0,
		y?: number,
		w?: number,
		h?: number,
	): Rect {
		if (typeof x === "number") {
			this.x = x;
			this.y = y!;
		} else {
			if ("w" in x) {
				this.w = x.w;
				this.h = x.h;
			}

			this.x = x.x;
			this.y = x.y;
		}

		if (w !== undefined) {
			this.w = w;
		}

		if (h !== undefined) {
			this.h = h;
		}

		this.update();
		return this;
	}

	public inflate(delta: number): Rect {
		this.update();

		return new Rect(
			this.x - delta,
			this.y - delta,
			this.sides.right + delta,
			this.sides.bottom + delta,
		);
	}

	public round(): void {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		this.update();
	}

	public update(): void {
		this.sides = {
			bottom: this.y + this.h,
			center: new Vec2(this.w * 0.5, this.h * 0.5),
			centerPos: new Vec2(this.x + this.w * 0.5, this.y + this.h * 0.5),
			right: this.x + this.w,
		};
	}

	public collide(rect: Rect): boolean {
		return (
			this.x <= rect.sides.right &&
			this.sides.right >= rect.x &&
			this.y <= rect.sides.bottom &&
			this.sides.bottom >= rect.y
		);
	}

	public collideFull(rect: Rect): boolean {
		return (
			rect.sides.right < this.sides.right &&
			rect.x > this.x &&
			rect.y > this.y &&
			rect.sides.bottom < this.sides.bottom
		);
	}

	public collidePoint(vec: GameLIB.Vector2): boolean {
		return (
			this.x <= vec.x &&
			vec.x <= this.x + this.w &&
			this.y <= vec.y &&
			vec.y <= this.y + this.h
		);
	}

	public collideSide(rect: Rect): string {
		const dx = this.x + this.w * 0.5 - (rect.x + rect.w * 0.5);
		const dy = this.y + this.h * 0.5 - (rect.y + rect.h * 0.5);
		const width = (this.w + rect.w) * 0.5;
		const height = (this.h + rect.h) * 0.5;
		const crossWidth = width * dy;
		const crossHeight = height * dx;
		let collision = "none";

		if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
			if (crossWidth > crossHeight) {
				collision = crossWidth > -crossHeight ? "bottom" : "left";
			} else {
				collision = crossWidth > -crossHeight ? "right" : "top";
			}
		}

		return collision;
	}

	public first(): Vec2 {
		return new Vec2(this.x, this.y);
	}

	public last(): Vec2 {
		return new Vec2(this.w, this.h);
	}

	public toString(): string {
		return `Rect [x: ${this.x}, y: ${this.y}, w: ${this.w}, h: ${this.h}]`;
	}

	public clone(): Rect {
		return new Rect(this.x, this.y, this.w, this.h);
	}

	public equals(other: Rect, withSize: boolean): boolean {
		let output = this.x === other.x && this.y === other.y;
		if (output && withSize) {
			output = this.w === other.w && this.h === other.h;
		}
		return output;
	}
}
