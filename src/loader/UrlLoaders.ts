import { createNewCanvas } from "@/utilities/Canvas";

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Validates URL format and protocol before any side effects.
 * Throws on invalid URLs or disallowed protocols.
 */
export function validateUrl(url: string): void {
	const trimmed = url.trim();

	if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
		return; // data: and blob: URLs are allowed
	}

	if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
		throw new Error(`Invalid URL format: ${url}`);
	}
}

/**
 * Safe loading wrapper with global timeout and error handling
 * Use this for any async loading operation that needs timeout protection
 * @param promise The promise to wrap
 * @param url The URL being loaded (for error messages)
 * @param operationName Name of the operation for logging
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

			try {
				image.src = url;
				image.id = url;
			} catch (e) {
				reject(e);
			}
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
	nameOrJson: string,
	jsonInput = false,
): Promise<Record<string, HTMLCanvasElement>> {
	if (!baseUrl.endsWith("/")) {
		baseUrl += "/";
	}

	let json: SpriteJsonFile;

	// Handle both inline JSON and file loading cases
	if (jsonInput) {
		if (typeof nameOrJson !== "string") {
			throw new Error(
				`'nameOrJson' must be a string when jsonInput=true, got: ${typeof nameOrJson}`,
			);
		}

		try {
			json = JSON.parse(nameOrJson) as SpriteJsonFile;
		} catch (parseError) {
			throw new Error(
				`Failed to parse inline JSON: ${(parseError as SyntaxError).message}`,
			);
		}
	} else {
		const url = baseUrl + nameOrJson + ".json";

		validateUrl(url);
		json = await loadJson<SpriteJsonFile>(url);
	}

	// Handle JSON parsing errors gracefully
	if (!json || !json.options?.file) {
		const source = jsonInput
			? "inline JSON"
			: `${baseUrl}${nameOrJson}.json`;

		throw new Error(
			`JSON missing 'options.file' property\n  Source: ${source}`,
		);
	}

	validateUrl(baseUrl + json.options.file);
	const canvas = await loadCanvas(baseUrl + json.options.file);
	const sprites: Record<string, HTMLCanvasElement> = {};

	if (!json.sprites || !Array.isArray(json.sprites)) {
		throw new Error(
			`JSON missing 'sprites' array\n  Source: ${baseUrl}${nameOrJson}.json`,
		);
	}

	for (let i = 0; i < json.sprites.length; i++) {
		const sprite = json.sprites[i];
		// Validate sprite properties before processing
		if (!sprite.x || !sprite.y || !sprite.w || !sprite.h || !sprite.name) {
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
	}

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

	return Promise.all(Object.values(bunch)).then(datas => {
		datas.forEach((data, index) => {
			output[keys[index]] = data as Awaited<T[keyof T]>;
		});
		return output;
	});
}
