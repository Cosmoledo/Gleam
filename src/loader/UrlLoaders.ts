import { createNewCanvas } from "@/utilities/Canvas";

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Validates URL format and protocol before any side effects.
 * Throws on invalid URLs or disallowed protocols.
 */
export function validateUrl(url: string): void {
	const schemeMatch = url.trim().match(/^([a-z][a-z0-9+.-]*):/i);

	if (!schemeMatch) {
		// has no scheme -> relative url -> allow
		return;
	}

	const scheme = schemeMatch[1].toLowerCase();

	if (["blob", "data", "http", "https"].includes(scheme)) {
		// has known scheme -> allow
		return;
	}

	// well, has unknown scheme -> oh oh
	throw new Error(`Invalid URL protocol: ${url}`);
}

/**
 * Safe loading wrapper with global timeout and error handling.
 * Use this for any async loading operation that needs timeout protection.
 * Timeout rejects the returned promise but does not cancel the underlying
 * fetch/Image — the request continues until natural completion. Adding
 * AbortSignal support would require a full rewrite (factory-based API).
 * Maybe a future feature, though.
 */
export function safeLoad<T>(
	promise: Promise<T>,
	url: string,
	operationName: string,
): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout>;

	const timeoutPromise = new Promise<T>((_, reject) => {
		timeoutId = setTimeout(() => {
			reject(
				new Error(
					`Timeout (${DEFAULT_TIMEOUT_MS}ms) when loading ${operationName}: ${url}`,
				),
			);
		}, DEFAULT_TIMEOUT_MS);
	});

	return Promise.race([promise, timeoutPromise])
		.catch((error: Error) => {
			clearTimeout(timeoutId);

			const errorMessage = error?.message || String(error);

			// Log detailed error with file path for debugging
			console.error(
				`${operationName} failed on ${url}\n  ${errorMessage}`,
			);

			// Re-throw wrapped error to be caught by caller
			throw error;
		})
		.finally(() => clearTimeout(timeoutId));
}

/**
 * Loads an image with timeout and error handling
 */
export async function loadImage(url: string): Promise<HTMLImageElement> {
	validateUrl(url);

	return safeLoad(
		new Promise<HTMLImageElement>((resolve, reject): void => {
			const image = new Image();

			image.onload = () => resolve(image);
			image.onerror = () =>
				reject(new Error(`Image failed to load: ${url}`));

			image.crossOrigin = "anonymous";
			image.src = url;
		}),
		url,
		"image",
	);
}

/**
 * Loads a canvas from image URL with error handling
 */
export async function loadCanvas(url: string): Promise<HTMLCanvasElement> {
	validateUrl(url);

	return safeLoad(
		(async () => {
			const image = await loadImage(url);
			const cc = createNewCanvas(image.width, image.height);
			cc.canvas.id = url;
			cc.context.drawImage(image, 0, 0);
			return cc.canvas;
		})(),
		url,
		"canvas",
	);
}

/**
 * Loads text content from URL with error handling
 */
export async function loadText(url: string): Promise<string> {
	validateUrl(url);

	return safeLoad(
		(async () => {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(
					`HTTP ${response.status}: Failed to load text from ${url}\n  Status: ${response.status} ${response.statusText}`,
				);
			}

			return response.text();
		})(),
		url,
		"text",
	);
}

/**
 * Loads JSON data from URL with error handling
 */
export async function loadJson<T = unknown>(url: string): Promise<T> {
	validateUrl(url);

	return safeLoad(
		loadText(url).then(text => JSON.parse(text) as T),
		url,
		"JSON",
	);
}

/**
 * Loads JSON with inline comments
 */
export async function loadJsonCommented<T = unknown>(url: string): Promise<T> {
	validateUrl(url);

	return safeLoad(
		loadText(url).then(text => {
			// strips lines starting with //
			const lines = text
				.split("\n")
				.filter(line => {
					const trimmed = line.trim();
					if (!trimmed || trimmed.startsWith("//")) {
						return false;
					}
					return true;
				})
				.join("\n");

			return JSON.parse(lines) as T;
		}),
		url,
		"JSON (commented)",
	);
}

interface SpriteJson {
	x: number;
	y: number;
	w: number;
	h: number;
	name: string;
	[key: string]: string | number;
}

interface SpriteJsonFile {
	options: { file: string };
	sprites: SpriteJson[];
}

/**
 * Loads image sprites from JSON configuration with error handling
 */
export async function loadImageFromJson(
	baseUrl: string,
	filenameOrJson: string,
	jsonInput = false,
): Promise<Record<string, HTMLCanvasElement>> {
	if (!baseUrl.endsWith("/")) {
		baseUrl += "/";
	}

	let json: SpriteJsonFile;

	// Handle both inline JSON and file loading cases
	if (jsonInput) {
		try {
			json = JSON.parse(filenameOrJson) as SpriteJsonFile;
		} catch (parseError) {
			throw new Error(
				`Failed to parse inline JSON: ${(parseError as SyntaxError).message}`,
			);
		}
	} else {
		const url = baseUrl + filenameOrJson + ".json";

		json = await loadJson<SpriteJsonFile>(url);
	}

	// Handle JSON parsing errors gracefully
	if (!json || !json.options?.file) {
		const source = jsonInput
			? "inline JSON"
			: `${baseUrl}${filenameOrJson}.json`;

		throw new Error(
			`JSON missing 'options.file' property\n  Source: ${source}`,
		);
	}

	const canvas = await loadCanvas(baseUrl + json.options.file);
	const sprites: Record<string, HTMLCanvasElement> = {};

	if (!json.sprites || !Array.isArray(json.sprites)) {
		throw new Error(
			`JSON missing 'sprites' array\n  Source: ${baseUrl}${filenameOrJson}.json`,
		);
	}

	json.sprites.forEach((sprite, i) => {
		if (
			sprite.x === undefined ||
			sprite.y === undefined ||
			!sprite.w ||
			!sprite.h ||
			!sprite.name
		) {
			throw new Error(
				`Invalid sprite data at index ${i}: ${JSON.stringify(sprite, null, 2)}`,
			);
		}

		const newSprite = canvas.subImage(
			sprite.x,
			sprite.y,
			sprite.w,
			sprite.h,
		);

		for (const key in sprite) {
			newSprite.dataset[key] = String(sprite[key]);
		}

		sprites[sprite.name] = newSprite;
	});

	return sprites;
}

/**
 * Loads multiple resources concurrently with error handling
 */
export async function loadBunch<T extends Record<string, Promise<unknown>>>(
	bunch: T,
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
	const output = {} as { [K in keyof T]: Awaited<T[K]> };
	const keys = Object.keys(bunch) as (keyof T)[];

	return Promise.all(keys.map(k => bunch[k])).then(datas => {
		keys.forEach((key, i) => {
			output[key] = datas[i];
		});

		return output;
	});
}
