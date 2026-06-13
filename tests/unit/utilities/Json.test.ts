import { describe, expect, it } from "vitest";

// ==================== Imports ====================

import { deepClone } from "@/utilities/Json";

// ==================== deepClone ====================

describe("deepClone", () => {
	it("returns primitives as-is", () => {
		expect(deepClone(42)).toBe(42);
		expect(deepClone("hello")).toBe("hello");
		expect(deepClone(true)).toBe(true);
		expect(deepClone(null)).toBe(null);
		expect(deepClone(undefined)).toBe(undefined);
		const sym = Symbol("id");
		expect(deepClone(sym)).toBe(sym);
	});

	it("returns functions as-is", () => {
		const fn = () => {};
		expect(deepClone(fn)).toBe(fn);
	});

	it("returns RegExp as a new instance with same source and flags", () => {
		const re = /foo/gi;
		const cloned = deepClone(re);
		expect(cloned).not.toBe(re);
		expect(cloned).toStrictEqual(re);
	});

	it("returns Date as a new instance with the same time", () => {
		const d = new Date("2024-01-15T12:00:00Z");
		const cloned = deepClone(d);
		expect(cloned).not.toBe(d);
		expect(cloned.getTime()).toBe(d.getTime());
	});

	it("returns RegExp as a new instance with same source and flags", () => {
		const re = /test/gi;
		const cloned = deepClone(re);
		expect(cloned).not.toBe(re);
		expect(cloned.source).toBe("test");
		expect(cloned.flags).toBe("gi");
		expect(cloned.lastIndex).toBe(re.lastIndex);
	});

	it("returns DataView as a new copy with independent buffer", () => {
		const buf = new ArrayBuffer(8);
		const view = new DataView(buf);
		view.setUint32(0, 42);
		const cloned = deepClone(view);
		expect(cloned).not.toBe(view);
		expect(cloned instanceof DataView).toBe(true);
		expect(cloned.getUint32(0)).toBe(42);
		// Mutating the clone must not affect the source.
		cloned.setUint32(0, 7);
		expect(view.getUint32(0)).toBe(42);
	});

	it("returns ArrayBuffer as a new copy", () => {
		const buf = new ArrayBuffer(8);
		const view = new DataView(buf);
		view.setUint32(0, 42);
		const cloned = deepClone(buf);
		expect(cloned).not.toBe(buf);
		expect(cloned.byteLength).toBe(buf.byteLength);
		expect(view.getUint32(0)).toBe(42);
	});

	it("returns typed arrays as new copies", () => {
		const arr = new Uint8Array([1, 2, 3]);
		const cloned = deepClone(arr);
		expect(cloned).not.toBe(arr);
		expect(cloned instanceof Uint8Array).toBe(true);
		expect(cloned[0]).toBe(1);
		expect(cloned[1]).toBe(2);
		expect(cloned[2]).toBe(3);
	});

	it("returns Int32Array as a new copy", () => {
		const arr = new Int32Array([-1, 0, 1]);
		const cloned = deepClone(arr);
		expect(cloned).not.toBe(arr);
		expect(cloned instanceof Int32Array).toBe(true);
		expect(cloned[0]).toBe(-1);
	});

	it("returns Float64Array as a new copy", () => {
		const arr = new Float64Array([1.5, 2.5, 3.5]);
		const cloned = deepClone(arr);
		expect(cloned).not.toBe(arr);
		expect(cloned instanceof Float64Array).toBe(true);
		expect(cloned[0]).toBe(1.5);
	});

	it("clones a Map with deep-cloned keys and values", () => {
		const map = new Map([["key", "value"]]);
		const cloned = deepClone(map);
		expect(cloned).not.toBe(map);
		expect(cloned.get("key")).toBe("value");
	});

	it("clones a Set with deep-cloned values", () => {
		const set = new Set([1, 2]);
		const cloned = deepClone(set);
		expect(cloned).not.toBe(set);
		expect(cloned.has(1)).toBe(true);
		expect(cloned.has(2)).toBe(true);
	});

	it("clones a plain object", () => {
		const obj = { a: 1, b: "two" };
		const cloned = deepClone(obj);
		expect(cloned).not.toBe(obj);
		expect(cloned).toEqual({ a: 1, b: "two" });
	});

	it("clones a nested object", () => {
		const obj = { a: { b: { c: 3 } } };
		const cloned = deepClone(obj);
		expect(cloned).not.toBe(obj);
		expect(cloned.a).not.toBe(obj.a);
		expect(cloned.a.b).not.toBe(obj.a.b);
		expect(cloned.a.b.c).toBe(3);
	});

	it("clones an array", () => {
		const arr = [1, "two", true];
		const cloned = deepClone(arr);
		expect(cloned).not.toBe(arr);
		expect(cloned).toEqual([1, "two", true]);
	});

	it("clones a nested array", () => {
		const arr = [
			[1, 2],
			[3, 4],
		];
		const cloned = deepClone(arr);
		expect(cloned).not.toBe(arr);
		expect(cloned[0]).not.toBe(arr[0]);
		expect(cloned).toEqual([
			[1, 2],
			[3, 4],
		]);
	});

	it("clones an array containing objects", () => {
		const arr = [{ x: 1 }, { x: 2 }];
		const cloned = deepClone(arr);
		expect(cloned[0]).not.toBe(arr[0]);
		expect(cloned[1]).not.toBe(arr[1]);
		expect(cloned).toEqual([{ x: 1 }, { x: 2 }]);
	});

	it("handles sparse arrays", () => {
		const arr: unknown[] = [];
		arr[0] = 1;
		arr[2] = 3;
		const cloned = deepClone(arr);
		expect(cloned[0]).toBe(1);
		expect(cloned[2]).toBe(3);
		expect(cloned.length).toBe(3);
		expect(0 in cloned).toBe(true);
		expect(2 in cloned).toBe(true);
	});

	it("handles empty inputs", () => {
		expect(deepClone({})).toEqual({});
		expect(deepClone([])).toEqual([]);
	});

	it("handles cyclic references in objects", () => {
		const obj: Record<string, unknown> = { a: 1 };
		obj.self = obj;
		const cloned = deepClone(obj);
		expect(cloned.a).toBe(1);
		expect(cloned.self).toBe(cloned);
		expect(cloned.self).not.toBe(obj);
	});

	it("handles cyclic references in arrays", () => {
		const arr: unknown[] = [1];
		arr.push(arr);
		const cloned = deepClone(arr);
		expect(cloned[0]).toBe(1);
		expect(cloned[1]).toBe(cloned);
		expect(cloned[1]).not.toBe(arr);
	});

	it("handles deep cyclic references", () => {
		const a: Record<string, unknown> = { name: "a" };
		const b: Record<string, unknown> = { name: "b", sibling: a };
		a.child = b;
		const cloned = deepClone(a) as Record<string, unknown> & {
			child: { name: string; sibling: unknown };
		};
		expect(cloned.name).toBe("a");
		expect(cloned.child.name).toBe("b");
		expect(cloned.child.sibling).toBe(cloned);
	});

	it("handles cyclic Map keys", () => {
		const map = new Map();
		map.set("key", map);
		const cloned = deepClone(map);
		expect(cloned.get("key")).toBe(cloned);
	});

	it("handles cyclic Set values", () => {
		const set = new Set();
		const obj = { val: 1 };
		set.add(obj);
		set.add(set);
		const cloned = deepClone(set);
		expect(cloned.has(set)).toBe(false);
		expect(cloned.has(cloned)).toBe(true);
	});

	it("preserves object prototype", () => {
		class Foo {
			x: number;
			constructor(x: number) {
				this.x = x;
			}
		}
		const foo = new Foo(10);
		const cloned = deepClone(foo);
		expect(cloned instanceof Foo).toBe(true);
		expect(cloned).not.toBe(foo);
		expect(cloned.x).toBe(10);
	});

	it("preserves prototype chain", () => {
		class Bar {
			foo(): string {
				return "bar";
			}
		}
		class Baz extends Bar {
			baz: number;
			constructor(baz: number) {
				super();
				this.baz = baz;
			}
		}
		const baz = new Baz(42);
		const cloned = deepClone(baz);
		expect(cloned instanceof Baz).toBe(true);
		expect(cloned instanceof Bar).toBe(true);
		expect(cloned.baz).toBe(42);
		expect(cloned.foo()).toBe("bar");
	});

	it("does not run the constructor on cloned class instances", () => {
		let ctorCallCount = 0;
		class Counter {
			constructor() {
				ctorCallCount++;
			}
		}
		const instance = new (class extends Counter {})();
		deepClone(instance);
		expect(ctorCallCount).toBe(1);
	});

	it("clones symbol-keyed properties", () => {
		const sym = Symbol("key");
		const obj = { [sym]: "symbol value", normal: 1 };
		const cloned = deepClone(obj);
		expect(cloned[sym]).toBe("symbol value");
		expect(cloned.normal).toBe(1);
	});

	it("snapshots accessor properties to data, severing closure binding to source", () => {
		let _val = 10;
		const obj = {
			get val() {
				return _val;
			},
			set val(v: number) {
				_val = v;
			},
		};
		const cloned = deepClone(obj);
		expect(cloned.val).toBe(10);
		cloned.val = 20;
		expect(cloned.val).toBe(20);
		// Original is unaffected by mutation through the clone (snapshot semantics).
		expect(_val).toBe(10);
		expect(obj.val).toBe(10);
	});

	it("snapshots own accessor that closes over the original instance via arrow", () => {
		const original = { _val: 5 } as { _val: number; foo?: number };
		Object.defineProperty(original, "foo", {
			get: () => original._val,
			enumerable: true,
			configurable: true,
		});
		const cloned = deepClone(original);
		expect(cloned.foo).toBe(5);
		// Mutating the original must not reach through the clone.
		original._val = 99;
		expect(cloned.foo).toBe(5);
	});

	it("clones non-enumerable properties", () => {
		const obj: Record<string | symbol, unknown> = {};
		Object.defineProperty(obj, "hidden", {
			value: "secret",
			enumerable: false,
			writable: true,
			configurable: true,
		});
		const cloned = deepClone(obj);
		expect(cloned.hidden).toBe("secret");
		expect(Object.keys(cloned)).not.toContain("hidden");
	});

	it("clones writable/configurable descriptors", () => {
		const obj: Record<string, unknown> = {};
		Object.defineProperty(obj, "prop", {
			value: "value",
			writable: true,
			configurable: true,
			enumerable: true,
		});
		const cloned = deepClone(obj);
		expect(cloned.prop).toBe("value");
	});

	it("does not mutate the original object", () => {
		const obj = { a: { b: 2 }, arr: [1, 2] };
		const cloned = deepClone(obj);
		cloned.a.b = 99;
		cloned.arr.push(3);
		expect(obj.a.b).toBe(2);
		expect(obj.arr).toEqual([1, 2]);
	});

	it("returns cloned array as a new array", () => {
		const arr = [1, 2, 3];
		const cloned = deepClone(arr);
		expect(Array.isArray(cloned)).toBe(true);
		expect(cloned).not.toBe(arr);
	});

	it("clones mixed nested structures", () => {
		const obj = {
			arr: [
				{ date: new Date("2024-01-01") },
				new Map([["k", "v"]]),
				new Set([1, 2]),
			],
			map: new Map([["nested", { x: 1 }]]),
			set: new Set([{ y: 2 }]),
			buf: new ArrayBuffer(4),
			typed: new Uint8Array([10, 20]),
		};
		const cloned = deepClone(obj);
		expect((cloned.arr[0] as { date: Date }).date.getTime()).toBe(
			(obj.arr[0] as { date: Date }).date.getTime(),
		);
		expect((cloned.arr[0] as { date: Date }).date).not.toBe(
			(obj.arr[0] as { date: Date }).date,
		);
		expect(cloned.map.get("nested")).not.toBe(obj.map.get("nested"));
		expect(cloned.map.get("nested")).toEqual({ x: 1 });
		expect(cloned.typed[0]).toBe(10);
		expect(cloned.typed).not.toBe(obj.typed);
		expect(cloned.buf).not.toBe(obj.buf);
	});

	it("handles deeply nested plain objects", () => {
		let current: Record<string, unknown> = { level: 0 };
		let root = current;
		for (let i = 1; i <= 50; i++) {
			current.child = { level: i };
			current = current.child as Record<string, unknown>;
		}
		const cloned = deepClone(root);
		let node = cloned as Record<string, unknown>;
		let depth = 0;
		while (node) {
			depth++;
			node = (node as Record<string, unknown>).child as Record<
				string,
				unknown
			>;
		}
		expect(depth).toBe(51);
	});
});
