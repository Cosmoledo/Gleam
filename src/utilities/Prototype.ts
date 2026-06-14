type Method<T, K extends keyof T> = T[K] extends (...args: infer A) => infer R
	? (this: T, ...args: A) => R
	: never;

/**
 * Define `name` as a non-enumerable method on `proto`. Carries the declared signature so impl `this` and parameters are inferred from the merged declaration.
 */
export function defineMethod<T, K extends keyof T>(
	proto: T,
	name: K,
	value: Method<T, K>,
): void {
	Object.defineProperty(proto, name, {
		value,
		configurable: true,
		writable: true,
	});
}
