import Color from "./Color";
import { wrapDegrees } from "@/utilities/Math";
import { wrapValue } from "@/utilities/Number";
import type { RGB } from "@/utilities/Color";

type FilterValues = [
	invert: number,
	sepia: number,
	saturate: number,
	hueRotate: number,
	brightness: number,
	contrast: number,
];

interface SpsaResult {
	values: FilterValues;
	loss: number;
}

const SATURATE = 2;
const HUE_ROTATE = 3;
const BRIGHTNESS = 4;
const CONTRAST = 5;

/**
 * Used when hue-rotate does not work e.g. on dark images
 * Based on https://codepen.io/sosuke/pen/Pjoqqp
 * https://stackoverflow.com/questions/42966641/how-to-transform-black-into-any-given-color-using-only-css-filters/43960991#43960991
 *
 * As the result does vary because of a Math.random(),
 * I would suggest console.log some filters, pick nice ones and hardcode them instead:
 * console.log(colorShifter(randomRgb(1, 10)));
 */
export function colorShifter(rgb: RGB) {
	const color = new Color(rgb[0], rgb[1], rgb[2]);
	const solver = new Solver(color);
	const result = solver.solve();

	return result.filter.replace("filter: ", "").replace(";", "");
}

class Solver {
	private reusedColor: Color;
	private target: Color;
	private targetHSL: {
		h: number;
		s: number;
		l: number;
	};

	constructor(target: Color) {
		this.target = target;
		this.targetHSL = target.toHSLObject();
		this.reusedColor = new Color(0, 0, 0);
	}

	public css(filters: FilterValues): string {
		const [invert, sepia, saturate, hueRotate, brightness, contrast] =
			filters;

		return `filter: invert(${Math.round(invert)}%) sepia(${Math.round(sepia)}%) saturate(${Math.round(saturate)}%) hue-rotate(${Math.round(hueRotate * 3.6)}deg) brightness(${Math.round(brightness)}%) contrast(${Math.round(contrast)}%);`;
	}

	public loss(filters: FilterValues): number {
		const [invert, sepia, saturate, hueRotate, brightness, contrast] =
			filters;
		const color = this.reusedColor;
		color.set(0, 0, 0);

		color.invert(invert / 100);
		color.sepia(sepia / 100);
		color.saturate(saturate / 100);
		color.hueRotate((hueRotate / 100) * Math.PI * 2);
		color.brightness(brightness / 100);
		color.contrast(contrast / 100);

		const colorHSL = color.toHSLObject();

		return (
			Math.abs(color.r - this.target.r) +
			Math.abs(color.g - this.target.g) +
			Math.abs(color.b - this.target.b) +
			// h is cyclic 0-360; wrap diff into ±180 then scale to 0-100 to keep loss balance with the other terms
			Math.abs(wrapDegrees(colorHSL.h - this.targetHSL.h)) / 1.8 +
			Math.abs(colorHSL.s - this.targetHSL.s) +
			Math.abs(colorHSL.l - this.targetHSL.l)
		);
	}

	public solve(): SpsaResult & { filter: string } {
		const result = this.solveNarrow(this.solveWide());

		return {
			values: result.values,
			loss: result.loss,
			filter: this.css(result.values),
		};
	}

	public solveNarrow(wide: SpsaResult): SpsaResult {
		const A = wide.loss;
		const c = 2;
		const A1 = A + 1;
		const a: FilterValues = [
			0.25 * A1,
			0.25 * A1,
			A1,
			0.25 * A1,
			0.2 * A1,
			0.2 * A1,
		];

		return this.spsa(A, a, c, wide.values, 500);
	}

	public solveWide(): SpsaResult {
		const A = 5;
		const c = 15;
		const a: FilterValues = [60, 180, 18000, 600, 1.2, 1.2];

		let best: SpsaResult = {
			loss: Infinity,
			values: [50, 20, 3750, 50, 100, 100],
		};
		for (let i = 0; best.loss > 25 && i < 3; i++) {
			const initial: FilterValues = [50, 20, 3750, 50, 100, 100];
			const result = this.spsa(A, a, c, initial, 1000);
			if (result.loss < best.loss) {
				best = result;
			}
		}

		return best;
	}

	public spsa(
		A: number,
		a: FilterValues,
		c: number,
		values: FilterValues,
		iters: number,
	): SpsaResult {
		values = values.slice() as FilterValues;
		const alpha = 1;
		const gamma = 0.16666666666666666;

		let best: FilterValues = values.slice() as FilterValues;
		let bestLoss = Infinity;
		const deltas: FilterValues = [0, 0, 0, 0, 0, 0];
		const highArgs: FilterValues = [0, 0, 0, 0, 0, 0];
		const lowArgs: FilterValues = [0, 0, 0, 0, 0, 0];

		for (let k = 0; k < iters; k++) {
			const ck = c / Math.pow(k + 1, gamma);
			for (let i = 0; i < 6; i++) {
				deltas[i] = Math.random() > 0.5 ? 1 : -1;
				highArgs[i] = values[i] + ck * deltas[i];
				lowArgs[i] = values[i] - ck * deltas[i];
			}

			const lossDiff = this.loss(highArgs) - this.loss(lowArgs);
			for (let i = 0; i < 6; i++) {
				const g = (lossDiff / (2 * ck)) * deltas[i];
				const ak = a[i] / Math.pow(A + k + 1, alpha);
				values[i] = fix(values[i] - ak * g, i);
			}

			const loss = this.loss(values);
			if (loss < bestLoss) {
				best = values.slice() as FilterValues;
				bestLoss = loss;
			}
		}

		return { values: best, loss: bestLoss };

		function fix(value: number, idx: number): number {
			let max = 100;
			if (idx === SATURATE) {
				max = 7500;
			} else if (idx === BRIGHTNESS || idx === CONTRAST) {
				max = 200;
			}

			if (idx === HUE_ROTATE) {
				value = wrapValue(value, 0, max);
			} else if (value < 0) {
				value = 0;
			} else if (value > max) {
				value = max;
			}

			return value;
		}
	}
}
