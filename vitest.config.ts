import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import path from "path";

const alias = {
	"@": path.resolve(__dirname, "./src"),
};

export default defineConfig({
	resolve: { alias },
	test: {
		coverage: {
			enabled: true,
			include: ["src/**/*"],
			reporter: ["html", "json"],
			reportOnFailure: true,
		},
		reporters: ["dot"],
		silent: true,
		projects: [
			{
				resolve: { alias },
				test: {
					name: "unit",
					include: ["tests/unit/**/*.test.ts"],
					environment: "happy-dom",
					setupFiles: ["./tests/unit/setup.ts"],
					globals: true,
				},
			},
			{
				resolve: { alias },
				test: {
					name: "browser",
					include: ["tests/browser/**/*.test.ts"],
					globals: true,
					browser: {
						enabled: true,
						provider: playwright(),
						headless: true,
						instances: [{ browser: "chromium" }],
					},
				},
			},
		],
	},
});
