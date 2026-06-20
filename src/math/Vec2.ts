import Rect from "./Rect";
import { approxEqual, clamp } from "@/utilities/Number";
import { throttle } from "@/utilities/Functions";

/** Object literal compatible with `Vec2` (e.g. `{ x, y }`). */
export interface Vector2 {
	/** Horizontal component. */
	x: number;
	/** Vertical component. */
	y: number;
}

/** {@link Vector2} plus `w`/`h` for AABB-style values. */
export interface Vector4 extends Vector2 {
	/** Width. */
	w: number;
	/** Height. */
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

const warnZeroNormalize = throttle(count =>
	console.warn(
		`Vec2.normalize() called on zero vector x${count} since last warning; returning zero.`,
	),
);

const warnNonFinite = throttle(count =>
	console.warn(
		`Vec2 operation produced non-finite value x${count} since last warning; check for zero divisor.`,
	),
);

/**
 * 2D vector. Scalar args to `set`/`add`/`sub`/`mult`/`div`/`rem`/`mod`/`equals`
 * broadcast to both axes: `vec.add(5)` adds 5 to x and y, `vec.mult(-1)` negates
 * both. Pass `(x, y)` or a `Vector2` for per-axis values.
 */
export default class Vec2 {
	/** Unit vector at angle `rad` (radians), scaled per-axis. `scaleY` defaults to `scaleX`. */
	public static fromAngle(
		rad: number,
		scaleX = 1,
		scaleY: number = scaleX,
	): Vec2 {
		return new Vec2(Math.cos(rad) * scaleX, Math.sin(rad) * scaleY);
	}

	/** Horizontal component. */
	public x = 0;
	/** Vertical component. */
	public y = 0;

	constructor(x: Vector2 | number = 0, y?: number) {
		this.calculate(Operation.Equal, x, y);
	}

	/** Replace components. Mutates and returns `this`. */
	public set(v: Vector2): Vec2;
	public set(x: number, y?: number): Vec2;
	public set(x: Vector2 | number, y?: number): Vec2 {
		return this.calculate(Operation.Equal, x, y);
	}

	/** Set each component to its absolute value. Mutates and returns `this`. */
	public abs(): Vec2 {
		return this.map(Math.abs);
	}

	/** Per-axis add. Mutates and returns `this`. */
	public add(v: Vector2): Vec2;
	public add(x: number, y?: number): Vec2;
	public add(x: Vector2 | number, y?: number): Vec2 {
		return this.calculate(Operation.Add, x, y);
	}

	/** Round each component up. Mutates and returns `this`. */
	public ceil(): Vec2 {
		return this.map(Math.ceil);
	}

	/** Clamp each axis to its `[min, max]` range. `y` defaults to `x`. Mutates and returns `this`. */
	public clamp(x: [number, number], y: [number, number] = x): Vec2 {
		this.x = clamp(this.x, x[0], x[1]);
		this.y = clamp(this.y, y[0], y[1]);

		return this;
	}

	/** Per-axis divide. Mutates and returns `this`. */
	public div(v: Vector2): Vec2;
	public div(x: number, y?: number): Vec2;
	public div(x: Vector2 | number, y?: number): Vec2 {
		return this.calculate(Operation.Div, x, y);
	}

	/** Round each component down. Mutates and returns `this`. */
	public floor(): Vec2 {
		return this.map(Math.floor);
	}

	/**
	 * Apply `callback` to each component (`index` is `0` for x, `1` for y). Mutates and returns `this`.
	 *
	 * @example
	 * ```ts
	 * new Vec2(3.6, -2.1).map(Math.trunc);   // Vec2 { x: 3, y: -2 }
	 * new Vec2(2, 5).map((v, i) => v * (i + 1)); // Vec2 { x: 2, y: 10 }
	 * ```
	 */
	public map(callback: (value: number, index: number) => number): Vec2 {
		this.x = callback(this.x, 0);
		this.y = callback(this.y, 1);
		return this;
	}

	/** Per-axis Euclidean modulo (result sign matches the divisor). Mutates and returns `this`. */
	public mod(v: Vector2): Vec2;
	public mod(x: number, y?: number): Vec2;
	public mod(x: Vector2 | number, y?: number): Vec2 {
		return this.calculate(Operation.Mod, x, y);
	}

	/** Per-axis multiply. Mutates and returns `this`. */
	public mult(v: Vector2): Vec2;
	public mult(x: number, y?: number): Vec2;
	public mult(x: Vector2 | number, y?: number): Vec2 {
		return this.calculate(Operation.Mult, x, y);
	}

