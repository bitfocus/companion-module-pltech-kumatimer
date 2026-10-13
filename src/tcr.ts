import type { CompanionVariableDefinitions, CompanionVariableValues } from '@companion-module/base'
import type { KumaApiStatus } from './types.js'

/**
 * Multi-source TCR and KumaPoint presenter machines (host: 13 Oct 2026).
 *
 * KUMA can follow QLab, Mitti, Millumin and PowerPoint (KumaPoint) AT THE SAME TIME.
 * Each source has its own line, and KumaPoint can run several presenter machines in
 * groups ("lanes"): GFX 1 + GFX 1 BACKUP is group 1, GFX 2 + GFX 2 BACKUP is group 2.
 * Inside a group the primary draws the line and the mirrored backup takes over when
 * the primary goes silent.
 *
 * Everything here is additive on the wire: an older host sends none of these fields,
 * so every reader falls back to empty / false and never throws.
 */

/** A "lane" = one TCR line. PowerPoint groups 2-4 are `kumapoint2..4`. */
export const TCR_LANES = ['qlab', 'mitti', 'millumin', 'kumapoint', 'kumapoint2', 'kumapoint3', 'kumapoint4'] as const
export type TcrLane = (typeof TCR_LANES)[number]

/** Max KumaPoint groups / machines the host supports. */
export const KP_SLOTS = 4

export const TCR_LANE_LABEL: Record<TcrLane, string> = {
	qlab: 'QLab',
	mitti: 'Mitti',
	millumin: 'Millumin',
	kumapoint: 'PowerPoint group 1',
	kumapoint2: 'PowerPoint group 2',
	kumapoint3: 'PowerPoint group 3',
	kumapoint4: 'PowerPoint group 4',
}

/** Dropdown choices shared by the feedbacks. */
export const TCR_LANE_CHOICES = TCR_LANES.map((id) => ({ id, label: TCR_LANE_LABEL[id] }))

/** Group number 1..4 of a KumaPoint lane (`kumapoint` = 1, `kumapoint3` = 3). */
export function groupOfLane(lane: string): number {
	if (lane === 'kumapoint') return 1
	const n = Number(lane.replace('kumapoint', ''))
	return Number.isInteger(n) && n >= 1 && n <= KP_SLOTS ? n : 0
}

/** True while the lane's own source has a TCR line up. */
export function laneLineActive(data: KumaApiStatus, lane: TcrLane): boolean {
	return Boolean(data[`tcr_${lane}_line_active`])
}

/** The lane's own TCR text (empty when that source is not playing). */
export function laneLine(data: KumaApiStatus, lane: TcrLane): string {
	const v = data[`tcr_${lane}_line`]
	return typeof v === 'string' ? v : ''
}

/** Seconds → "MM:SS" ("H:MM:SS" from an hour up); '' for anything unusable. */
function mmss(seconds: number | null | undefined): string {
	if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return ''
	const s = Math.floor(seconds)
	const h = Math.floor(s / 3600)
	const m = Math.floor((s % 3600) / 60)
	const sec = s % 60
	const mm = String(m).padStart(2, '0')
	return h > 0 ? `${h}:${mm}:${String(sec).padStart(2, '0')}` : `${mm}:${String(sec).padStart(2, '0')}`
}

/** One presenter machine as the operator reads it: "PLAYING 00:23", "IDLE" or "NO SIGNAL". */
export function inputState(input: NonNullable<KumaApiStatus['kumapoint_inputs']>[number]): string {
	if (input.playing) {
		const t = mmss(input.remaining)
		return t ? `PLAYING ${t}` : 'PLAYING'
	}
	return input.receiving ? 'IDLE' : 'NO SIGNAL'
}

/** The group summary for KumaPoint group `n` (1..4), if the host reports it. */
export function groupStatus(
	data: KumaApiStatus,
	n: number,
): NonNullable<KumaApiStatus['kumapoint_groups']>[number] | undefined {
	const lane = n === 1 ? 'kumapoint' : `kumapoint${n}`
	return (data.kumapoint_groups ?? []).find((g) => g.lane === lane)
}

// ─── Variables ───────────────────────────────────────────────────────────────

export function tcrVariableDefinitions(): CompanionVariableDefinitions {
	const d: CompanionVariableDefinitions = {
		tcr_active_source: {
			name: 'TCR: source whose line is shown now (QLAB / MITTI / MILLUMIN / KUMAPOINT, empty when none)',
		},
		kp_backup_active: { name: 'PowerPoint: a BACKUP machine is on air (true/false)' },
		kp_diverged: { name: 'PowerPoint: a primary and its backup disagree on the time left (true/false)' },
	}
	for (const lane of TCR_LANES) {
		d[`tcr_${lane}_line`] = {
			name: `TCR ${TCR_LANE_LABEL[lane]}: its own readout, e.g. 00:23 (empty when not playing)`,
		}
		d[`tcr_${lane}_active`] = { name: `TCR ${TCR_LANE_LABEL[lane]}: has a line up (true/false)` }
	}
	for (let n = 1; n <= KP_SLOTS; n++) {
		d[`kp_group${n}_active_input`] = { name: `PowerPoint group ${n}: machine on air (name, empty when none)` }
		d[`kp_group${n}_using_backup`] = { name: `PowerPoint group ${n}: the BACKUP is on air (true/false)` }
		d[`kp_group${n}_diverge_s`] = {
			name: `PowerPoint group ${n}: primary vs backup time difference in seconds (empty when unknown)`,
		}
		d[`kp_input${n}_name`] = { name: `PowerPoint machine ${n}: name` }
		d[`kp_input${n}_state`] = { name: `PowerPoint machine ${n}: PLAYING 00:23 / IDLE / NO SIGNAL` }
	}
	return d
}

export function tcrVariableValues(data: KumaApiStatus): CompanionVariableValues {
	const v: CompanionVariableValues = {
		tcr_active_source: (data.tcr_active_source ?? '').toUpperCase(),
		kp_backup_active: String(data.kumapoint_backup_active ?? false),
		kp_diverged: String(data.kumapoint_diverged ?? false),
	}
	for (const lane of TCR_LANES) {
		v[`tcr_${lane}_line`] = laneLine(data, lane)
		v[`tcr_${lane}_active`] = String(laneLineActive(data, lane))
	}
	const inputs = data.kumapoint_inputs ?? []
	for (let n = 1; n <= KP_SLOTS; n++) {
		const g = groupStatus(data, n)
		v[`kp_group${n}_active_input`] = g?.active_input ?? ''
		v[`kp_group${n}_using_backup`] = String(g?.using_backup ?? false)
		v[`kp_group${n}_diverge_s`] = typeof g?.diverge_s === 'number' ? String(g.diverge_s) : ''
		const inp = inputs[n - 1]
		v[`kp_input${n}_name`] = inp?.name ?? ''
		v[`kp_input${n}_state`] = inp ? inputState(inp) : ''
	}
	return v
}

/** Values while the host is unreachable: everything empty / false. */
export function tcrVariableDefaults(): CompanionVariableValues {
	return tcrVariableValues({} as KumaApiStatus)
}
