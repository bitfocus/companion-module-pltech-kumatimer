import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const baseConfig = await generateEslintConfig({
	enableTypescript: true,
})

/** @type {import('eslint').Linter.Config[]} */
const customConfig = [
	{
		// Use tsconfig.eslint.json so tests/ directory is included in type-aware linting
		languageOptions: {
			parserOptions: {
				project: './tsconfig.eslint.json',
			},
		},
	},
	{
		// Relax rules for test files
		files: ['tests/**/*.ts'],
		rules: {
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-floating-promises': 'off',
			'n/no-unpublished-import': 'off',
		},
	},
]

export default [...baseConfig, ...customConfig]
