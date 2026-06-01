#!/usr/bin/env node
// Single build entry: regenerates the barrel, wipes dist/, then emits bundled
// ESM (one file each for the main barrel and the prototypes side-effect entry),
// bundled types via dts-bundle-generator, and IIFE bundles for <script>-tag use.
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

function run(cmd, args) {
	const result = spawnSync(cmd, args, { stdio: "inherit", cwd: ROOT });
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
	outfile: join(DIST, "gamelib.esm.js"),
});

await build({
	...esbuildCommon,
	entryPoints: [BARREL],
	format: "iife",
	globalName: "GameLIB",
	outfile: join(DIST, "gamelib.js"),
});

await build({
	...esbuildCommon,
	entryPoints: [BARREL],
	format: "iife",
	globalName: "GameLIB",
	minify: true,
	outfile: join(DIST, "gamelib.min.js"),
});

function bundleTypes(entry, outfile) {
	run("npx", [
		"dts-bundle-generator",
		"--project",
		TSCONFIG,
		"-o",
		outfile,
		entry,
	]);
}

bundleTypes(BARREL, join(DIST, "gamelib.d.ts"));

rmSync(BARREL, { force: true });
