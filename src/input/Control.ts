/**
 * Shared contract for the digital (on/off) facet of an input source: a set of addressable controls — keys, mouse/gamepad buttons — each identified by `T` that can be queried, consumed, and reset. Implemented by {@link Keyboard} (`T` = key code), {@link Pointer}, and {@link Controller} (`T` = button index). Analog state (pointer position, gamepad sticks) lives on the implementers, not here.
 *
 * Note: distinct from the {@link Controller} class (the gamepad). A `Control` is one addressable input on any source; a `Controller` is one such source.
 */
export interface Control<T> {
	/** Mark every tracked control as released so held state doesn't stay live across focus loss. Called automatically on the input source's lifecycle events (`window` blur and others) — which events fire it is the input source's concern and is documented on each implementer's override. */
	reset(): void;

	/** Request that `id` stop surfacing as active — the one-shot "consume" so a still-held control doesn't re-trigger an action every tick. How this is achieved, how long it holds before the live state re-asserts it, and whether it's reliably possible at all are the input source's concern and are documented on each implementer's override. */
	stop(id: T): void;

	/** `true` when the control is active. Safe for untouched unknown controls (returns `false` rather than `undefined`). */
	isActive(id: T): boolean;
}
