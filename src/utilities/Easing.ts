/**
 * Quadratic ease-in (slow start, accelerates).
 */
export function easeIn(t: number): number {
	return t * t;
}

/**
 * Quadratic ease-in-out (accelerates, then decelerates).
 */
export function easeInOut(t: number): number {
	return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
}

/**
 * Quadratic ease-out (fast start, decelerates).
 */
export function easeOut(t: number): number {
	return t * (2 - t);
}

/**
 * Identity (constant rate of change).
 */
export function linear(t: number): number {
	return t;
}

export type EasingName = "ease-in" | "ease-in-out" | "ease-out" | "linear";

export const EASINGS: Record<EasingName, (t: number) => number> = {
	"ease-in": easeIn,
	"ease-in-out": easeInOut,
	"ease-out": easeOut,
	linear: linear,
};
