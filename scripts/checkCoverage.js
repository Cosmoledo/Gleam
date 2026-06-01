import fs from "node:fs";
import path from "node:path";

const MIN_COVERAGE = 95;

function calcCoverage() {
	const data = JSON.parse(
		fs.readFileSync("./coverage/coverage-final.json", "utf8"),
	);
	/** @type Array<{
		path: string;
		stmt: {
			covered: number;
			total: number;
			perc: string;
		};
		branch: {
			covered: number;
			total: number;
			perc: string;
		};
	}> */
	const rows = [];

	Object.entries(data).forEach(([path, file]) => {
		const total = Object.keys(file.statementMap).length;
		const covered = Object.values(file.s).filter(c => c > 0).length;
		const pct = total === 0 ? 100 : (covered / total) * 100;

		const bTotal = Object.values(file.b).reduce((a, b) => a + b.length, 0);
		const bCov = Object.values(file.b).reduce(
			(a, b) => a + b.filter(c => c > 0).length,
			0,
		);
		const bPct = bTotal === 0 ? 100 : (bCov / bTotal) * 100;

		rows.push({
			path: path.replace(/.*\/src\//, "src/"),
			stmt: {
				covered,
				total,
				perc: pct.toFixed(2),
			},
			branch: {
				covered: bCov,
				total: bTotal,
				perc: bPct.toFixed(2),
			},
		});
	});

	rows.sort((a, b) => {
		let result = parseFloat(b.stmt.perc) - parseFloat(a.stmt.perc);

		if (result === 0) {
			result = parseFloat(b.branch.perc) - parseFloat(a.branch.perc);
		}

		return result;
	});

	console.log("Coverage results:");

	const allStmt = [0, 0];
	const allBranch = [0, 0];
	rows.forEach(row => {
		allStmt[0] += row.stmt.covered;
		allStmt[1] += row.stmt.total;
		allBranch[0] += row.branch.covered;
		allBranch[1] += row.branch.total;

		console.log(
			`  stmt ${row.stmt.perc.padStart(6)}%  br ${row.branch.perc.padStart(6)}%  ${row.path}`,
		);
	});

	const percStmt = (allStmt[0] / allStmt[1]) * 100;
	const percBranch = (allBranch[0] / allBranch[1]) * 100;

	const isCoverageOk = percStmt >= MIN_COVERAGE && percBranch >= MIN_COVERAGE;

	console.log(
		"Full overview: " +
			(isCoverageOk
				? "✅ fine"
				: "❌ failed, no " + MIN_COVERAGE + "% coverage"),
	);

	console.log(
		`  stmt ${percStmt.toFixed(2).padStart(6)}%  br ${percBranch.toFixed(2).padStart(6)}%`,
	);

	return isCoverageOk ? 0 : 1;
}

function hasFileATest() {
	const SKIP = /\.d\.ts$|(^|\/)index\.ts$/;

	/**
	 * @param {string} dir
	 * @param {string[]} out
	 * @returns string[]
	 */
	function walk(dir, out = []) {
		for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
			const p = path.join(dir, e.name);

			if (e.isDirectory()) {
				walk(p, out);
			} else if (e.name.endsWith(".ts") && !SKIP.test(p)) {
				out.push(p);
			}
		}

		return out;
	}

	const missing = [];
	for (const src of walk("src")) {
		const rel = src.replace(/^src\//, "").replace(/\.ts$/, "");
		const unit = `tests/unit/${rel}.test.ts`;
		const browser = `tests/browser/${rel}.test.ts`;

		if (!fs.existsSync(unit) && !fs.existsSync(browser)) {
			missing.push(`  ${src}`);
		}
	}

	if (missing.length) {
		console.log(`❌ ${missing.length} src files lack a co-located test:`);
		missing.forEach(l => console.log(l));
		return 1;
	}

	console.log("✅ Every src file has a co-located test");
	return 0;
}

const coverage = calcCoverage();
console.log();
const file = hasFileATest();
console.log();

process.exit(coverage || file);
