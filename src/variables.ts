import type { InstanceBase, CompanionVariableDefinitions, CompanionVariableValues } from '@companion-module/base'
import type { KumaTypes, KumaApiStatus } from './types.js'

// How many preset and cue slots get exposed as Companion variables.
// 6 presets matches the host's preset row exactly. 12 cue slots covers
// most show runsheets without spamming the variable picker — operators
// who need more can request a bump or we add a "current cue" pointer
// pattern in a future revision.
const PRESET_SLOTS = 6
const CUE_SLOTS = 12

/** Format M*60+S as "M:SS" or "H:MM:SS" depending on size. */
function formatHMS(totalSeconds: number): string {
	const s = Math.max(0, Math.floor(totalSeconds || 0))
	const h = Math.floor(s / 3600)
	const m = Math.floor((s % 3600) / 60)
	const sec = s % 60
	if (h > 0) {
		return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
	}
	return `${m}:${sec.toString().padStart(2, '0')}`
}

/** Format minutes-only as "NM" if seconds==0, else "M:SS" — matches the
 * label format the Bitfocus factory presets use for the preset_0..5 buttons. */
function formatPresetLabel(totalSeconds: number): string {
	const s = Math.max(0, Math.floor(totalSeconds || 0))
	if (s % 60 === 0) {
		return `${s / 60}M`
	}
	return formatHMS(s)
}

export function setupVariables(instance: InstanceBase<KumaTypes>): void {
	const definitions: CompanionVariableDefinitions = {
		// Live state
		timer: { name: 'Timer string (MM:SS)' },
		timer_seconds: { name: 'Timer value in seconds' },
		status: { name: 'Status (LIVE/PAUSED/STANDBY/HIDDEN)' },
		display_mode: { name: 'Display mode (TIMER/CLOCK)' },
		cue_name: { name: 'Current cue name' },
		cue_index: { name: 'Current cue index' },
		overtime: { name: 'Overtime (true/false)' },
		progress: { name: 'Progress bar %' },
		sms_active: { name: 'SMS message active (true/false)' },
	}
	// v2.0.0 BETA: per-preset variables for use in user-built button
	// labels. Auto-update from /api/status every poll. Thomas request
	// 8 May 2026 — factory presets in the module's Presets panel
	// already auto-adapt, but custom Stream Deck buttons that use
	// fixed text don't; with these variables they can.
	for (let i = 1; i <= PRESET_SLOTS; i++) {
		definitions[`preset_${i}_minutes`] = { name: `Preset ${i} — minutes` }
		definitions[`preset_${i}_seconds`] = { name: `Preset ${i} — total seconds` }
		definitions[`preset_${i}_label`] = { name: `Preset ${i} — formatted label (e.g. "5M" or "1:30")` }
	}
	// Per-cue variables. Indexed 1..N matching how the operator reads
	// the runsheet (cue 1, cue 2, …). `cue_N_name` for button text,
	// `cue_N_minutes` / `cue_N_seconds` / `cue_N_label` for any
	// duration-driven feedback.
	for (let i = 1; i <= CUE_SLOTS; i++) {
		definitions[`cue_${i}_name`] = { name: `Cue ${i} — name` }
		definitions[`cue_${i}_minutes`] = { name: `Cue ${i} — minutes` }
		definitions[`cue_${i}_seconds`] = { name: `Cue ${i} — total seconds` }
		definitions[`cue_${i}_label`] = { name: `Cue ${i} — formatted label` }
	}
	instance.setVariableDefinitions(definitions)
	clearVariables(instance)
}

export function updateVariables(instance: InstanceBase<KumaTypes>, data: KumaApiStatus): void {
	const values: CompanionVariableValues = {
		timer: data.timer ?? '--:--',
		timer_seconds: String(data.timer_seconds ?? 0),
		status: (data.status ?? 'standby').toUpperCase(),
		display_mode: (data.display_mode ?? 'TIMER').toUpperCase(),
		cue_name: data.cue_name || '—',
		cue_index: String(data.cue_index ?? -1),
		overtime: String(data.overtime ?? false),
		progress: String(data.progress ?? 0),
		sms_active: String(data.sms_active ?? false),
	}
	// Preset variables — read from `preset_seconds` (v1.12.0+) when
	// present, otherwise derive from the legacy `presets` minutes
	// array. Empty string if the slot is unconfigured (not "0") so
	// operator-side $(...) substitution shows blank instead of "0".
	const presets = data.presets ?? []
	const presetSecs = data.preset_seconds ?? []
	for (let i = 0; i < PRESET_SLOTS; i++) {
		const idx = i + 1 // 1-based for variable name
		const secs = presetSecs[i] ?? (presets[i] != null ? presets[i] * 60 : null)
		values[`preset_${idx}_minutes`] = secs != null ? String(Math.floor(secs / 60)) : ''
		values[`preset_${idx}_seconds`] = secs != null ? String(secs) : ''
		values[`preset_${idx}_label`] = secs != null ? formatPresetLabel(secs) : ''
	}
	// Cue variables — accept both {min, sec} and {minutes, seconds}
	// shapes (older hosts used the long form, newer use the short).
	const cues = data.cue_list_full ?? []
	for (let i = 0; i < CUE_SLOTS; i++) {
		const idx = i + 1
		const cue = cues[i]
		if (cue) {
			const mins = cue.min ?? cue.minutes ?? 0
			const secs = cue.sec ?? cue.seconds ?? 0
			const total = mins * 60 + secs
			values[`cue_${idx}_name`] = cue.name ?? `Cue ${idx}`
			values[`cue_${idx}_minutes`] = String(mins)
			values[`cue_${idx}_seconds`] = String(total)
			values[`cue_${idx}_label`] = formatHMS(total)
		} else {
			values[`cue_${idx}_name`] = ''
			values[`cue_${idx}_minutes`] = ''
			values[`cue_${idx}_seconds`] = ''
			values[`cue_${idx}_label`] = ''
		}
	}
	instance.setVariableValues(values)
}

export function clearVariables(instance: InstanceBase<KumaTypes>): void {
	const values: CompanionVariableValues = {
		timer: '--:--',
		timer_seconds: '0',
		status: 'OFFLINE',
		display_mode: 'TIMER',
		cue_name: '—',
		cue_index: '-1',
		overtime: 'false',
		progress: '0',
		sms_active: 'false',
	}
	for (let i = 1; i <= PRESET_SLOTS; i++) {
		values[`preset_${i}_minutes`] = ''
		values[`preset_${i}_seconds`] = ''
		values[`preset_${i}_label`] = ''
	}
	for (let i = 1; i <= CUE_SLOTS; i++) {
		values[`cue_${i}_name`] = ''
		values[`cue_${i}_minutes`] = ''
		values[`cue_${i}_seconds`] = ''
		values[`cue_${i}_label`] = ''
	}
	instance.setVariableValues(values)
}
