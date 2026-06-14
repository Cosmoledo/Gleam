/**
 * Recursively clone a value. Returns primitives and functions as-is (no copy).
 * Cyclic references resolve via an internal `WeakMap`. Explicit branches preserve
 * `Date`, `RegExp`, `Map`, `Set`, `Array`, `ArrayBuffer`, typed arrays, and `DataView`.
 * For plain objects / class instances the prototype is preserved via
 * `Object.create(...)` — the original constructor is *not* called, so no side
 * effects fire. Symbol keys and non-enumerable data properties are carried via descriptors.
 * Own accessor properties (`get`/`set`) are snapshotted to a data property by invoking
 * the getter on the source; this severs any closure binding to the original instance
 * but also drops live computation on the clone.
 */
export function deepClone<T>(obj: T): T {
	return cloneInternal(obj, new WeakMap<object, unknown>());
}

function cloneInternal<T>(obj: T, hash: WeakMap<object, unknown>): T {
	if (Object(obj) !== obj || obj instanceof Function) {
		// primitive or function -> return as-is
		return obj;
	}

	const o = obj as object;

	if (hash.has(o)) {
		// cycle / already cloned -> return cached
		return hash.get(o) as T;
	}

	if (obj instanceof Date) {
		// date -> clone via getTime
		const cloned = new Date(obj.getTime());
		hash.set(o, cloned);
		return cloned as T;
	}

	if (obj instanceof RegExp) {
		// regex -> clone source + flags + lastIndex
		const cloned = new RegExp(obj.source, obj.flags);
		cloned.lastIndex = obj.lastIndex;
		hash.set(o, cloned);
		return cloned as T;
	}

	if (obj instanceof Map) {
		// map -> recurse into entries
		const cloned = new Map<unknown, unknown>();
		hash.set(o, cloned);
		obj.forEach((v, k) => {
			cloned.set(cloneInternal(k, hash), cloneInternal(v, hash));
		});
		return cloned as T;
	}

	if (obj instanceof Set) {
		// set -> recurse into items
		const cloned = new Set<unknown>();
		hash.set(o, cloned);
		obj.forEach(v => {
			cloned.add(cloneInternal(v, hash));
		});
		return cloned as T;
	}

	if (Array.isArray(obj)) {
		// array -> recurse into items
		const cloned: unknown[] = [];
		hash.set(o, cloned);
		obj.forEach((item, i) => {
			cloned[i] = cloneInternal(item, hash);
		});
		return cloned as T;
	}

	if (obj instanceof ArrayBuffer) {
		// arraybuffer -> slice
		const cloned = obj.slice(0);
		hash.set(o, cloned);
		return cloned as T;
	}

	if (obj instanceof DataView) {
		// dataview -> reslice underlying buffer
		const buf = obj.buffer.slice(
			obj.byteOffset,
			obj.byteOffset + obj.byteLength,
		);
		const cloned = new DataView(buf);
		hash.set(o, cloned);
		return cloned as T;
	}

	if (ArrayBuffer.isView(obj)) {
		// typed array -> slice (preserves subtype)
		const cloned = (obj as unknown as Uint8Array).slice();
		hash.set(o, cloned);
		return cloned as T;
	}

	const result = Object.create(Object.getPrototypeOf(o));
	hash.set(o, result);

	Reflect.ownKeys(o).forEach(key => {
		const descriptor = Object.getOwnPropertyDescriptor(o, key)!;
		if ("value" in descriptor) {
			descriptor.value = cloneInternal(descriptor.value, hash);
			Object.defineProperty(result, key, descriptor);
			return;
		}
		// Accessor (get/set) — snapshot by invoking the getter on the source to
		// avoid closure-bound captures of the original instance. The clone gets
		// a plain data property; live computation is lost.
		const snapshot = cloneInternal(
			(o as Record<PropertyKey, unknown>)[key as PropertyKey],
			hash,
		);
		Object.defineProperty(result, key, {
			value: snapshot,
			writable: true,
			enumerable: descriptor.enumerable,
			configurable: descriptor.configurable,
		});
	});

	return result as T;
}
