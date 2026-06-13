export interface CSSVariables {
	root: HTMLElement;
	get(name: string): string;
	set(name: string, value: string): void;
}

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
	Object.assign(element.style, styles);
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
export function initCSSVariables(): CSSVariables {
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
 * Calls `callback` on pointerdown of the matched element, then keeps calling it every `delay` ms
 * until pointerup or pointercancel. Uses pointer capture so the action persists while the cursor
 * drags off the element (and over descendants). Unifies mouse, touch, and pen. Throws if no element
 * matches. Returns a dispose function that removes the listeners and stops any in-flight interval.
 */
export function doWhilePressed(
	querySelector: string,
	callback: () => void,
	delay = 200,
): () => void {
	const element = getElement(querySelector);

	let intervalId: ReturnType<typeof setInterval> | undefined;
	let activePointerId: number | null = null;

	function start(event: PointerEvent): void {
		if (activePointerId !== null) {
			return;
		}

		activePointerId = event.pointerId;
		element.setPointerCapture(activePointerId);

		clearInterval(intervalId);
		callback();
		intervalId = setInterval(() => callback(), delay);
	}

	function stop(event: PointerEvent): void {
		if (event.pointerId !== activePointerId) {
			return;
		}

		clearInterval(intervalId);
		element.releasePointerCapture(event.pointerId);
		activePointerId = null;
	}

	element.addEventListener("pointerdown", start);
	element.addEventListener("pointerup", stop);
	element.addEventListener("pointercancel", stop);

	function dispose(): void {
		element.removeEventListener("pointerdown", start);
		element.removeEventListener("pointerup", stop);
		element.removeEventListener("pointercancel", stop);

		clearInterval(intervalId);
		if (activePointerId !== null) {
			element.releasePointerCapture(activePointerId);
			activePointerId = null;
		}
	}

	return dispose;
}

/**
 * Resolves the next time `type` fires on `element` (one-shot listener). Pass an `AbortSignal`
 * to cancel — rejects with `signal.reason` and removes the listener.
 */
export async function waitForEvent<K extends keyof HTMLElementEventMap>(
	element: HTMLElement,
	type: K,
	signal?: AbortSignal,
): Promise<void> {
	if (signal?.aborted) {
		throw signal.reason;
	}

	return new Promise((resolve, reject) => {
		element.addEventListener(type, () => resolve(), {
			once: true,
			signal,
		});
		signal?.addEventListener("abort", () => reject(signal.reason), {
			once: true,
		});
	});
}
