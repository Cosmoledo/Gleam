import Vec2 from "@/core/Vec2";
import type Polygon from "@/core/Polygon";

export default class Rect {
	public static fromBoundingClientRect(rect: DOMRect | HTMLElement): Rect {
		if (rect instanceof HTMLElement) {
			rect = rect.getBoundingClientRect();
		}

		return new Rect(rect.left, rect.top, rect.width, rect.height);
	}

	public static fromPolygon(polygon: Polygon): Rect {
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		polygon.points.forEach(point => {
			if (point.x < minX) {
				minX = point.x;
			}

			if (point.x > maxX) {
				maxX = point.x;
			}

			if (point.y < minY) {
				minY = point.y;
			}

			if (point.y > maxY) {
				maxY = point.y;
			}
		});

		return new Rect(minX, minY, maxX - minX, maxY - minY);
	}

	public h = 0;
	public sides!: {
		bottom: number;
		centerPos: Vec2;
		halfSize: Vec2;
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
		y: number = 0,
		w?: number,
		h?: number,
	): Rect {
		if (typeof x === "number") {
			this.x = x;
			this.y = y;
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

	public round(): void {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		this.update();
	}

	public update(): void {
		this.sides = {
			bottom: this.y + this.h,
			centerPos: new Vec2(this.x + this.w * 0.5, this.y + this.h * 0.5),
			halfSize: new Vec2(this.w * 0.5, this.h * 0.5),
			right: this.x + this.w,
		};
	}

	public collide(rect: Rect): boolean {
		return (
			this.x <= rect.x + rect.w &&
			this.x + this.w >= rect.x &&
			this.y <= rect.y + rect.h &&
			this.y + this.h >= rect.y
		);
	}

	public collideFull(rect: Rect): boolean {
		return (
			rect.x + rect.w < this.x + this.w &&
			rect.x > this.x &&
			rect.y > this.y &&
			rect.y + rect.h < this.y + this.h
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

	public collideSide(
		rect: Rect,
	): "none" | "top" | "bottom" | "left" | "right" {
		const dx = this.x + this.w * 0.5 - (rect.x + rect.w * 0.5);
		const dy = this.y + this.h * 0.5 - (rect.y + rect.h * 0.5);
		const width = (this.w + rect.w) * 0.5;
		const height = (this.h + rect.h) * 0.5;
		const crossWidth = width * dy;
		const crossHeight = height * dx;
		let collision: "none" | "top" | "bottom" | "left" | "right" = "none";

		if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
			if (crossWidth > crossHeight) {
				collision = crossWidth > -crossHeight ? "bottom" : "left";
			} else {
				collision = crossWidth > -crossHeight ? "right" : "top";
			}
		}

		return collision;
	}

	public inflate(delta: number): Rect {
		return new Rect(
			this.x - delta,
			this.y - delta,
			this.w + 2 * delta,
			this.h + 2 * delta,
		);
	}

	public pos(): Vec2 {
		return new Vec2(this.x, this.y);
	}

	public size(): Vec2 {
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
