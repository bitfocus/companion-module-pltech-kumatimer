import { describe, it, expect, vi } from 'vitest'

vi.mock('@companion-module/base', () => ({
	combineRgb: (r: number, g: number, b: number) => (r << 16) | (g << 8) | b,
}))

import { setupFeedbacks } from '../src/feedbacks.js'
import { setupVariables, updateVariables } from '../src/variables.js'
import type { KumaApiStatus } from '../src/types.js'

// Helper: extract typed callback from a feedback definition
type FeedbackCallback = (feedback?: { options: Record<string, unknown> }) => boolean
function cb(feedbacks: ReturnType<typeof setupFeedbacks>, id: string): FeedbackCallback {
	return (feedbacks[id] as { callback: FeedbackCallback }).callback
}

describe('setupFeedbacks', () => {
	describe('is_live', () => {
		it('returns true when status is "live"', () => {
			const f = setupFeedbacks(() => ({ status: 'live' }))
			expect(cb(f, 'is_live')()).toBe(true)
		})
		it('returns false for paused', () => {
			const f = setupFeedbacks(() => ({ status: 'paused' }))
			expect(cb(f, 'is_live')()).toBe(false)
		})
		it('returns false for standby', () => {
			const f = setupFeedbacks(() => ({ status: 'standby' }))
			expect(cb(f, 'is_live')()).toBe(false)
		})
		it('returns false when status is undefined', () => {
			const f = setupFeedbacks(() => ({}))
			expect(cb(f, 'is_live')()).toBe(false)
		})
	})

	describe('is_paused', () => {
		it('returns true when status is "paused"', () => {
			const f = setupFeedbacks(() => ({ status: 'paused' }))
			expect(cb(f, 'is_paused')()).toBe(true)
		})
		it('returns false when status is "live"', () => {
			const f = setupFeedbacks(() => ({ status: 'live' }))
			expect(cb(f, 'is_paused')()).toBe(false)
		})
	})

	describe('is_standby', () => {
		it('returns true when status is "standby"', () => {
			const f = setupFeedbacks(() => ({ status: 'standby' }))
			expect(cb(f, 'is_standby')()).toBe(true)
		})
		it('returns false when status is "live"', () => {
			const f = setupFeedbacks(() => ({ status: 'live' }))
			expect(cb(f, 'is_standby')()).toBe(false)
		})
	})

	describe('is_hidden', () => {
		it('returns true when status is "hidden"', () => {
			const f = setupFeedbacks(() => ({ status: 'hidden' }))
			expect(cb(f, 'is_hidden')()).toBe(true)
		})
		it('returns false when status is "live"', () => {
			const f = setupFeedbacks(() => ({ status: 'live' }))
			expect(cb(f, 'is_hidden')()).toBe(false)
		})
	})

	describe('is_overtime', () => {
		it('returns true when overtime is true', () => {
			const f = setupFeedbacks(() => ({ overtime: true }))
			expect(cb(f, 'is_overtime')()).toBe(true)
		})
		it('returns false when overtime is false', () => {
			const f = setupFeedbacks(() => ({ overtime: false }))
			expect(cb(f, 'is_overtime')()).toBe(false)
		})
		it('returns false when overtime is undefined', () => {
			const f = setupFeedbacks(() => ({}))
			expect(cb(f, 'is_overtime')()).toBe(false)
		})
	})

	describe('is_cue_active', () => {
		it('returns true when cue_index matches options.index', () => {
			const f = setupFeedbacks(() => ({ cue_index: 2 }))
			expect(cb(f, 'is_cue_active')({ options: { index: 2 } })).toBe(true)
		})
		it('returns true with string/number coercion (index: "2", cue_index: 2)', () => {
			const f = setupFeedbacks(() => ({ cue_index: 2 }))
			expect(cb(f, 'is_cue_active')({ options: { index: '2' } })).toBe(true)
		})
		it('returns false when cue_index does not match', () => {
			const f = setupFeedbacks(() => ({ cue_index: 1 }))
			expect(cb(f, 'is_cue_active')({ options: { index: 0 } })).toBe(false)
		})
		it('returns false when cue_index is undefined', () => {
			const f = setupFeedbacks(() => ({}))
			expect(cb(f, 'is_cue_active')({ options: { index: 0 } })).toBe(false)
		})
	})

	describe('low_time', () => {
		it('returns true when progress is below threshold and above 0', () => {
			const f = setupFeedbacks(() => ({ progress: 15 }))
			expect(cb(f, 'low_time')({ options: { threshold: 20 } })).toBe(true)
		})
		it('returns true when progress equals threshold', () => {
			const f = setupFeedbacks(() => ({ progress: 20 }))
			expect(cb(f, 'low_time')({ options: { threshold: 20 } })).toBe(true)
		})
		it('returns false when progress exceeds threshold', () => {
			const f = setupFeedbacks(() => ({ progress: 50 }))
			expect(cb(f, 'low_time')({ options: { threshold: 20 } })).toBe(false)
		})
		it('returns false when progress is 0 (timer stopped)', () => {
			const f = setupFeedbacks(() => ({ progress: 0 }))
			expect(cb(f, 'low_time')({ options: { threshold: 20 } })).toBe(false)
		})
		it('defaults progress to 100 when undefined — no warning', () => {
			const f = setupFeedbacks(() => ({}))
			expect(cb(f, 'low_time')({ options: { threshold: 20 } })).toBe(false)
		})
	})

	describe('sms_active', () => {
		it('returns true when sms_active is true', () => {
			const f = setupFeedbacks(() => ({ sms_active: true }))
			expect(cb(f, 'sms_active')()).toBe(true)
		})
		it('returns false when sms_active is false', () => {
			const f = setupFeedbacks(() => ({ sms_active: false }))
			expect(cb(f, 'sms_active')()).toBe(false)
		})
		it('returns false when sms_active is undefined', () => {
			const f = setupFeedbacks(() => ({}))
			expect(cb(f, 'sms_active')()).toBe(false)
		})
	})

	describe('is_countup', () => {
		it('returns true when status is countup', () => {
			const f = setupFeedbacks(() => ({ status: 'countup' }))
			expect(cb(f, 'is_countup')()).toBe(true)
		})
		it('returns false when status is not countup', () => {
			const f = setupFeedbacks(() => ({ status: 'live' }))
			expect(cb(f, 'is_countup')()).toBe(false)
		})
		it('returns false when status is undefined', () => {
			const f = setupFeedbacks(() => ({}))
			expect(cb(f, 'is_countup')()).toBe(false)
		})
	})

	describe('v1.19.0 feedbacks', () => {
		const cases: Array<[string, keyof KumaApiStatus]> = [
			['omt_enabled', 'omt_enabled'],
			['omt_active', 'omt_active'],
			['ltc_generator_enabled', 'ltc_tx_enabled'],
			['ltc_generator_active', 'ltc_tx_active'],
			['ltc_chase_enabled', 'ltc_chase_enabled'],
			['ltc_chase_active', 'ltc_chase_active'],
			['dsan_rx_active', 'dsan_rx_active'],
			['blackmagic_active', 'blackmagic_active'],
		]
		for (const [feedbackId, statusKey] of cases) {
			it(`${feedbackId} mirrors status.${statusKey}`, () => {
				const on = setupFeedbacks(() => ({ [statusKey]: true }) as KumaApiStatus)
				expect(cb(on, feedbackId)()).toBe(true)
				const off = setupFeedbacks(() => ({ [statusKey]: false }) as KumaApiStatus)
				expect(cb(off, feedbackId)()).toBe(false)
				const missing = setupFeedbacks(() => ({}))
				expect(cb(missing, feedbackId)()).toBe(false)
			})
		}
	})

	it('exposes all 28 feedbacks', () => {
		const f = setupFeedbacks(() => ({}))
		const ids = Object.keys(f)
		expect(ids).toContain('is_live')
		expect(ids).toContain('is_paused')
		expect(ids).toContain('is_standby')
		expect(ids).toContain('is_hidden')
		expect(ids).toContain('is_overtime')
		expect(ids).toContain('is_cue_active')
		expect(ids).toContain('low_time')
		expect(ids).toContain('sms_active')
		expect(ids).toContain('is_countup')
		expect(ids).toContain('qlab_following')
		expect(ids).toContain('qlab_follow_idle')
		expect(ids).toContain('qlab_hold')
		expect(ids).toContain('qlab_follow_enabled')
		expect(ids).toContain('qlab_triggers_enabled')
		expect(ids).toContain('omt_enabled')
		expect(ids).toContain('omt_active')
		expect(ids).toContain('ltc_generator_enabled')
		expect(ids).toContain('ltc_generator_active')
		expect(ids).toContain('ltc_chase_enabled')
		expect(ids).toContain('ltc_chase_active')
		expect(ids).toContain('dsan_rx_active')
		expect(ids).toContain('blackmagic_active')
		for (const id of [
			'tcr_following',
			'tcr_source_is',
			'time_glide_active',
			'time_jump_active',
			'display_mode_is',
			'layout_is_active',
		])
			expect(ids).toContain(id)
		expect(ids).toHaveLength(28)
	})

	it('uses latest status snapshot on every call', () => {
		let currentStatus: KumaApiStatus = { status: 'standby' }
		const f = setupFeedbacks(() => currentStatus)
		expect(cb(f, 'is_live')()).toBe(false)
		currentStatus = { status: 'live' }
		expect(cb(f, 'is_live')()).toBe(true)
	})
})

