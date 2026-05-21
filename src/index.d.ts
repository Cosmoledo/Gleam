declare namespace GameLIB {
	interface CanvasConstruct {
		canvas: HTMLCanvasElement;
		context: CanvasRenderingContext2D;
	}

	interface CanvasHolder extends CanvasConstruct {
		id: string;
		resize: boolean;
		type: symbol;
	}

	interface Vector2 {
		x: number;
		y: number;
	}

	interface Vector4 extends GameLIB.Vector2 {
		w: number;
		h: number;
	}

	interface Mouse {
		altKey: boolean;
		calcTarget: () => void;
		ctrlKey: boolean;
		hasMoved: boolean;
		posReal: Vec2;
		posRealLast: Vec2;
		posScaled: Vec2;
		posScaledLast: Vec2;
		pressed: boolean[];
		released: boolean[];
		shiftKey: boolean;
		size: Vector2;
		type: symbol;
		target: HTMLElement | null;
		update: (event: MouseEvent) => void;
	}

	interface PolygonCollisionResult {
		intersect: boolean;
		minimumTranslationVector: Vec2;
		willIntersect: boolean;
	}
}

interface CanvasRenderingContext2D {
	drawBar(rect: Rect, amount: number, c1?: string, c2?: string): void;
	drawCircleV2(
		vecPos: GameLIB.Vector2,
		rad: number,
		lineWidth: number,
		strokeStyle?: string,
		amount?: number,
	): void;
	drawCircleV4(
		vecPos: GameLIB.Vector4,
		rad: number,
		lineWidth: number,
		strokeStyle?: string,
		amount?: number,
	): void;
	drawDottedRect(rect: Rect): void;
	drawHpBar(
		pos: GameLIB.Vector2,
		filled?: number,
		offset?: GameLIB.Vector2,
		width?: number,
		height?: number,
		border?: number,
		colors?: string[],
	): void;
	drawLine(x1: number, y1: number, x2: number, y2: number): void;
	drawPartialRoundRect(
		rect: Rect,
		amount: number,
		offsetX?: number,
		offsetY?: number,
	): void;
	drawPolygon(
		polygonCount: number,
		pos: GameLIB.Vector2,
		strokeStyle?: string,
	): void;
	drawRect(
		x: Rect | number,
		strokeStyle?: string,
		y?: number,
		w?: number,
		h?: number,
	): void;
	drawRotated(
		image: HTMLCanvasElement,
		x: number,
		y: number,
		radians: number,
	): void;
	drawTriangle(rect: Rect): void;
	fillCircle(vecPos: GameLIB.Vector2, rad: number, fillStyle?: string): void;
	fillRectObject(rect: Rect): void;
	generateColor(size: number, color: string): void;
	roundRect(
		x: number,
		y: number,
		w: number,
		h: number,
		color?: string,
		padding?: number,
		radius?: number,
		fill?: boolean,
	): void;
	roundRectObject(
		rect: GameLIB.Vector4,
		color: string,
		padding?: number,
		radius?: number,
	): void;
	writeMultilineText(
		text: string,
		x: number,
		y: number,
		width: number,
		color?: string,
		lineOffset?: number,
		maxAttempts?: number,
	): boolean;
	writeText(
		text: string,
		x: number,
		y: number,
		color?: string,
		measureTextOffset?: number,
		font?: string,
	): void;
}

interface HTMLImageElement {
	subImage(x: number, y: number, w?: number, h?: number): HTMLCanvasElement;
	rotateByAligned(radians: number): HTMLCanvasElement;
}

interface HTMLCanvasElement {
	autoCrop(): HTMLCanvasElement;
	clone(): HTMLCanvasElement;
	flipX(offsetX?: number): HTMLCanvasElement;
	flipY(offsetY?: number): HTMLCanvasElement;
	getPixelAt(x: number, y: number, output?: "integer"): number;
	getPixelAt(
		x: number,
		y: number,
		output: "array",
	): [number, number, number, number];
	getPixelAt(
		x: number,
		y: number,
		output: "json",
	): { r: number; g: number; b: number; a: number };
	getPixelAt(x: number, y: number, output: "string"): string;
	replaceColors(replacements: Record<string, string>): HTMLCanvasElement;
	hasAnyColor(): boolean;
	resize(size: number, isWidth?: boolean): HTMLCanvasElement;
	rotateBy(radians: number): HTMLCanvasElement;
	rotateByAligned(radians: number): HTMLCanvasElement;
	scaleBy(scaleX?: number, scaleY?: number): HTMLCanvasElement;
	subImage(x: number, y: number, w?: number, h?: number): HTMLCanvasElement;
	toImage(): HTMLImageElement;
}

interface HTMLAudioElement {
	defaultVolume: number;
	clone(): HTMLAudioElement;
	stop: () => void;
}
