import type { InstanceBase, CompanionVariableDefinitions, CompanionVariableValues } from '@companion-module/base'
import type { KumaTypes, KumaApiStatus } from './types.js'

// How many preset and cue slots get exposed as Companion variables.
// 6 presets matches the host's preset row exactly. 12 cue slots covers
// most show runsheets without spamming the variable picker — operators
// who need more can request a bump or we add a "current cue" pointer
// pattern in a future revision.
const PRESET_SLOTS = 6
export const CUE_SLOTS = 12
const LAYOUT_SLOTS = 12

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

/** Seconds → "MM:SS" ("H:MM:SS" from an hour up) for the PowerPoint media-time
 * variable. Empty string for anything that is not a usable duration — null while
 * nothing is playing, a host that doesn't send the field, NaN, negatives — so a
 * button label simply goes blank instead of showing "NaN:NaN" or "-1:-1". */
export function formatMediaRemaining(seconds: number | null | undefined): string {
	if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return ''
	const total = Math.floor(seconds)
	const h = Math.floor(total / 3600)
	const m = Math.floor((total % 3600) / 60)
	const sec = total % 60
	const pad = (n: number): string => String(n).padStart(2, '0')
	return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

/** Split the host's timer text into HH / MM / SS / FF.
 *
 * `timer` is plain (MM:SS or HH:MM:SS); `_timer_display` is the SAME text with
 * a frame segment appended in the frame-accurate (:FR) clock formats, and is
 * already HH:MM:SS:FF in LTC mode. A three-part display string is therefore
 * ambiguous on its own (HH:MM:SS or MM:SS:FF) — comparing the segment count
 * with the plain `timer` tells them apart. Anything unparseable gives '--' for
 * every part rather than guessing. FF is '--' when no frames are being shown. */
export function splitTimer(data: KumaApiStatus): { hh: string; mm: string; ss: string; ff: string; full: string } {
	const none = { hh: '--', mm: '--', ss: '--', ff: '--', full: '--:--' }
	const plain = data.timer ?? ''
	const shown = data._timer_display || plain
	if (!shown) return none
	const parts = shown.split(':')
	const plainParts = plain ? plain.split(':').length : parts.length
	if (parts.some((p) => !/^\d+$/.test(p))) return { ...none, full: shown }
	const pad = (v: string): string => v.padStart(2, '0')
	let hh = '00'
	let mm: string
	let ss: string
	let ff = '--'
	switch (parts.length) {
		case 2:
			;[mm, ss] = parts
			break
		case 3:
			if (plainParts === 2) {
				// MM:SS:FF — the host appended frames to a two-part timer
				;[mm, ss, ff] = parts
			} else {
				;[hh, mm, ss] = parts
			}
			break
		case 4:
			;[hh, mm, ss, ff] = parts
			break
		default:
			return { ...none, full: shown }
	}
	return { hh: pad(hh), mm: pad(mm), ss: pad(ss), ff: ff === '--' ? ff : pad(ff), full: shown }
}

export function setupVariables(instance: InstanceBase<KumaTypes>): void {
	const definitions: CompanionVariableDefinitions = {
		// Live state
		timer: { name: 'Timer string (MM:SS)' },
		timer_seconds: { name: 'Timer value in seconds' },
		// v2.5.0: the timer split into parts, for big single-value buttons.
		timer_hh: { name: 'Timer: hours (00 when the timer has no hours part)' },
		timer_mm: { name: 'Timer: minutes' },
		timer_ss: { name: 'Timer: seconds' },
		timer_ff: { name: 'Timer: frames (-- unless a frame-accurate format or LTC is shown)' },
		timer_full: { name: 'Timer: whole display text incl. frames when shown (e.g. 05:23:12)' },
		status: { name: 'Status (LIVE/PAUSED/STANDBY/HIDDEN)' },
		display_mode: { name: 'Display mode (TIMER/CLOCK)' },
		cue_name: { name: 'Current cue name' },
		cue_index: { name: 'Current cue index' },
		overtime: { name: 'Overtime (true/false)' },
		progress: { name: 'Progress bar %' },
		sms_active: { name: 'SMS message active (true/false)' },
		// QLab follow
		qlab_follow_enabled: { name: 'QLab follow enabled (true/false)' },
		qlab_following: { name: 'TCR: a follow source (QLab/Mitti/Millumin/KumaPoint) is driving the timer (true/false)' },
		qlab_cue: { name: 'QLab followed cue (number/id)' },
		qlab_mode: { name: 'QLab follow mode (active/cue)' },
		qlab_health: { name: 'QLab follow health (ok/idle/error/off)' },
		qlab_hold: { name: 'TCR hidden / hold armed (true/false)' },
		qlab_triggers_enabled: { name: 'QLab triggers enabled (true/false)' },
		// v2.5.0: state flags that used to exist only as feedbacks. External
		// dashboards read variables (GET /api/variable/...), not feedbacks, so
		// every one is mirrored here under the SAME id as its feedback.
		omt_enabled: { name: 'OMT: output is enabled (true/false)' },
		omt_active: { name: 'OMT: sender is live (true/false)' },
		ltc_generator_enabled: { name: 'LTC Generator: is enabled (true/false)' },
		ltc_generator_active: { name: 'LTC Generator: transport is live (true/false)' },
		ltc_chase_enabled: { name: 'Chase to Timecode: is enabled (true/false)' },
		ltc_chase_active: { name: 'Chase to Timecode: armed and counting to next cue (true/false)' },
		dsan_rx_active: { name: 'DSAN Limitimer: live RX signal (true/false)' },
		blackmagic_active: { name: 'Blackmagic: output is live (true/false)' },
		// Source-neutral TCR (QLab / Mitti / Millumin / KumaPoint) and Time Glide /
		// Jump. Booleans share their id with the feedback of the same name.
		tcr_source: { name: 'TCR source: QLAB / MITTI / MILLUMIN / KUMAPOINT / OFF' },
		tcr_following: { name: 'TCR: a follow source is driving the timer (true/false)' },
		tcr_line: { name: 'TCR readout text, e.g. 00:23 (empty when none)' },
		tcr_name: { name: 'TCR clip / cue name (empty when none)' },
		// PowerPoint add-in (KumaPoint) slide-show panel. All empty / 0 when no
		// show is running. ppt_media_remaining is its own variable because
		// tcr_line is blank in Replace mode.
		ppt_file: { name: 'PowerPoint: presentation file name (empty when no show)' },
		ppt_slide: { name: 'PowerPoint: current slide number (0 when no show)' },
		ppt_slide_total: { name: 'PowerPoint: slides in the deck (0 when no show)' },
		ppt_builds_remaining: { name: 'PowerPoint: animation builds still ahead on this slide' },
		ppt_media_state: { name: 'PowerPoint: media state, PLAYING or IDLE (empty when no show)' },
		ppt_media_remaining: { name: 'PowerPoint: playing clip time left, MM:SS (empty when idle)' },
		time_glide_active: { name: 'Time Glide: a glide is running (true/false)' },
		time_jump_active: { name: 'Time Jump: a jump is running (true/false)' },
		// Timecode / timer TEXT (empty string = no signal) — host v1.19.3+.
		ltc_timecode: { name: 'LTC input timecode HH:MM:SS:FF (empty = no signal)' },
		ltc_generator_timecode: { name: 'LTC Generator timecode HH:MM:SS:FF (empty = not running)' },
		dsan_rx_timer: { name: 'DSAN Limitimer: received timer (empty = no signal)' },
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
	// Layout presets ("Looks"). `layout_active` = active preset name for button
	// feedback; `layout_N_name` for slot-labelled recall buttons.
	definitions['layout_active'] = { name: 'Active layout preset name' }
	for (let i = 1; i <= LAYOUT_SLOTS; i++) {
		definitions[`layout_${i}_name`] = { name: `Layout preset ${i} — name` }
	}
	instance.setVariableDefinitions(definitions)
	clearVariables(instance)
}

export function updateVariables(instance: InstanceBase<KumaTypes>, data: KumaApiStatus): void {
	const t = splitTimer(data)
	const values: CompanionVariableValues = {
		timer: data.timer ?? '--:--',
		timer_seconds: String(data.timer_seconds ?? 0),
		timer_hh: t.hh,
		timer_mm: t.mm,
		timer_ss: t.ss,
		timer_ff: t.ff,
		timer_full: t.full,
		status: (data.status ?? 'standby').toUpperCase(),
		display_mode: (data.display_mode ?? 'TIMER').toUpperCase(),
		cue_name: data.cue_name || '—',
		cue_index: String(data.cue_index ?? -1),
		overtime: String(data.overtime ?? false),
		progress: String(data.progress ?? 0),
		sms_active: String(data.sms_active ?? false),
		qlab_follow_enabled: String(data.qlab_follow_enabled ?? false),
		qlab_following: String(data.qlab_following ?? false),
		qlab_cue: data.qlab_follow_cue || '—',
		qlab_mode: (data.qlab_follow_mode ?? 'active').toUpperCase(),
		qlab_health: (data.qlab_health ?? 'off').toUpperCase(),
		qlab_hold: String(data.qlab_hold ?? false),
		qlab_triggers_enabled: String(data.qlab_triggers_enabled ?? false),
		// Host field names differ from the variable ids for the LTC Generator
		// (ltc_tx_* on the wire) — the ids match the feedbacks, see feedbacks.ts.
		omt_enabled: String(data.omt_enabled ?? false),
		omt_active: String(data.omt_active ?? false),
		ltc_generator_enabled: String(data.ltc_tx_enabled ?? false),
		ltc_generator_active: String(data.ltc_tx_active ?? false),
		ltc_chase_enabled: String(data.ltc_chase_enabled ?? false),
		ltc_chase_active: String(data.ltc_chase_active ?? false),
		dsan_rx_active: String(data.dsan_rx_active ?? false),
		blackmagic_active: String(data.blackmagic_active ?? false),
		// Older hosts only know the legacy qlab_following flag, which is already
		// source-neutral on any host that has the tcr_* fields.
		tcr_source: (data.tcr_source ?? 'off').toUpperCase(),
		tcr_following: String(data.tcr_following ?? data.qlab_following ?? false),
		tcr_line: data.tcr_line ?? '',
		tcr_name: data.tcr_name ?? '',
		ppt_file: data.ppt?.file ?? '',
		ppt_slide: String(data.ppt?.slide ?? 0),
		ppt_slide_total: String(data.ppt?.total ?? 0),
		ppt_builds_remaining: String(data.ppt?.builds_remaining ?? 0),
		ppt_media_state: data.ppt ? (data.ppt.media ?? 'idle').toUpperCase() : '',
		ppt_media_remaining: formatMediaRemaining(data.ppt?.media_remaining),
		time_glide_active: String(data.warp_active ?? false),
		time_jump_active: String(data.jump_active ?? false),
		ltc_timecode: data.ltc_timecode ?? '',
		ltc_generator_timecode: data.ltc_generator_timecode ?? '',
		dsan_rx_timer: data.dsan_rx_timer ?? '',
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
	// Layout preset variables — active name + per-slot names.
	const layouts = data.layout_presets ?? []
	const activeId = data.layout_preset_active ?? ''
	const activeName = layouts.find((p) => p.id === activeId)?.name ?? ''
	values['layout_active'] = activeName || '—'
	for (let i = 0; i < LAYOUT_SLOTS; i++) {
		values[`layout_${i + 1}_name`] = layouts[i]?.name ?? ''
	}
	instance.setVariableValues(values)
}

export function clearVariables(instance: InstanceBase<KumaTypes>): void {
	const values: CompanionVariableValues = {
		timer: '--:--',
		timer_seconds: '0',
		timer_hh: '--',
		timer_mm: '--',
		timer_ss: '--',
		timer_ff: '--',
		timer_full: '--:--',
		status: 'OFFLINE',
		display_mode: 'TIMER',
		cue_name: '—',
		cue_index: '-1',
		overtime: 'false',
		progress: '0',
		sms_active: 'false',
		qlab_follow_enabled: 'false',
		qlab_following: 'false',
		qlab_cue: '—',
		qlab_mode: 'ACTIVE',
		qlab_health: 'OFF',
		qlab_hold: 'false',
		qlab_triggers_enabled: 'false',
		omt_enabled: 'false',
		omt_active: 'false',
		ltc_generator_enabled: 'false',
		ltc_generator_active: 'false',
		ltc_chase_enabled: 'false',
		ltc_chase_active: 'false',
		dsan_rx_active: 'false',
		blackmagic_active: 'false',
		tcr_source: 'OFF',
		tcr_following: 'false',
		tcr_line: '',
		tcr_name: '',
		ppt_file: '',
		ppt_slide: '0',
		ppt_slide_total: '0',
		ppt_builds_remaining: '0',
		ppt_media_state: '',
		ppt_media_remaining: '',
		time_glide_active: 'false',
		time_jump_active: 'false',
		ltc_timecode: '',
		ltc_generator_timecode: '',
		dsan_rx_timer: '',
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
	values['layout_active'] = '—'
	for (let i = 1; i <= LAYOUT_SLOTS; i++) {
		values[`layout_${i}_name`] = ''
	}
	instance.setVariableValues(values)
}
