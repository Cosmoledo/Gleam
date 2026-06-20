#!/usr/bin/env node
// Generates docs/ via TypeDoc. The barrel src/index.ts is regenerated as
// the entry point, then deleted again — mirroring scripts/build.mjs.

import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BARREL = join(ROOT, "src/index.ts");

function run(cmd, args) {
	const result = spawnSync(cmd, args, { stdio: "inherit", cwd: ROOT });
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

run("node", [join(ROOT, "scripts/generate-barrel.mjs")]);
try {
	run("npx", ["typedoc"]);
} finally {
	rmSync(BARREL, { force: true });
}
