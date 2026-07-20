#!/usr/bin/env node
// Single build entry: regenerates the barrel, wipes dist/, then emits a
// bundled ESM file, two IIFE bundles (dev + minified) for <script>-tag use,
// and a single bundled .d.ts via dts-bundle-generator.
// The barrel is deleted at the end — it exists only during the build.

import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");
const TSCONFIG = join(ROOT, "tsconfig.json");
const BARREL = join(SRC, "index.ts");

function run(cmd, args, opts) {
	const result = spawnSync(cmd, args, {
		stdio: "inherit",
		cwd: ROOT,
		...opts,
	});
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

run("node", [join(ROOT, "scripts/generate-barrel.mjs")]);
rmSync(DIST, { recursive: true, force: true });

const esbuildCommon = {
	bundle: true,
	platform: "browser",
	target: "es2020",
	tsconfig: TSCONFIG,
	sourcemap: true,
	logLevel: "info",
};

await build({
	...esbuildCommon,
	entryPoints: [BARREL],
	format: "esm",
	outfile: join(DIST, "gleam.esm.js"),
});

await build({
	...esbuildCommon,
	entryPoints: [BARREL],
	format: "iife",
	globalName: "Gleam",
	outfile: join(DIST, "gleam.js"),
});

await build({
	...esbuildCommon,
	entryPoints: [BARREL],
	format: "iife",
	globalName: "Gleam",
	minify: true,
	outfile: join(DIST, "gleam.min.js"),
});

function bundleTypes(entry, outfile) {
	// `shell: true` is required so Windows resolves the `npx.cmd` shim, but
	// pairing it with an args array trips Node's DEP0190 warning (args aren't
	// escaped under a shell). Pass one command string instead; paths are quoted
	// so spaces survive both cmd.exe and POSIX shells. All parts are fixed
	// literals or build-controlled paths — no untrusted input.
	run(
		`npx dts-bundle-generator --project "${TSCONFIG}" --inline-declare-global --no-check -o "${outfile}" "${entry}"`,
		[],
		{ shell: true },
	);
}

bundleTypes(BARREL, join(DIST, "gleam.d.ts"));

rmSync(BARREL, { force: true });
