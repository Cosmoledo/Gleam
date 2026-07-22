#!/usr/bin/env node
//
// Flags hard-wrapped comment prose. House style: prose inside a block comment
// stays on ONE line per paragraph (never wrapped to a fixed column); paragraphs
// are separated by a blank ` *` line. So two adjacent non-blank prose lines
// inside a `/* */` / `/** */` block are a hard wrap and get reported.
//
// Exempt (legitimately multi-line): proper ` *` gutter-blank separators (an
// empty line or a bare `*` is flagged instead), JSDoc tag lines (@param…),
// list items (`- `, `* `, `1. `), block quotes (`> `), fenced code (```), and
// bare reference URLs (a standalone `https://…` line belongs on its own line —
// it is not prose to reflow, so it neither counts as a wrap nor triggers one).
//
// Usage: node scripts/checkCommentWrap.mjs [paths…]   (defaults to "src")
// Exits 1 if any hard-wrapped line is found.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const EXTS = [".ts", ".js", ".mjs"];
const targets = process.argv.slice(2);
const roots = targets.length ? targets : ["src"];

/** Collect every source file under the given paths. */
function collect(path, out) {
	const stat = statSync(path);

	if (stat.isDirectory()) {
		readdirSync(path).forEach(entry => collect(join(path, entry), out));
	} else if (EXTS.some(ext => path.endsWith(ext))) {
		out.push(path);
	}

	return out;
}

// A line that is a new logical line rather than wrapped prose: JSDoc tag, list
// item, block quote. Such lines never count as a "continuation".
const STRUCTURAL = /^(@|[-*]\s|\d+\.\s|>\s)/;

// A standalone reference URL belongs on its own line — it is not prose to be
// reflowed into a paragraph, so it neither counts as a wrap nor triggers one.
const BARE_URL = /^<?https?:\/\/\S+>?$/;

// The only valid blank line inside a block is a proper gutter-blank: tab indent
// (this codebase indents with tabs), then exactly one space and a `*`, nothing
// trailing — i.e. ` *`, `\t *`, `\t\t *`. An empty line, a bare `*` (no leading
// space), extra spaces, or trailing whitespace are malformed and get flagged.
const VALID_BLANK = /^\t* \*$/;

// A body line's gutter is a single `*`. A doubled `**` gutter is malformed —
// distinct from ` * ` + a real `* ` list item, and from mid-prose markdown
// `**bold**` (which sits after the single-star gutter, so it does not match).
const DOUBLE_STAR_GUTTER = /^\s*\*\*/;

/** Strip a leading ` * ` gutter if present; starless bodies keep the text. */
function strip(text) {
	return text.replace(/^\*\s?/, "").trim();
}

/** Report each hard-wrapped prose line in one file. */
function checkFile(file) {
	const lines = readFileSync(file, "utf8").split("\n");
	const findings = [];

	let inBlock = false;
	let inFence = false;
	let prevProse = false;
	let prevLine = 0;

	// Classify one comment-body line's content and record a wrap if it
	// continues the previous prose line. Works gutter-independent, so starless
	// `/* … */` bodies are covered too — not just `*`-gutter JSDoc.
	const evaluate = (content, lineNo) => {
		// A ``` toggles a fenced code sample — never flag inside it.
		if (content.startsWith("```")) {
			inFence = !inFence;
			prevProse = false;

			return;
		}

		if (inFence) {
			prevProse = false;

			return;
		}

		const isProse =
			content !== "" &&
			!STRUCTURAL.test(content) &&
			!BARE_URL.test(content);

		if (isProse && prevProse) {
			findings.push(
				`${file}:${lineNo}: hard-wrapped comment prose ` +
					`(continues line ${prevLine}) — keep each paragraph on one line`,
			);
		}

		prevProse = isProse;
		prevLine = lineNo;
	};

	lines.forEach((raw, index) => {
		const trimmed = raw.trim();
		const lineNo = index + 1;

		if (!inBlock) {
			const open = trimmed.indexOf("/*");

			if (open === -1) {
				prevProse = false;

				return;
			}

			// Text after the opening `/*` (or `/**`) — the block may carry
			// prose on its opening line.
			let rest = trimmed.slice(open + 2);
			if (rest.startsWith("*")) {
				rest = rest.slice(1);
			}

			// A self-closing `/* … */` on one line can't be a wrap.
			if (rest.includes("*/")) {
				prevProse = false;

				return;
			}

			inBlock = true;
			inFence = false;
			prevProse = false;
			evaluate(strip(rest), lineNo);

			return;
		}

		const close = trimmed.indexOf("*/");

		if (close !== -1) {
			// Prose can sit before the closing `*/`.
			evaluate(strip(trimmed.slice(0, close)), lineNo);
			inBlock = false;
			prevProse = false;

			return;
		}

		// Middle line. A doubled `**` gutter is never valid.
		if (!inFence && DOUBLE_STAR_GUTTER.test(raw)) {
			findings.push(
				`${file}:${lineNo}: malformed comment gutter — a body line ` +
					"must start with a single `*`, not `**`",
			);
			prevProse = false;

			return;
		}

		// A blank-ish line is a valid paragraph separator only when it is a
		// proper ` *` gutter-blank; an empty line or a bare `*` is malformed and
		// gets flagged (outside fenced code, where blanks are fine).
		const content = strip(trimmed);

		if (content === "" && !inFence) {
			if (!VALID_BLANK.test(raw)) {
				findings.push(
					`${file}:${lineNo}: malformed blank comment line — a ` +
						"paragraph separator must be ` *` (not an empty line or a bare `*`)",
				);
			}

			prevProse = false;

			return;
		}

		evaluate(content, lineNo);
	});

	return findings;
}

const files = roots.flatMap(root => collect(root, []));
const findings = files.flatMap(checkFile);

if (findings.length > 0) {
	console.error(
		`Found ${findings.length} hard-wrapped comment line(s):\n` +
			findings.join("\n"),
	);
	process.exit(1);
}

console.log(`No hard-wrapped comment prose found (${files.length} files).`);
