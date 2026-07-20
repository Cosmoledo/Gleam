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

// `shell: true` lets Windows resolve the `npx.cmd` shim; pairing it with an
// args array trips Node's DEP0190 (args aren't shell-escaped). Pass one command
// string instead. The forwarded flags (e.g. --treatWarningsAsErrors) come from
// the npm script invocation, not untrusted input.
const extraArgs = process.argv.slice(2).join(" ");
const result = spawnSync(`npx typedoc ${extraArgs}`, [], {
	stdio: "inherit",
	cwd: ROOT,
	shell: true,
});

rmSync(BARREL, { force: true });

if (result.status !== 0) {
	process.exit(result.status ?? 1);
}
