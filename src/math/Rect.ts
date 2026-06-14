import Vec2 from "@/math/Vec2";
import type Polygon from "@/math/Polygon";
import { approxEqual } from "@/utilities/Number";
import type { Vector2, Vector4 } from "@/math/Vec2";

interface Sides {
	bottom: number;
	centerPos: Vec2;
	halfSize: Vec2;
	right: number;
}

export default class Rect {
	public static fromBoundingClientRect(rect: DOMRect | HTMLElement): Rect {
		if (rect instanceof HTMLElement) {
			rect = rect.getBoundingClientRect();
		}

		return new Rect(rect.left, rect.top, rect.width, rect.height);
	}

	public static fromPolygon(polygon: Polygon): Rect {
		if (polygon.points.length === 0) {
			throw new Error("Supplied polygon has no points!");
		}

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

	private _h = 0;
	private _w = 0;
	private _x = 0;
	private _y = 0;
	private _sides!: Sides;
	private sideIsDirty: boolean = true;

	public get h(): number {
		return this._h;
	}

	public set h(value: number) {
		this._h = value;
		this.sideIsDirty = true;
	}

	public get w(): number {
		return this._w;
	}

	public set w(value: number) {
		this._w = value;
		this.sideIsDirty = true;
	}

	public get x(): number {
		return this._x;
	}

	public set x(value: number) {
		this._x = value;
		this.sideIsDirty = true;
	}

	public get y(): number {
		return this._y;
	}

	public set y(value: number) {
		this._y = value;
		this.sideIsDirty = true;
	}

	public get sides(): Readonly<Sides> {
		if (this.sideIsDirty) {
			this._sides = {
				bottom: this.y + this.h,
				centerPos: new Vec2(
					this.x + this.w * 0.5,
					this.y + this.h * 0.5,
				),
				halfSize: new Vec2(this.w * 0.5, this.h * 0.5),
				right: this.x + this.w,
			};

			this.sideIsDirty = false;
		}

		return this._sides;
	}

	constructor(x = 0, y = 0, w = 0, h = 0) {
		this.set(x, y, w, h);
	}

	public inflate(delta: number): Rect {
		this.x -= delta;
		this.y -= delta;

		this.w += 2 * delta;
		this.h += 2 * delta;

		this.sideIsDirty = true;

		return this;
	}

	public set(
		x: Vector4 | Vector2 | number = 0,
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

		this.sideIsDirty = true;
		return this;
	}

	public round(): Rect {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);

		this.sideIsDirty = true;

		return this;
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
			rect.x + rect.w <= this.x + this.w &&
			rect.x >= this.x &&
			rect.y >= this.y &&
			rect.y + rect.h <= this.y + this.h
		);
	}

	public collidePoint(vec: Vector2): boolean {
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

	public equals(other: Rect, withSize: boolean = true): boolean {
		let output =
			approxEqual(this.x, other.x) && approxEqual(this.y, other.y);

		if (output && withSize) {
			output =
				approxEqual(this.w, other.w) && approxEqual(this.h, other.h);
		}

		return output;
	}
}
