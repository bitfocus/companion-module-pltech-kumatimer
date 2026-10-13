import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { MODULE_VERSION } from '../src/version.js'

describe('module version', () => {
	it('matches package.json and the Companion manifest', () => {
		const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string }
		const manifest = JSON.parse(readFileSync(new URL('../companion/manifest.json', import.meta.url), 'utf8')) as {
			version: string
		}
		expect(MODULE_VERSION).toBe(pkg.version)
		expect(MODULE_VERSION).toBe(manifest.version)
	})
})
