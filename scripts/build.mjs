#!/usr/bin/env node
// Single build entry: regenerates the barrel, wipes dist/, then emits
// per-module ESM under dist/esm/ (module boundaries preserved so bundlers
// can tree-shake), two single-file IIFE bundles (dev + minified) for
// <script>-tag use, and a single bundled .d.ts via dts-bundle-generator.
// The barrel is deleted at the end — it exists only during the build.

import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");
const ESM_DIR = join(DIST, "esm");
const TSCONFIG = join(ROOT, "tsconfig.json");
const BARREL = join(SRC, "index.ts");

// Every .ts module under src/ (barrel included) is an esbuild entry point, so
// the ESM build emits one output file per source module mirroring the src/
// tree instead of fusing them into one module. Those preserved boundaries are
// what let a consumer's bundler drop the modules it never references.
function collectEntryPoints(dir) {
	const out = [];
	for (const name of readdirSync(dir).sort()) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) {
			out.push(...collectEntryPoints(full));
		} else if (name.endsWith(".ts") && !name.endsWith(".d.ts")) {
			out.push(full);
		}
	}
	return out;
}

// Keeps cross-module imports as import statements (external) instead of
// inlining or code-splitting them into hashed chunks. Rewrites the `@/` alias
// and extensionless specifiers to relative `.js` paths so the emitted files
// import each other by their real, stable names — which is what makes the
// `sideEffects` globs in package.json match (hashed chunk names wouldn't) and
// keeps a clean 1:1 src→dist layout. Only used for the per-module ESM build;
// the IIFE bundles still inline everything.
const preserveModules = {
	name: "preserve-modules",
	setup(pluginBuild) {
		pluginBuild.onResolve({ filter: /^@\/|^\.\.?\// }, (args) => {
			if (args.kind === "entry-point") {
				return null;
			}

			const targetAbs = args.path.startsWith("@/")
				? join(SRC, args.path.slice(2))
				: resolve(dirname(args.importer), args.path);

			let rel = relative(dirname(args.importer), targetAbs).replace(
				/\\/g,
				"/",
			);
			if (!rel.startsWith(".")) {
				rel = `./${rel}`;
			}

			return { path: `${rel}.js`, external: true };
		});
	},
};

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
	entryPoints: collectEntryPoints(SRC),
	format: "esm",
	outdir: ESM_DIR,
	outbase: SRC,
	plugins: [preserveModules],
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
