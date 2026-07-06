/**
 * Read a fetch `Response` body to completion while reporting progress, then
 * return a fresh `Response` backed by the fully buffered bytes.
 * `onProgress` fires once per received chunk with the cumulative bytes loaded
 * and the total from the `Content-Length` header, or `null` when it is absent.
 * Throws if the response is not `ok`. A bodyless response (e.g. `204`, `HEAD`)
 * is returned unchanged and `onProgress` never fires.
 */
export async function download(
	fetchResponse: Response,
	onProgress: (loaded: number, total: number | null) => void,
): Promise<Response> {
	if (!fetchResponse.ok) {
		throw new Error(`HTTP ${fetchResponse.status}`);
	}

	// Bodyless responses (204, HEAD, `new Response(null)`) have nothing to
	// stream — return as-is; `onProgress` never fires.
	if (!fetchResponse.body) {
		return fetchResponse;
	}

	const total = Number(fetchResponse.headers.get("Content-Length")) || null;

	const reader = fetchResponse.body.getReader();
	const chunks: Uint8Array[] = [];
	let loaded = 0;

	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}

		chunks.push(value);
		loaded += value.length;
		onProgress(loaded, total);
	}

	// Let `Blob` concatenate the chunks so they can be freed, rather than
	// holding the whole body twice via a manual `Uint8Array` copy.
	return new Response(new Blob(chunks as BlobPart[]), {
		headers: fetchResponse.headers,
		status: fetchResponse.status,
		statusText: fetchResponse.statusText,
	});
}
