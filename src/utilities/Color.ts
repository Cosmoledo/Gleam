import { randomBeetweenInt } from "./Math";

/**
 * Convert an `(r, g, b)` triple (0-255) to a `#rrggbb` hex string.
 * Low-level; prefer `Color.toHex()` outside hot per-pixel loops.
 */
export function rgb2hex(red: number, green: number, blue: number): string {
	return (
		"#" +
		(0x1000000 + (blue | (green << 8) | (red << 16))).toString(16).slice(1)
	);
}

/**
 * Convert a `#rgb` or `#rrggbb` hex string to an `[r, g, b]` integer array.
 * Low-level; prefer `Color.fromHex()` outside hot per-pixel loops.
 */
export function hex2rgb(hex: string): number[] {
	return hex
		.replace(
			/^#?([a-f\d])([a-f\d])([a-f\d])$/i,
			(_: string, r: string, g: string, b: string) =>
				"#" + r + r + g + g + b + b,
		)
		.substring(1)
		.match(/.{2}/g)!
		.map((x: string) => parseInt(x, 16));
}

/**
 * HSL → RGB channel helper used by `Color.fromHSL`. Inputs are normalized to `[0, 1]`.
 */
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

/**
 * Random `#rgb` short hex color.
 */
export function randomHex(): string {
	return "#" + Math.random().toString(16).slice(2, 6);
}

/**
 * Random `[r, g, b]` integer array; each channel uniform in `[min, max]`.
 */
export function randomRgb(min = 0, max = 255): number[] {
	return new Array(3).fill(0).map(() => randomBeetweenInt(min, max));
}
