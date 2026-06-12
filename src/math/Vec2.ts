import Rect from "./Rect";
import { clamp } from "@/utilities/Number";
import { throttle } from "@/utilities/Functions";

export interface Vector2 {
	x: number;
	y: number;
}

export interface Vector4 extends Vector2 {
	w: number;
	h: number;
}

/**
 * Operation types for vector calculations
 */
const Operation = {
	Add: 1,
	Sub: 2,
	Mult: 3,
	Div: 4,
	Rem: 5,
	Equal: 6,
	Mod: 7,
} as const;

const warnZeroNormalize = throttle(
	count =>
		console.warn(
			`Vec2.normalize() called on zero vector ${count}× since last warning; returning zero.`,
		),
	1000,
);

const warnNonFinite = throttle(
	count =>
		console.warn(
			`Vec2 operation produced non-finite value ${count}× since last warning; check for zero divisor.`,
		),
	1000,
);

export default class Vec2 {
	public static fromAngle(
		rad: number,
		scaleX = 1,
		scaleY: number = scaleX,
	): Vec2 {
		return new Vec2(Math.cos(rad) * scaleX, Math.sin(rad) * scaleY);
	}

	public x = 0;
	public y = 0;

	constructor(x: Vector2 | number = 0, y?: number) {
		this.calculate(Operation.Equal, x, y);
	}

	public set(v: Vector2): Vec2;
	public set(x: number, y?: number): Vec2;
	public set(x: Vector2 | number, y?: number): Vec2 {
		return this.calculate(Operation.Equal, x, y);
	}

	public abs(): Vec2 {
		return this.map(Math.abs);
	}

	public add(v: Vector2): Vec2;
	public add(x: number, y?: number): Vec2;
	public add(x: Vector2 | number, y?: number): Vec2 {
		return this.calculate(Operation.Add, x, y);
	}

	public ceil(): Vec2 {
		return this.map(Math.ceil);
	}

	public clamp(x: number[], y: number[] = x): Vec2 {
		this.x = clamp(this.x, x[0], x[1]);
		this.y = clamp(this.y, y[0], y[1]);

		return this;
	}

	public div(v: Vector2): Vec2;
	public div(x: number, y?: number): Vec2;
	public div(x: Vector2 | number, y?: number): Vec2 {
		return this.calculate(Operation.Div, x, y);
	}

	public floor(): Vec2 {
		return this.map(Math.floor);
	}

	public inv(): Vec2 {
		return this.mult(-1);
	}

	public map(callback: (value: number, index: number) => number): Vec2 {
		this.x = callback(this.x, 0);
		this.y = callback(this.y, 1);
		return this;
	}

	public mod(v: Vector2): Vec2;
	public mod(x: number, y?: number): Vec2;
	public mod(x: Vector2 | number, y?: number): Vec2 {
		return this.calculate(Operation.Mod, x, y);
	}

	public mult(v: Vector2): Vec2;
	public mult(x: number, y?: number): Vec2;
	public mult(x: Vector2 | number, y?: number): Vec2 {
		return this.calculate(Operation.Mult, x, y);
	}

	public normalize(): Vec2 {
		const length = this.length();

		if (length === 0) {
			warnZeroNormalize();
			return this;
		}

		return this.map(value => value / length);
	}

	public normalizeManhattan(): Vec2 {
		const length = this.lengthManhattan();

		if (length === 0) {
			return this;
		}

		return this.map(value => value / length);
	}

	public rem(v: Vector2): Vec2;
	public rem(x: number, y?: number): Vec2;
	public rem(x: Vector2 | number, y?: number): Vec2 {
		return this.calculate(Operation.Rem, x, y);
	}

	public round(): Vec2 {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		return this;
	}

	public sub(v: Vector2): Vec2;
	public sub(x: number, y?: number): Vec2;
	public sub(x: Vector2 | number, y?: number): Vec2 {
		return this.calculate(Operation.Sub, x, y);
	}

	public angle(...other: Vector2[]): number {
		const out = this.clone();

		other.forEach(vec2 => out.sub(vec2));

		return Math.atan2(out.y, out.x);
	}

	public distance(other: Vector2): number {
		return Math.sqrt(
			Math.pow(other.x - this.x, 2) + Math.pow(other.y - this.y, 2),
		);
	}

	public distanceManhattan(other: Vector2): number {
		return Math.abs(other.x - this.x) + Math.abs(other.y - this.y);
	}

	public dotProduct(other: Vector2): number {
		return this.x * other.x + this.y * other.y;
	}

	public isValid(): boolean {
		return Number.isFinite(this.x) && Number.isFinite(this.y);
	}

	public length(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	public lengthManhattan(): number {
		return Math.abs(this.x) + Math.abs(this.y);
	}

	public max(): number {
		return Math.max(this.x, this.y);
	}

	public min(): number {
		return Math.min(this.x, this.y);
	}

	public toArray(): [number, number] {
		return [this.x, this.y];
	}

	public toRectAddPos(x: Vector2 | number, y?: number): Rect {
		return this.concat(true, x, y);
	}

	public toRectAddSize(width: Vector2 | number, height?: number): Rect {
		return this.concat(false, width, height);
	}

	public toString(): string {
		return `Vec2 [x: ${this.x}, y: ${this.y}]`;
	}

	public clone(): Vec2 {
		return new Vec2(this.x, this.y);
	}

	public equals(v: Vector2): boolean;
	public equals(x: number, y?: number): boolean;
	public equals(x: Vector2 | number, y?: number): boolean {
		const [x2, y2]: number[] = this.getValues(x, y);

		return this.x === x2 && this.y === y2;
	}

	private calculate(
		operation: (typeof Operation)[keyof typeof Operation],
		x: Vector2 | number,
		y?: number,
	): Vec2 {
		const [x2, y2]: number[] = this.getValues(x, y);

		switch (operation) {
			case Operation.Add:
				this.x += x2;
				this.y += y2;
				break;

			case Operation.Sub:
				this.x -= x2;
				this.y -= y2;
				break;

			case Operation.Mult:
				this.x *= x2;
				this.y *= y2;
				break;

			case Operation.Div:
				this.x /= x2;
				this.y /= y2;
				break;

			case Operation.Rem:
				this.x %= x2;
				this.y %= y2;
				break;

			case Operation.Equal:
				this.x = x2;
				this.y = y2;
				break;

			case Operation.Mod:
				this.x = ((this.x % x2) + x2) % x2;
				this.y = ((this.y % y2) + y2) % y2;
				break;

			default:
				operation satisfies never;
				break;
		}

		if (!this.isValid()) {
			warnNonFinite();
		}

		return this;
	}

	private concat(first: boolean, x: Vector2 | number, y?: number): Rect {
		const [x2, y2]: number[] = this.getValues(x, y);

		if (first) {
			return new Rect(x2, y2, this.x, this.y);
		}

		return new Rect(this.x, this.y, x2, y2);
	}

	private getValues(x: Vector2 | number, y?: number): number[] {
		let inputX = 0;
		let inputY = 0;

		if (typeof x === "number") {
			inputX = x;
			if (y === undefined) {
				inputY = x;
			} else {
				inputY = y;
			}
		} else {
			if (y === undefined) {
				inputX = x.x;
				inputY = x.y;
			} else {
				throw new Error("When x is a Vector2, y must be omitted!");
			}
		}

		return [inputX, inputY];
	}
}
