import { describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import { download } from "@/utilities/Fetch";

// Build a Response whose body streams the given chunks one at a time, so
// `download` sees multiple reader.read() ticks (a single Uint8Array body would
// collapse to one chunk and one progress call).
function streamedResponse(
	chunks: Uint8Array[],
	init: ResponseInit & { contentLength?: number | null } = {},
): Response {
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			chunks.forEach((chunk) => controller.enqueue(chunk));
			controller.close();
		},
	});
	const headers = new Headers(init.headers);
	if (init.contentLength != null) {
		headers.set("Content-Length", String(init.contentLength));
	}
	return new Response(stream, { ...init, headers });
}

// ==================== download ====================

describe("download", () => {
	it("throws on a non-ok response", async () => {
		const res = new Response("nope", { status: 404 });
		await expect(download(res, () => {})).rejects.toThrow("HTTP 404");
	});

	it("returns a bodyless response unchanged without reporting progress", async () => {
		const res = new Response(null, { status: 204 });
		const onProgress = vi.fn();
		const result = await download(res, onProgress);
		expect(result).toBe(res);
		expect(onProgress).not.toHaveBeenCalled();
	});

	it("reports cumulative progress with total from Content-Length", async () => {
		const res = streamedResponse(
			[new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])],
			{ contentLength: 5 },
		);
		const calls: [number, number | null][] = [];
		await download(res, (loaded, total) => calls.push([loaded, total]));
		expect(calls).toEqual([
			[3, 5],
			[5, 5],
		]);
	});

	it("passes total=null when Content-Length is absent", async () => {
		const res = streamedResponse([new Uint8Array([1, 2])]);
		const totals: (number | null)[] = [];
		await download(res, (_loaded, total) => totals.push(total));
		expect(totals).toEqual([null]);
	});

	it("returns a Response whose body concatenates the chunks in order", async () => {
		const res = streamedResponse([
			new Uint8Array([10, 20]),
			new Uint8Array([30]),
			new Uint8Array([40, 50]),
		]);
		const result = await download(res, () => {});
		const bytes = new Uint8Array(await result.arrayBuffer());
		expect([...bytes]).toEqual([10, 20, 30, 40, 50]);
	});

	it("preserves status, statusText, and headers on the returned Response", async () => {
		const res = streamedResponse([new Uint8Array([1])], {
			status: 206,
			statusText: "Partial Content",
			headers: { "X-Custom": "yes" },
			contentLength: 1,
		});
		const result = await download(res, () => {});
		expect(result.status).toBe(206);
		expect(result.statusText).toBe("Partial Content");
		expect(result.headers.get("X-Custom")).toBe("yes");
	});

	it("preserves the original Content-Type over the Blob's empty type", async () => {
		const res = streamedResponse([new Uint8Array([1, 2])], {
			headers: { "Content-Type": "application/octet-stream" },
		});
		const result = await download(res, () => {});
		expect(result.headers.get("Content-Type")).toBe(
			"application/octet-stream",
		);
	});

	it("does not report progress for an empty body", async () => {
		const res = streamedResponse([]);
		const onProgress = vi.fn();
		const result = await download(res, onProgress);
		expect(onProgress).not.toHaveBeenCalled();
		expect(new Uint8Array(await result.arrayBuffer()).length).toBe(0);
	});
});
