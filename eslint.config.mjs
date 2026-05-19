import tsParser from "@typescript-eslint/parser";
import typescriptESLint from "@typescript-eslint/eslint-plugin";

export default [
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: tsParser,
			ecmaVersion: "latest",
			sourceType: "module",
		},
		plugins: {
			"@typescript-eslint": typescriptESLint,
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-inferrable-types": "off",
			"@typescript-eslint/no-namespace": "off",
			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/no-var-requires": "off",
			"@typescript-eslint/prefer-namespace-keyword": "off",
			"@typescript-eslint/type-annotation-spacing": "off",
			"block-scoped-var": "error",
			curly: ["error", "all"],
			"linebreak-style": ["error", "unix"],
			"no-alert": "off",
			"no-case-declarations": "off",
			"no-var": "error",
			indent: ["error", "tab", { SwitchCase: 1 }],
			quotes: ["error", "double"],
			semi: ["error", "always"],
			yoda: ["error", "never"],
		},
	},
];
