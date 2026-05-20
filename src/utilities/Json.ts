/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Recursively clone a value. Returns primitives and functions as-is (no copy).
 * Handles cyclic references via the `hash` WeakMap, plus `Map` and `Set` instances.
 * Attempts to preserve the prototype chain by calling `new obj.constructor()`;
 * falls back to `Object.create(Object.getPrototypeOf(obj))` if the constructor requires args.
 */
export function deepClone<T>(obj: any, hash = new WeakMap()): T {
	// Do not try to clone primitives or functions
	if (Object(obj) !== obj || obj instanceof Function) {
		return obj;
	}

	// Cyclic reference
	if (hash.has(obj)) {
		return hash.get(obj);
	}

	let result: any;
	try {
		// Try to run constructor (without arguments, as we don't know them)
		result = new obj.constructor();
	} catch (_e) {
		// Constructor failed, create object without running the constructor
		result = Object.create(Object.getPrototypeOf(obj));
	}

	// Optional: support for some standard constructors (extend as desired)
	if (obj instanceof Map) {
		Array.from(obj, ([key, val]) =>
			result.set(deepClone(key, hash), deepClone(val, hash)),
		);
	} else if (obj instanceof Set) {
		Array.from(obj, key => result.add(deepClone(key, hash)));
	}

	// Register in hash
	hash.set(obj, result);

	// Clone and assign enumerable own properties recursively
	return Object.assign(
		result,
		...Object.keys(obj).map(key => ({
			[key]: deepClone(obj[key], hash),
		})),
	);
}
