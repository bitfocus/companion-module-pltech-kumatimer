import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const baseConfig = await generateEslintConfig({
	enableTypescript: true,
})

/** @type {import('eslint').Linter.Config[]} */
const customConfig = [
	{
		// Type-aware linting for our source + the top-level tests/ dir and the
		// vitest config. Scoped to TS files only — applying a `project` globally
		// would force the .mjs config/scripts files (which aren't in any tsconfig)
		// through the typed parser and break `eslint .`.
		files: ['src/**/*.ts', 'tests/**/*.ts', 'vitest.config.ts'],
		languageOptions: {
			parserOptions: {
				project: './tsconfig.eslint.json',
			},
		},
	},
	{
		// Test files and the vitest config legitimately import dev-only deps and
		// don't need exported-boundary types.
		files: ['tests/**/*.ts', 'vitest.config.ts'],
		rules: {
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-floating-promises': 'off',
			'n/no-unpublished-import': 'off',
		},
	},
]

export default [...baseConfig, ...customConfig]
