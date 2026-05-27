/**
 * Recursively clone a value. Returns primitives and functions as-is (no copy).
 * Cyclic references resolve via the `hash` WeakMap. Explicit branches preserve
 * `Date`, `RegExp`, `Map`, `Set`, `Array`, `ArrayBuffer`, and typed arrays.
 * For plain objects / class instances the prototype is preserved via
 * `Object.create(...)` — the original constructor is *not* called, so no side
 * effects fire. Symbol keys and accessor properties are carried via descriptors.
 */
export function deepClone<T>(obj: T, hash = new WeakMap<object, unknown>()): T {
	// Primitives and functions pass through unchanged.
	if (Object(obj) !== obj || obj instanceof Function) {
		return obj;
	}

	const o = obj as object;

	// Cyclic reference: return the in-progress clone.
	if (hash.has(o)) {
		return hash.get(o) as T;
	}

	if (obj instanceof Date) {
		const cloned = new Date(obj.getTime());
		hash.set(o, cloned);
		return cloned as T;
	}

	if (obj instanceof RegExp) {
		const cloned = new RegExp(obj.source, obj.flags);
		cloned.lastIndex = obj.lastIndex;
		hash.set(o, cloned);
		return cloned as T;
	}

	if (obj instanceof Map) {
		const cloned = new Map<unknown, unknown>();
		hash.set(o, cloned);
		obj.forEach((v, k) => {
			cloned.set(deepClone(k, hash), deepClone(v, hash));
		});
		return cloned as T;
	}

	if (obj instanceof Set) {
		const cloned = new Set<unknown>();
		hash.set(o, cloned);
		obj.forEach(v => {
			cloned.add(deepClone(v, hash));
		});
		return cloned as T;
	}

	if (Array.isArray(obj)) {
		const cloned: unknown[] = [];
		hash.set(o, cloned);
		obj.forEach((item, i) => {
			cloned[i] = deepClone(item, hash);
		});
		return cloned as T;
	}

	if (obj instanceof ArrayBuffer) {
		const cloned = obj.slice(0);
		hash.set(o, cloned);
		return cloned as T;
	}

	if (ArrayBuffer.isView(obj) && !(obj instanceof DataView)) {
		// Typed array (Uint8Array, Int32Array, etc.). `.slice()` preserves the subtype.
		const cloned = (obj as unknown as Uint8Array).slice();
		hash.set(o, cloned);
		return cloned as T;
	}

	// Plain object or class instance — preserve prototype without running the constructor.
	const result = Object.create(Object.getPrototypeOf(o));
	hash.set(o, result);

	// `Reflect.ownKeys` catches symbol keys; descriptor copy keeps accessor
	// properties and non-enumerable flags intact.
	Reflect.ownKeys(o).forEach(key => {
		const descriptor = Object.getOwnPropertyDescriptor(o, key)!;
		if ("value" in descriptor) {
			descriptor.value = deepClone(descriptor.value, hash);
		}
		Object.defineProperty(result, key, descriptor);
	});

	return result as T;
}
