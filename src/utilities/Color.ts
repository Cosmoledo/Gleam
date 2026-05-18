import { clamp } from "@/utilities/Number";

export class Color {
	public r!: number;
	public g!: number;
	public b!: number;
	public alpha: number = 1;

	public static fromHex(hex: string): Color {
		const cleanHex = hex.replace("#", "").toUpperCase();

		if (cleanHex.length === 3) {
			const expanded =
				cleanHex[0] +
				cleanHex[0] +
				cleanHex[1] +
				cleanHex[1] +
				cleanHex[2] +
				cleanHex[2];

			return new Color(
				parseInt(expanded[0], 16),
				parseInt(expanded[1], 16),
				parseInt(expanded[2], 16),
			);
		}

		if (cleanHex.length === 6) {
			const [, r, g, b] = cleanHex.match(/.{1,2}/g)!;

			return new Color(parseInt(r, 16), parseInt(g, 16), parseInt(b, 16));
		}

		if (cleanHex.length === 8) {
			const [, r, g, b, a] = cleanHex.match(/.{1,2}/g)!;

			return new Color(
				parseInt(r, 16),
				parseInt(g, 16),
				parseInt(b, 16),
				parseInt(a, 16) / 255,
			);
		}

		throw new Error(`Invalid hex color: ${hex}`);
	}

	public static fromHSL(h: number, s: number, l: number): Color {
		const hNorm = h / 100;
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
		this.alpha = clamp(a ?? 1, 0, 1);
	}

	public toHex(): string {
		return `#${this.r.toString(16).padStart(2, "0")}${this.g.toString(16).padStart(2, "0")}${this.b.toString(16).padStart(2, "0")}`;
	}

	public invert(factor: number = 1): void {
		this.r = clamp((255 - this.r) * factor, 0, 255);
		this.g = clamp((255 - this.g) * factor, 0, 255);
		this.b = clamp((255 - this.b) * factor, 0, 255);
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

		this.r = Math.round(
			clamp(this.r * m1 + this.g * m2 + this.b * m3, 0, 255),
		);
		this.g = Math.round(
			clamp(this.r * m4 + this.g * m5 + this.b * m6, 0, 255),
		);
		this.b = Math.round(
			clamp(this.r * m7 + this.g * m8 + this.b * m9, 0, 255),
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

		this.r = Math.round(
			clamp(this.r * m1 + this.g * m2 + this.b * m3, 0, 255),
		);
		this.g = Math.round(
			clamp(this.r * m4 + this.g * m5 + this.b * m6, 0, 255),
		);
		this.b = Math.round(
			clamp(this.r * m7 + this.g * m8 + this.b * m9, 0, 255),
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

		this.r = Math.round(
			clamp(this.r * m1 + this.g * m2 + this.b * m3, 0, 255),
		);
		this.g = Math.round(
			clamp(this.r * m4 + this.g * m5 + this.b * m6, 0, 255),
		);
		this.b = Math.round(
			clamp(this.r * m7 + this.g * m8 + this.b * m9, 0, 255),
		);
	}

	public hueRotate(degrees: number): void {
		const radians = (degrees * Math.PI) / 180;
		const cosR = Math.cos(radians);
		const sinR = Math.sin(radians);

		const rNorm = this.r / 255;
		const gNorm = this.g / 255;
		const bNorm = this.b / 255;

		const rPrime = rNorm * cosR + gNorm * sinR + bNorm * -sinR;
		const gPrime = rNorm * -sinR + gNorm * cosR + bNorm * sinR;
		const bPrime = rNorm * sinR + gNorm * -sinR + bNorm * (cosR - sinR);

		this.r = Math.round(rPrime * 255);
		this.g = Math.round(gPrime * 255);
		this.b = Math.round(bPrime * 255);
	}

	public brightness(factor: number): void {
		this.r = Math.round(this.r * factor);
		this.g = Math.round(this.g * factor);
		this.b = Math.round(this.b * factor);
		this.alpha *= factor;
	}

	public contrast(factor: number): void {
		if (this.alpha === 1) {
			const midtone = 128;
			this.r = clamp(
				Math.round(midtone + (this.r - midtone) * factor),
				0,
				255,
			);
			this.g = clamp(
				Math.round(midtone + (this.g - midtone) * factor),
				0,
				255,
			);
			this.b = clamp(
				Math.round(midtone + (this.b - midtone) * factor),
				0,
				255,
			);
		} else {
			this.r *= factor;
			this.g *= factor;
			this.b *= factor;
		}
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

		return { h: h * 100, s: s * 100, l: l * 100 };
	}

	public toCSS(): string {
		const alpha = this.alpha.toFixed(2);

		return `rgba(${this.r}, ${this.g}, ${this.b}, ${alpha})`;
	}

	public clone(): Color {
		return new Color(this.r, this.g, this.b, this.alpha);
	}
}

export function hueToRGB(p: number, q: number, t: number): number {
	if (t < 0) {
		t += 1;
	}

	if (t > 1) {
		t -= 1;
	}

	if (t < 1 / 6) {
		return p + (q - p) * 6 * t;
	}

	if (t < 1 / 2) {
		return q;
	}

	if (t < 2 / 3) {
		return p + (q - p) * (2 / 3 - t) * 6;
	}

	return p;
}
