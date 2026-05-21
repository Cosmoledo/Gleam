/**
 * `querySelector` variant that throws when no element matches.
 * Optionally narrow the return type per tag, e.g. `getElement<HTMLCanvasElement>("canvas")`.
 */
export function getElement<T extends Element = HTMLElement>(
	query: string,
	parent: ParentNode = document,
): T {
	const el = parent.querySelector<T>(query);
	if (!el) {
		throw new Error(`Element not found: ${query}`);
	}
	return el;
}

/**
 * Apply a partial `CSSStyleDeclaration` to an element.
 */
export function styleElement(
	element: HTMLElement,
	styles: Partial<CSSStyleDeclaration>,
): void {
	for (const [key, value] of Object.entries(styles)) {
		element.style.setProperty(key, value as string);
	}
}

/**
 * Toggle `element.style.display` between `""` (active) and `"none"` (inactive).
 */
export function setDisplay(element: HTMLElement, active: boolean): void {
	element.style.display = active ? "" : "none";
}

/**
 * Toggle `element.style.visibility` between `""` (active) and `"hidden"` (inactive).
 */
export function setVisibility(element: HTMLElement, active: boolean): void {
	element.style.visibility = active ? "" : "hidden";
}

/**
 * Returns `get` / `set` helpers for CSS custom properties (`--name`) on the `:root` element.
 */
export function initCSSVariables() {
	const root = getElement(":root");

	return {
		root,
		get(name: string): string {
			return getComputedStyle(root).getPropertyValue("--" + name);
		},
		set(name: string, value: string): void {
			root.style.setProperty("--" + name, value);
		},
	};
}

/**
 * Call `callback` immediately on mousedown of the matched element, then keep
 * calling it every `delay` ms until mouseup or mouseout. Throws if no element matches.
 */
export function doWhileClicked(
	querySelector: string,
	callback: () => void,
	delay = 200,
): void {
	const element = getElement(querySelector);

	let timeout: ReturnType<typeof setInterval>;

	element.addEventListener(
		"mousedown",
		() => {
			callback();
			timeout = setInterval(() => callback(), delay);
		},
		false,
	);
	element.addEventListener("mouseup", () => clearInterval(timeout), false);
	element.addEventListener("mouseout", () => clearInterval(timeout), false);
}

/**
 * Resolves the next time `type` fires on `element` (one-shot listener).
 */
export async function waitForEvent<K extends keyof HTMLElementEventMap>(
	type: K,
	element: Element,
): Promise<void> {
	return new Promise(res =>
		element.addEventListener(type, () => res(), {
			once: true,
		}),
	);
}
