#!/usr/bin/env node
/**
 * Post-package fixup.
 *
 * `companion-module-build` rewrites `runtime.apiVersion` in
 * companion/manifest.json to "0.0.0" (a quirk of the tool — it doesn't
 * detect the value from node_modules/@companion-module/base). We keep the
 * canonical value in git and restore it here after packaging so the file
 * stays clean and yarn package output matches what's checked in.
 *
 * The source of truth is the installed @companion-module/base version.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const manifestPath = 'companion/manifest.json'
const basePkgPath  = 'node_modules/@companion-module/base/package.json'

const baseVer = JSON.parse(readFileSync(basePkgPath, 'utf8')).version
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

if (manifest.runtime?.apiVersion !== baseVer) {
	const before = manifest.runtime.apiVersion
	manifest.runtime.apiVersion = baseVer
	// Preserve tab indentation used in the existing file
	writeFileSync(manifestPath, JSON.stringify(manifest, null, '\t') + '\n')
	console.log(`fix-manifest: apiVersion ${before} → ${baseVer}`)
} else {
	console.log(`fix-manifest: apiVersion already ${baseVer}`)
}
