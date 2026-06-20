import { approxEqual, clamp, wrapValue } from "@/utilities/Number";
import { hue2rgb } from "@/utilities/Color";

/** Components returned by {@link Color.toHSLObject}. */
export interface HSLObject {
	/** Hue in degrees, `[0, 360]`. */
	h: number;
	/** Saturation in percent, `[0, 100]`. */
	s: number;
	/** Lightness in percent, `[0, 100]`. */
	l: number;
	/** Alpha in `[0, 1]`. */
	a: number;
}

/**
 * RGBA color with chainable mutators. Channels are stored clamped (`r/g/b` ∈ `[0, 255]`, `alpha` ∈ `[0, 1]`) — every mutator routes through {@link set}, so direct field writes aren't possible and clamping/rounding is uniform.
 *
 * **Hue unit gotcha**: {@link fromHSL} takes hue in **degrees** (CSS convention), but {@link hueRotate} takes **radians** (codebase convention). Use `Math.PI` etc. for hueRotate.
 *
 * All `to*` methods return CSS-compatible strings; `toHSLObject` returns the components as numbers if you need to mutate them.
 */
export class Color {
	/** Parse `#rgb`, `#rgba`, `#rrggbb`, or `#rrggbbaa` (case-insensitive, `#` optional). Throws on any other shape or on non-hex characters. */
	public static fromHex(hex: string): Color {
		let cleanHex = hex.replace("#", "").toUpperCase();

		if (!/^[0-9A-F]+$/.test(cleanHex)) {
			throw new Error(`Invalid hex color: ${hex}`);
		}

		if (cleanHex.length === 3 || cleanHex.length === 4) {
			cleanHex = cleanHex
				.split("")
				.map(c => c + c)
				.join("");
		}

		if (cleanHex.length !== 6 && cleanHex.length !== 8) {
			throw new Error(`Invalid hex color: ${hex}`);
		}

		const r = parseInt(cleanHex.slice(0, 2), 16);
		const g = parseInt(cleanHex.slice(2, 4), 16);
		const b = parseInt(cleanHex.slice(4, 6), 16);

		if (cleanHex.length === 8) {
			const a = parseInt(cleanHex.slice(6, 8), 16);

			return new Color(r, g, b, a / 255);
		}

		return new Color(r, g, b);
	}

	/** Build from HSL(A). `h` in **degrees** (wraps mod 360), `s`/`l` in percent `[0, 100]`, `a` in `[0, 1]`. The degree convention matches CSS — note that {@link hueRotate} uses radians instead. */
	public static fromHSL(
		h: number,
		s: number,
		l: number,
		a: number = 1,
	): Color {
		const hNorm = wrapValue(h, 0, 360) / 360;
		const sNorm = s / 100;
		const lNorm = l / 100;

		let r, g, b;

		if (sNorm === 0) {
			r = g = b = lNorm;
		} else {
			const q =
				lNorm < 0.5
					? lNorm * (1 + sNorm)
					: lNorm + sNorm - lNorm * sNorm;
			const p = 2 * lNorm - q;
			r = hue2rgb(p, q, hNorm + 1 / 3);
			g = hue2rgb(p, q, hNorm);
			b = hue2rgb(p, q, hNorm - 1 / 3);
		}

		return new Color(r * 255, g * 255, b * 255, a);
	}

	private _r!: number;
	private _g!: number;
	private _b!: number;
	private _alpha: number = 1;

	/** Red channel, `[0, 255]`. Read-only; mutate via {@link set} or any chainable transform. */
	public get r(): number {
		return this._r;
	}

	/** Green channel, `[0, 255]`. Read-only; mutate via {@link set} or any chainable transform. */
	public get g(): number {
		return this._g;
	}

	/** Blue channel, `[0, 255]`. Read-only; mutate via {@link set} or any chainable transform. */
	public get b(): number {
		return this._b;
	}

	/** Alpha channel, `[0, 1]`. Read-only; mutate via {@link set} (pass the fourth arg). */
	public get alpha(): number {
		return this._alpha;
	}

	constructor(r: number, g: number, b: number, a?: number) {
		this.set(r, g, b, a);
	}

	/** Primary mutator — every other transform on this class routes through it. Clamps `r`/`g`/`b` to `[0, 255]` and `a` to `[0, 1]`; alpha is snapped to exact `0` or `1` when within `approxEqual` tolerance so equality checks stay clean. Returns `this` for chaining. */
	public set(r: number, g: number, b: number, a?: number): this {
		this._r = clamp(r, 0, 255);
		this._g = clamp(g, 0, 255);
		this._b = clamp(b, 0, 255);

		if (a !== undefined) {
			const clamped = clamp(a, 0, 1);
			this._alpha = approxEqual(clamped, 0)
				? 0
				: approxEqual(clamped, 1)
					? 1
					: clamped;
		}

		return this;
	}