	/** Flip the sign of both components (same as `mult(-1)`). Mutates and returns `this`. */
	public negate(): Vec2 {
		return this.mult(-1);
	}

	/** Scale to unit length. Zero-length vectors are left untouched and warn (throttled). Mutates and returns `this`. */
	public normalize(): Vec2 {
		const length = this.length();

		if (approxEqual(length, 0)) {
			warnZeroNormalize();
			return this;
		}

		return this.map(value => value / length);
	}

	/** Scale so `|x| + |y| === 1`. Zero-length vectors are left untouched. Mutates and returns `this`. */
	public normalizeManhattan(): Vec2 {
		const length = this.lengthManhattan();

		if (approxEqual(length, 0)) {
			return this;
		}

		return this.map(value => value / length);
	}

	/** Per-axis remainder (JavaScript `%`, sign follows the dividend). Mutates and returns `this`. */
	public rem(v: Vector2): Vec2;
	public rem(x: number, y?: number): Vec2;
	public rem(x: Vector2 | number, y?: number): Vec2 {
		return this.calculate(Operation.Rem, x, y);
	}

	/** Round each component to the nearest integer. Mutates and returns `this`. */
	public round(): Vec2 {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		return this;
	}

	/** Per-axis subtract. Mutates and returns `this`. */
	public sub(v: Vector2): Vec2;
	public sub(x: number, y?: number): Vec2;
	public sub(x: Vector2 | number, y?: number): Vec2 {
		return this.calculate(Operation.Sub, x, y);
	}

	/** Angle in radians. No arg: angle of `this` from origin. With `other`: angle from `this` toward `other`. */
	public angle(other?: Vector2): number {
		if (!other) {
			return Math.atan2(this.y, this.x);
		}

		return Math.atan2(other.y - this.y, other.x - this.x);
	}

	/** Euclidean distance to `other`. */
	public distance(other: Vector2): number {
		return Math.sqrt(
			Math.pow(other.x - this.x, 2) + Math.pow(other.y - this.y, 2),
		);
	}

	/** Manhattan distance (`|dx| + |dy|`) to `other`. */
	public distanceManhattan(other: Vector2): number {
		return Math.abs(other.x - this.x) + Math.abs(other.y - this.y);
	}

	/** Dot product with `other`. */
	public dotProduct(other: Vector2): number {
		return this.x * other.x + this.y * other.y;
	}

	/** `true` when both components are finite (rules out `NaN` and `±Infinity`). */
	public isValid(): boolean {
		return Number.isFinite(this.x) && Number.isFinite(this.y);
	}

	/** Euclidean magnitude (`sqrt(x² + y²)`). */
	public length(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	/** Manhattan magnitude (`|x| + |y|`). */
	public lengthManhattan(): number {
		return Math.abs(this.x) + Math.abs(this.y);
	}

	/** Larger of the two components. */
	public max(): number {
		return Math.max(this.x, this.y);
	}

	/** Smaller of the two components. */
	public min(): number {
		return Math.min(this.x, this.y);
	}

	/** Tuple `[x, y]`. */
	public toArray(): [number, number] {
		return [this.x, this.y];
	}

	/** Build a `Rect` with the argument as position and `this` as size. */
	public toRectAddPos(v: Vector2): Rect;
	public toRectAddPos(x: number, y?: number): Rect;
	public toRectAddPos(x: Vector2 | number, y?: number): Rect {
		return this.concat(true, x, y);
	}

	/** Build a `Rect` with `this` as position and the argument as size. */
	public toRectAddSize(v: Vector2): Rect;
	public toRectAddSize(x: number, y?: number): Rect;
	public toRectAddSize(width: Vector2 | number, height?: number): Rect {
		return this.concat(false, width, height);
	}

	/** Debug string like `"Vec2 [x: 1, y: 2]"`. */
	public toString(): string {
		return `Vec2 [x: ${this.x}, y: ${this.y}]`;
	}

	/** New `Vec2` with the same components. */
	public clone(): Vec2 {
		return new Vec2(this.x, this.y);
	}

	/** Approximate equality (within `approxEqual` tolerance). Scalar broadcasts. */
	public equals(v: Vector2): boolean;
	public equals(x: number, y?: number): boolean;
	public equals(x: Vector2 | number, y?: number): boolean {
		const [x2, y2]: number[] = this.getValues(x, y);

		return approxEqual(this.x, x2) && approxEqual(this.y, y2);
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