// v2.5.0 — the feedback-only state flags are also exposed as variables, under
// the SAME id and driven by the SAME /api/status field as their feedback, so a
// button and an external dashboard can never disagree about a state.
describe('state flags: feedback and variable stay in lock-step (v2.5.0)', () => {
	const FLAGS: Array<[string, keyof KumaApiStatus]> = [
		['omt_enabled', 'omt_enabled'],
		['omt_active', 'omt_active'],
		['ltc_generator_enabled', 'ltc_tx_enabled'],
		['ltc_generator_active', 'ltc_tx_active'],
		['ltc_chase_enabled', 'ltc_chase_enabled'],
		['ltc_chase_active', 'ltc_chase_active'],
		['dsan_rx_active', 'dsan_rx_active'],
		['blackmagic_active', 'blackmagic_active'],
		['tcr_following', 'tcr_following'],
		['time_glide_active', 'warp_active'],
		['time_jump_active', 'jump_active'],
	]
	function varValues(data: KumaApiStatus): Record<string, string> {
		const setVariableValues = vi.fn()
		updateVariables({ setVariableValues } as unknown as Parameters<typeof updateVariables>[0], data)
		return setVariableValues.mock.calls[0][0] as Record<string, string>
	}
	function varIds(): string[] {
		const setVariableDefinitions = vi.fn()
		const setVariableValues = vi.fn()
		setupVariables({ setVariableDefinitions, setVariableValues } as unknown as Parameters<typeof setupVariables>[0])
		return Object.keys(setVariableDefinitions.mock.calls[0][0] as Record<string, unknown>)
	}

	it.each(FLAGS)('%s exists as both a feedback and a variable', (id) => {
		expect(Object.keys(setupFeedbacks(() => ({})))).toContain(id)
		expect(varIds()).toContain(id)
	})

	it.each(FLAGS)('%s: variable and feedback agree for true / false / missing', (id, field) => {
		for (const value of [true, false, undefined]) {
			const data = { [field]: value } as KumaApiStatus
			const feedback = cb(
				setupFeedbacks(() => data),
				id,
			)()
			expect(varValues(data)[id]).toBe(String(feedback))
		}
	})
})