	/** Apply a 3×3 RGB color matrix in row-major order (`m1..m9`). Alpha is unchanged. Used by {@link grayscale}, {@link hueRotate}, {@link saturate}, {@link sepia}. Mutates and returns `this`. */
	public applyMatrix(
		m1: number,
		m2: number,
		m3: number,
		m4: number,
		m5: number,
		m6: number,
		m7: number,
		m8: number,
		m9: number,
	): this {
		return this.set(
			this.r * m1 + this.g * m2 + this.b * m3,
			this.r * m4 + this.g * m5 + this.b * m6,
			this.r * m7 + this.g * m8 + this.b * m9,
		);
	}

	/** Multiply each channel by `factor`. `factor < 1` darkens, `factor > 1` brightens (clamped at 255). Mutates and returns `this`. */
	public brightness(factor: number): this {
		return this.set(this.r * factor, this.g * factor, this.b * factor);
	}

	/** Push each channel away from `127.5` (the midtone) by `factor`. `factor < 1` flattens contrast, `> 1` increases it, `0` collapses every channel to gray. Mutates and returns `this`. */
	public contrast(factor: number): this {
		const midtone = 127.5;
		return this.set(
			midtone + (this.r - midtone) * factor,
			midtone + (this.g - midtone) * factor,
			midtone + (this.b - midtone) * factor,
		);
	}

	/** Desaturate via the standard luminance-preserving matrix. `value` in `[0, 1]`: `0` is a no-op, `1` is full grayscale. Mutates and returns `this`. */
	public grayscale(value: number = 1): this {
		const m1 = 0.2126 + 0.7874 * (1 - value);
		const m2 = 0.7152 - 0.7152 * (1 - value);
		const m3 = 0.0722 - 0.0722 * (1 - value);
		const m4 = 0.2126 - 0.2126 * (1 - value);
		const m5 = 0.7152 + 0.2848 * (1 - value);
		const m6 = 0.0722 - 0.0722 * (1 - value);
		const m7 = 0.2126 - 0.2126 * (1 - value);
		const m8 = 0.7152 - 0.7152 * (1 - value);
		const m9 = 0.0722 + 0.9278 * (1 - value);

		return this.applyMatrix(m1, m2, m3, m4, m5, m6, m7, m8, m9);
	}

	/** Rotate hue by `radians` (use `Math.PI / 2` etc.). Unlike {@link fromHSL}, this takes radians, not degrees. Mutates and returns `this`. */
	public hueRotate(radians: number): this {
		const cos = Math.cos(radians);
		const sin = Math.sin(radians);

		const m1 = 0.213 + cos * 0.787 - sin * 0.213;
		const m2 = 0.715 - cos * 0.715 - sin * 0.715;
		const m3 = 0.072 - cos * 0.072 + sin * 0.928;
		const m4 = 0.213 - cos * 0.213 + sin * 0.143;
		const m5 = 0.715 + cos * 0.285 + sin * 0.14;
		const m6 = 0.072 - cos * 0.072 - sin * 0.283;
		const m7 = 0.213 - cos * 0.213 - sin * 0.787;
		const m8 = 0.715 - cos * 0.715 + sin * 0.715;
		const m9 = 0.072 + cos * 0.928 + sin * 0.072;

		return this.applyMatrix(m1, m2, m3, m4, m5, m6, m7, m8, m9);
	}

	/** Interpolate each channel toward its inverse (`255 - c`). `factor` in `[0, 1]`: `0` is unchanged, `1` is fully inverted. Mutates and returns `this`. */
	public invert(factor: number = 1): this {
		return this.set(
			this.r * (1 - factor) + (255 - this.r) * factor,
			this.g * (1 - factor) + (255 - this.g) * factor,
			this.b * (1 - factor) + (255 - this.b) * factor,
		);
	}

	/** Linear blend toward `other`. `amount` in `[0, 1]`: `0` keeps `this`, `1` becomes `other`. Mixes alpha too. Mutates and returns `this`. */
	public mix(other: Color, amount: number): this {
		const inv = 1 - amount;

		return this.set(
			this.r * inv + other.r * amount,
			this.g * inv + other.g * amount,
			this.b * inv + other.b * amount,
			this.alpha * inv + other.alpha * amount,
		);
	}

	/** Round each RGB channel to the nearest integer. Alpha is untouched. Mutates and returns `this`. */
	public round(): this {
		return this.set(
			Math.round(this.r),
			Math.round(this.g),
			Math.round(this.b),
		);
	}

