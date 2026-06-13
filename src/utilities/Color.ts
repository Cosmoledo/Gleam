import { randomBetweenInt } from "./Math";

export type RGB = [number, number, number];

/**
 * Convert an `(r, g, b)` triple (0-255) to a `#rrggbb` hex string.
 * Low-level; prefer `Color.toHex()` outside hot per-pixel loops.
 */
export function rgb2hex(red: number, green: number, blue: number): string {
	return "#" + (0x1000000 + rgb2Int(red, green, blue)).toString(16).slice(1);
}

/**
 * Pack `(r, g, b[, a])` channels into a single integer key.
 * RGB are 0-255. Alpha is 0-1 (CSS convention); divide canvas byte-alpha by 255 before passing.
 * Without alpha: 24-bit `RGB`. With alpha: 32-bit `RGBA` (forced unsigned).
 * Useful for fast per-pixel lookups: cheaper than building a hex string.
 */
export function rgb2Int(
	red: number,
	green: number,
	blue: number,
	alpha?: number,
): number {
	if (alpha === undefined) {
		return (red << 16) | (green << 8) | blue;
	}

	const a = Math.round(alpha * 255);
	return ((red << 24) | (green << 16) | (blue << 8) | a) >>> 0;
}

/**
 * Convert a `#rgb` or `#rrggbb` hex string to an `[r, g, b]` integer tuple.
 * Low-level; prefer `Color.fromHex()` outside hot per-pixel loops. Caller must pass a valid hex string.
 */
export function hex2rgb(hex: string): RGB {
	return hex
		.replace(
			/^#?([a-f\d])([a-f\d])([a-f\d])$/i,
			(_: string, r: string, g: string, b: string) =>
				"#" + r + r + g + g + b + b,
		)
		.substring(1)
		.match(/.{2}/g)!
		.map((x: string) => parseInt(x, 16)) as RGB;
}

/**
 * HSL → RGB channel helper used by `Color.fromHSL`. Inputs are normalized to `[0, 1]`.
 */
export function hue2rgb(p: number, q: number, t: number): number {
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
	// Can in theory return <4 hex digits if Math.random() lands on a value with trailing zeros (probability ≈ 2^-40).
	return "#" + Math.random().toString(16).slice(2, 6);
}

/**
 * Random `[r, g, b]` integer tuple; each channel uniform in `[min, max]`.
 */
export function randomRgb(min = 0, max = 255): RGB {
	return [
		randomBetweenInt(min, max),
		randomBetweenInt(min, max),
		randomBetweenInt(min, max),
	];
}