// v2.5.0 — source-neutral TCR, Time Glide / Jump, display mode, layout.
describe('TCR / Glide / Jump / mode / layout feedbacks (v2.5.0)', () => {
	const fb = (id: string, status: KumaApiStatus, options: Record<string, unknown> = {}) =>
		cb(
			setupFeedbacks(() => status),
			id,
		)({ options })

	describe('tcr_following', () => {
		it('is true when the host says a source is driving the timer (KumaPoint included)', () => {
			expect(fb('tcr_following', { tcr_following: true, tcr_source: 'kumapoint' })).toBe(true)
		})
		it('is false when nothing is following', () => {
			expect(fb('tcr_following', { tcr_following: false })).toBe(false)
		})
		it('falls back to the legacy flag on an older host', () => {
			expect(fb('tcr_following', { qlab_following: true })).toBe(true)
		})
		it('prefers the new field over the legacy one', () => {
			expect(fb('tcr_following', { tcr_following: false, qlab_following: true })).toBe(false)
		})
	})

	describe('tcr_source_is', () => {
		it.each(['qlab', 'mitti', 'millumin', 'kumapoint', 'off'])('matches %s', (src) => {
			expect(fb('tcr_source_is', { tcr_source: src }, { source: src })).toBe(true)
		})
		it('does not match a different source', () => {
			expect(fb('tcr_source_is', { tcr_source: 'qlab' }, { source: 'kumapoint' })).toBe(false)
		})
		it('treats a missing field as off', () => {
			expect(fb('tcr_source_is', {}, { source: 'off' })).toBe(true)
			expect(fb('tcr_source_is', {}, { source: 'qlab' })).toBe(false)
		})
		it('is case-insensitive about the host value', () => {
			expect(fb('tcr_source_is', { tcr_source: 'KumaPoint' }, { source: 'kumapoint' })).toBe(true)
		})
	})

	it('time_glide_active follows warp_active', () => {
		expect(fb('time_glide_active', { warp_active: true })).toBe(true)
		expect(fb('time_glide_active', { warp_active: false })).toBe(false)
		expect(fb('time_glide_active', {})).toBe(false)
	})

	it('time_jump_active follows jump_active', () => {
		expect(fb('time_jump_active', { jump_active: true })).toBe(true)
		expect(fb('time_jump_active', {})).toBe(false)
	})

	describe('display_mode_is', () => {
		it('matches the current mode', () => {
			expect(fb('display_mode_is', { display_mode: 'CLOCK' }, { mode: 'CLOCK' })).toBe(true)
			expect(fb('display_mode_is', { display_mode: 'CLOCK' }, { mode: 'TIMER' })).toBe(false)
		})
		it('treats a missing mode as TIMER and ignores case', () => {
			expect(fb('display_mode_is', {}, { mode: 'TIMER' })).toBe(true)
			expect(fb('display_mode_is', { display_mode: 'clock' }, { mode: 'CLOCK' })).toBe(true)
		})
	})

	describe('layout_is_active', () => {
		const status: KumaApiStatus = {
			layout_presets: [
				{ slot: 1, id: 'a1', name: 'Stage' },
				{ slot: 2, id: 'b2', name: 'Lower Third' },
			],
			layout_preset_active: 'b2',
		}
		it('matches by slot', () => {
			expect(fb('layout_is_active', status, { mode: 'slot', slot: 2 })).toBe(true)
			expect(fb('layout_is_active', status, { mode: 'slot', slot: 1 })).toBe(false)
		})
		it('matches by name, ignoring case and surrounding spaces', () => {
			expect(fb('layout_is_active', status, { mode: 'name', name: '  lower third ' })).toBe(true)
			expect(fb('layout_is_active', status, { mode: 'name', name: 'Stage' })).toBe(false)
		})
		it('is false when no layout is active, the slot does not exist, or the name is unknown', () => {
			expect(fb('layout_is_active', { ...status, layout_preset_active: '' }, { mode: 'slot', slot: 2 })).toBe(false)
			expect(fb('layout_is_active', status, { mode: 'slot', slot: 9 })).toBe(false)
			expect(fb('layout_is_active', status, { mode: 'name', name: 'nope' })).toBe(false)
			expect(fb('layout_is_active', {}, { mode: 'slot', slot: 1 })).toBe(false)
		})
	})

	it('legacy qlab_following / qlab_hold feedbacks keep their ids and behaviour', () => {
		expect(fb('qlab_following', { qlab_following: true })).toBe(true)
		expect(fb('qlab_hold', { qlab_hold: true })).toBe(true)
	})
})
