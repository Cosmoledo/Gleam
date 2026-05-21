import { clamp } from "@/utilities/Number";
import { hueToRGB } from "@/utilities/Color";

export class Color {
	public r!: number;
	public g!: number;
	public b!: number;
	public alpha: number = 1;

	public static fromHex(hex: string): Color {
		let cleanHex = hex.replace("#", "").toUpperCase();

		if (cleanHex.length === 3) {
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
			return new Color(r, g, b, parseInt(cleanHex.slice(6, 8), 16) / 255);
		}

		return new Color(r, g, b);
	}

	public static fromHSL(h: number, s: number, l: number): Color {
		const hNorm = h / 360;
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
			r = hueToRGB(p, q, hNorm + 1 / 3);
			g = hueToRGB(p, q, hNorm);
			b = hueToRGB(p, q, hNorm - 1 / 3);
		}

		return new Color(
			Math.round(r * 255),
			Math.round(g * 255),
			Math.round(b * 255),
		);
	}

	constructor(r: number, g: number, b: number, a?: number) {
		this.set(r, g, b, a);
	}

	public set(r: number, g: number, b: number, a?: number): void {
		this.r = Math.round(clamp(r, 0, 255));
		this.g = Math.round(clamp(g, 0, 255));
		this.b = Math.round(clamp(b, 0, 255));

		if (a !== undefined) {
			this.alpha = clamp(a, 0, 1);
		}
	}

	public invert(factor: number = 1): void {
		this.set(
			(255 - this.r) * factor,
			(255 - this.g) * factor,
			(255 - this.b) * factor,
		);
	}

	public brightness(factor: number): void {
		this.set(
			this.r * factor,
			this.g * factor,
			this.b * factor,
			this.alpha * factor,
		);
	}

	public contrast(factor: number): void {
		if (this.alpha === 1) {
			const midtone = 128;
			this.set(
				midtone + (this.r - midtone) * factor,
				midtone + (this.g - midtone) * factor,
				midtone + (this.b - midtone) * factor,
			);
		} else {
			this.set(this.r * factor, this.g * factor, this.b * factor);
		}
	}

	public shade(percent: number): void {
		const target = percent < 0 ? 0 : 255;
		const p = Math.abs(percent);
		this.set(
			this.r + (target - this.r) * p,
			this.g + (target - this.g) * p,
			this.b + (target - this.b) * p,
		);
	}

	public mix(other: Color, amount: number): void {
		const inv = 1 - amount;
		this.set(
			this.r * inv + other.r * amount,
			this.g * inv + other.g * amount,
			this.b * inv + other.b * amount,
			this.alpha * inv + other.alpha * amount,
		);
	}

	public saturate(value: number = 1): void {
		const m1 = 0.213 + 0.787 * value;
		const m2 = 0.715 - 0.715 * value;
		const m3 = 0.072 - 0.072 * value;
		const m4 = 0.213 - 0.213 * value;
		const m5 = 0.715 + 0.285 * value;
		const m6 = 0.072 - 0.072 * value;
		const m7 = 0.213 - 0.213 * value;
		const m8 = 0.715 - 0.715 * value;
		const m9 = 0.072 + 0.928 * value;

		this.set(
			this.r * m1 + this.g * m2 + this.b * m3,
			this.r * m4 + this.g * m5 + this.b * m6,
			this.r * m7 + this.g * m8 + this.b * m9,
		);
	}

	public grayscale(value: number = 1): void {
		const m1 = 0.2126 + 0.7874 * (1 - value);
		const m2 = 0.7152 - 0.7152 * (1 - value);
		const m3 = 0.0722 - 0.0722 * (1 - value);
		const m4 = 0.2126 - 0.2126 * (1 - value);
		const m5 = 0.7874 + 0.2126 * (1 - value);
		const m6 = 0.0722 - 0.0722 * (1 - value);
		const m7 = 0.2126 - 0.2126 * (1 - value);
		const m8 = 0.7152 - 0.7152 * (1 - value);
		const m9 = 0.0722 + 0.9278 * (1 - value);

		this.set(
			this.r * m1 + this.g * m2 + this.b * m3,
			this.r * m4 + this.g * m5 + this.b * m6,
			this.r * m7 + this.g * m8 + this.b * m9,
		);
	}

	public sepia(value: number = 1): void {
		const m1 = 0.393 + 0.607 * (1 - value);
		const m2 = 0.769 - 0.769 * (1 - value);
		const m3 = 0.189 - 0.189 * (1 - value);
		const m4 = 0.349 - 0.349 * (1 - value);
		const m5 = 0.686 + 0.314 * (1 - value);
		const m6 = 0.168 - 0.168 * (1 - value);
		const m7 = 0.272 - 0.272 * (1 - value);
		const m8 = 0.534 - 0.534 * (1 - value);
		const m9 = 0.131 + 0.869 * (1 - value);

		this.set(
			this.r * m1 + this.g * m2 + this.b * m3,
			this.r * m4 + this.g * m5 + this.b * m6,
			this.r * m7 + this.g * m8 + this.b * m9,
		);
	}

	public hueRotate(degrees: number): void {
		const radians = (degrees * Math.PI) / 180;
		const cosR = Math.cos(radians);
		const sinR = Math.sin(radians);

		const rNorm = this.r / 255;
		const gNorm = this.g / 255;
		const bNorm = this.b / 255;

		this.set(
			(rNorm * cosR + gNorm * sinR + bNorm * -sinR) * 255,
			(rNorm * -sinR + gNorm * cosR + bNorm * sinR) * 255,
			(rNorm * sinR + gNorm * -sinR + bNorm * (cosR - sinR)) * 255,
		);
	}

	public hsl(): { h: number; s: number; l: number } {
		const r = this.r / 255;
		const g = this.g / 255;
		const b = this.b / 255;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		let h,
			s,
			l = (max + min) / 2;

		if (max === min) {
			h = s = 0;
		} else {
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

		return { h: h * 360, s: s * 100, l: l * 100 };
	}

	public toHex(): string {
		const rgb = `#${this.r.toString(16).padStart(2, "0")}${this.g.toString(16).padStart(2, "0")}${this.b.toString(16).padStart(2, "0")}`;

		if (this.alpha === 1) {
			return rgb;
		}

		const a = Math.round(this.alpha * 255);
		return `${rgb}${a.toString(16).padStart(2, "0")}`;
	}

	public toHSL(): string {
		const { h, s, l } = this.hsl();
		const cssH = Math.round(h);
		const cssS = Math.round(s);
		const cssL = Math.round(l);

		return this.alpha === 1
			? `hsl(${cssH}, ${cssS}%, ${cssL}%)`
			: `hsla(${cssH}, ${cssS}%, ${cssL}%, ${this.alpha.toFixed(2)})`;
	}

	public toCSS(): string {
		const alpha = this.alpha.toFixed(2);

		return `rgba(${this.r}, ${this.g}, ${this.b}, ${alpha})`;
	}

	public clone(): Color {
		return new Color(this.r, this.g, this.b, this.alpha);
	}
}
