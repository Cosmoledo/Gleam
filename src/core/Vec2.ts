import { clamp } from "@/utilities/Number";
import { isInteger } from "@/utilities/Math";
import Rect from "./Rect";

/**
 * Operation types for vector calculations
 */
const Operation = {
	Add: 1,
	Sub: 2,
	Mult: 3,
	Div: 4,
	Mod: 5,
	Equal: 6,
} as const;

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

	constructor(x: GameLIB.Vector2 | number = 0, y = 0) {
		if (typeof x === "number") {
			this.set(x, y);
		} else {
			this.set(x.x, x.y);
		}
	}

	public concatLast(width: GameLIB.Vector2 | number, height?: number): Rect {
		return this._concat(false, width, height);
	}

	public concatFirst(x: GameLIB.Vector2 | number, y?: number): Rect {
		return this._concat(true, x, y);
	}

	public clone(): Vec2 {
		return new Vec2(this.x, this.y);
	}

	public angle(...other: GameLIB.Vector2[]): number {
		const out = this.clone();

		other.forEach(vec2 => out.sub(vec2));

		return Math.atan2(out.y, out.x);
	}

	public add(x: GameLIB.Vector2 | number, y?: number): Vec2 {
		return this._calculate(Operation.Add, x, y);
	}

	public sub(x: GameLIB.Vector2 | number, y?: number): Vec2 {
		return this._calculate(Operation.Sub, x, y);
	}

	public mult(x: GameLIB.Vector2 | number, y?: number): Vec2 {
		return this._calculate(Operation.Mult, x, y);
	}

	public div(x: GameLIB.Vector2 | number, y?: number): Vec2 {
		return this._calculate(Operation.Div, x, y);
	}

	public mod(x: GameLIB.Vector2 | number, y?: number): Vec2 {
		return this._calculate(Operation.Mod, x, y);
	}

	public set(x: GameLIB.Vector2 | number, y?: number): Vec2 {
		return this._calculate(Operation.Equal, x, y);
	}

	public clamp(x: number[], y: number[] = x): Vec2 {
		this.x = clamp(this.x, x[0], x[1]);
		this.y = clamp(this.y, y[0], y[1]);

		return this;
	}

	public floor(): Vec2 {
		return this.map(Math.floor);
	}

	public ceil(): Vec2 {
		return this.map(Math.ceil);
	}

	public abs(): Vec2 {
		return this.map(Math.abs);
	}

	public max(): number {
		return Math.max(this.x, this.y);
	}

	public min(): number {
		return Math.min(this.x, this.y);
	}

	public inv(): Vec2 {
		return this.mult(-1);
	}

	public length(): number {
		return Math.abs(this.x) + Math.abs(this.y);
	}

	public lengthReal(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	public normalize(): Vec2 {
		const length = this.length();
		if (length === 0) {
			return new Vec2();
		}
		return this.map(value => value / length);
	}

	public normalizeReal(): Vec2 {
		const length = this.lengthReal();
		if (length === 0) {
			return new Vec2();
		}
		return this.map(value => value / length);
	}

	public isValid(): boolean {
		return isInteger(this.x) && isInteger(this.y);
	}

	public map(callback: (value: number, index: number) => number): Vec2 {
		this.x = callback(this.x, 0);
		this.y = callback(this.y, 1);
		return this;
	}

	public distance(other: GameLIB.Vector2): number {
		return Math.sqrt(
			Math.pow(other.x - this.x, 2) + Math.pow(other.y - this.y, 2),
		);
	}

	public distanceManhattan(other: GameLIB.Vector2): number {
		return Math.abs(other.x - this.x) + Math.abs(other.y - this.y);
	}

	public dotProduct(other: GameLIB.Vector2): number {
		return this.x * other.x + this.y * other.y;
	}

	public round(): Vec2 {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		return this;
	}

	public equals(x: GameLIB.Vector2 | number, y?: number): boolean {
		const [x2, y2]: number[] = this._getValues(x, y);

		return this.x === x2 && this.y === y2;
	}

	public toString(): string {
		return `Vec2 [x: ${this.x}, y: ${this.y}]`;
	}

	public toArray(): [number, number] {
		return [this.x, this.y];
	}

	private _concat(
		first: boolean,
		x: GameLIB.Vector2 | number,
		y?: number,
	): Rect {
		const [x2, y2]: number[] = this._getValues(x, y);

		if (first) {
			return new Rect(x2, y2, this.x, this.y);
		}

		return new Rect(this.x, this.y, x2, y2);
	}

	private _calculate(
		operation: typeof Operation[keyof typeof Operation],
		x: GameLIB.Vector2 | number,
		y?: number,
	): Vec2 {
		const [x2, y2]: number[] = this._getValues(x, y);

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

			case Operation.Mod:
				this.x %= x2;
				this.y %= y2;
				break;

			case Operation.Equal:
				this.x = x2;
				this.y = y2;
				break;

			default:
				operation satisfies never;
				break;
		}
		return this;
	}

	private _getValues(x: GameLIB.Vector2 | number, y?: number): number[] {
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