	/** Saturation matrix. `value` typically in `[0, 2]`: `0` desaturates to grayscale (same as `grayscale(1)`), `1` is a no-op, `> 1` oversaturates. Mutates and returns `this`. */
	public saturate(value: number = 1): this {
		const m1 = 0.213 + 0.787 * value;
		const m2 = 0.715 - 0.715 * value;
		const m3 = 0.072 - 0.072 * value;
		const m4 = 0.213 - 0.213 * value;
		const m5 = 0.715 + 0.285 * value;
		const m6 = 0.072 - 0.072 * value;
		const m7 = 0.213 - 0.213 * value;
		const m8 = 0.715 - 0.715 * value;
		const m9 = 0.072 + 0.928 * value;

		return this.applyMatrix(m1, m2, m3, m4, m5, m6, m7, m8, m9);
	}

	/** Sepia matrix. `value` in `[0, 1]`: `0` is unchanged, `1` is full sepia. Mutates and returns `this`. */
	public sepia(value: number = 1): this {
		const m1 = 0.393 + 0.607 * (1 - value);
		const m2 = 0.769 - 0.769 * (1 - value);
		const m3 = 0.189 - 0.189 * (1 - value);
		const m4 = 0.349 - 0.349 * (1 - value);
		const m5 = 0.686 + 0.314 * (1 - value);
		const m6 = 0.168 - 0.168 * (1 - value);
		const m7 = 0.272 - 0.272 * (1 - value);
		const m8 = 0.534 - 0.534 * (1 - value);
		const m9 = 0.131 + 0.869 * (1 - value);

		return this.applyMatrix(m1, m2, m3, m4, m5, m6, m7, m8, m9);
	}

	/** Tint or shade. `percent` in `[-1, 1]`: negative shades toward black, positive tints toward white, magnitude is the amount. Mutates and returns `this`. */
	public shade(percent: number): this {
		const target = percent < 0 ? 0 : 255;
		const p = Math.abs(percent);

		return this.set(
			this.r + (target - this.r) * p,
			this.g + (target - this.g) * p,
			this.b + (target - this.b) * p,
		);
	}

	/** CSS hex string. `#rrggbb` when alpha is exactly `1`, `#rrggbbaa` otherwise. Channels are rounded. */
	public toHex(): string {
		const r = Math.round(this.r).toString(16).padStart(2, "0");
		const g = Math.round(this.g).toString(16).padStart(2, "0");
		const b = Math.round(this.b).toString(16).padStart(2, "0");
		const rgb = `#${r}${g}${b}`;

		if (this.alpha === 1) {
			return rgb;
		}

		const a = Math.round(this.alpha * 255);
		return `${rgb}${a.toString(16).padStart(2, "0")}`;
	}

	/** CSS HSL string. `hsl(h, s%, l%)` when alpha is exactly `1`, `hsla(...)` otherwise. Hue is in degrees. */
	public toHSL(): string {
		const { h, s, l } = this.toHSLObject();
		const cssH = Math.round(h);
		const cssS = Math.round(s);
		const cssL = Math.round(l);

		return this.alpha === 1
			? `hsl(${cssH}, ${cssS}%, ${cssL}%)`
			: `hsla(${cssH}, ${cssS}%, ${cssL}%, ${this.alpha.toFixed(2)})`;
	}

	/** HSL(A) components as numbers — see {@link HSLObject}. Use when you need to compute against the values rather than render them as a string. */
	public toHSLObject(): HSLObject {
		const r = this.r / 255;
		const g = this.g / 255;
		const b = this.b / 255;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const l = (max + min) / 2;
		let h = 0;
		let s = 0;

		if (max !== min) {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

			switch (max) {
				case r:
					h = (g - b) / d + (g < b ? 6 : 0);
					break;

				case g:
					h = (b - r) / d + 2;
					break;

				case b:
					h = (r - g) / d + 4;
					break;
			}
			h /= 6;
		}

		return { h: h * 360, s: s * 100, l: l * 100, a: this.alpha };
	}

	/** CSS RGB string. `rgb(r, g, b)` when alpha is exactly `1`, `rgba(r, g, b, a)` otherwise. Channels are rounded. */
	public toRGB(): string {
		const r = Math.round(this.r);
		const g = Math.round(this.g);
		const b = Math.round(this.b);

		return this.alpha === 1
			? `rgb(${r}, ${g}, ${b})`
			: `rgba(${r}, ${g}, ${b}, ${this.alpha.toFixed(2)})`;
	}

	/** New `Color` with the same channels. */
	public clone(): Color {
		return new Color(this.r, this.g, this.b, this.alpha);
	}

	/** Approximate equality (within `approxEqual` tolerance). Pass `compareAlpha: false` to ignore the alpha channel. */
	public equals(other: Color, compareAlpha: boolean = true): boolean {
		return (
			approxEqual(this.r, other.r) &&
			approxEqual(this.g, other.g) &&
			approxEqual(this.b, other.b) &&
			(!compareAlpha || approxEqual(this.alpha, other.alpha))
		);
	}
}
