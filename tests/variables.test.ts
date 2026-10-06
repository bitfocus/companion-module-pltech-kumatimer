import { describe, it, expect, vi } from 'vitest'

vi.mock('@companion-module/base', () => ({}))

import { setupVariables, updateVariables, clearVariables, splitTimer } from '../src/variables.js'
import type { KumaApiStatus } from '../src/types.js'

/** Minimal mock of InstanceBase — only the methods we care about. */
function makeMockInstance() {
	const setVariableDefinitions = vi.fn()
	const setVariableValues = vi.fn()
	return { setVariableDefinitions, setVariableValues } as unknown as Parameters<typeof setupVariables>[0]
}

describe('setupVariables', () => {
	it('calls setVariableDefinitions with 9 variable entries', () => {
		const instance = makeMockInstance()
		setupVariables(instance)
		const mock = (instance as unknown as { setVariableDefinitions: ReturnType<typeof vi.fn> }).setVariableDefinitions
		expect(mock).toHaveBeenCalledOnce()
		// In v2 the API takes an object keyed by variableId, not an array.
		const defs = mock.mock.calls[0][0] as Record<string, { name: string }>
		const ids = Object.keys(defs)
		expect(ids).toContain('timer')
		expect(ids).toContain('timer_seconds')
		expect(ids).toContain('status')
		expect(ids).toContain('display_mode')
		expect(ids).toContain('cue_name')
		expect(ids).toContain('cue_index')
		expect(ids).toContain('overtime')
		expect(ids).toContain('progress')
		expect(ids).toContain('sms_active')
		// v2.0.1: per-preset (6 × 3 = 18) and per-cue (12 × 4 = 48)
		// variables for use in user-built button labels. Thomas
		// request 8 May 2026.
		expect(ids).toContain('preset_1_minutes')
		expect(ids).toContain('preset_6_label')
		expect(ids).toContain('cue_1_name')
		expect(ids).toContain('cue_12_label')
		expect(ids).toContain('qlab_following')
		expect(ids).toContain('qlab_cue')
		expect(ids).toContain('qlab_hold')
		// 38 base (9 + 7 qlab + 8 state flags + 5 timer parts + 3 timecodes + 6 tcr/glide/jump) + 18 preset + 48 cue + 13 layout (1 active + 12 names) = 117
		expect(ids).toHaveLength(117)
	})

	it('calls clearVariables (setVariableValues) immediately', () => {
		const instance = makeMockInstance()
		setupVariables(instance)
		const mock = (instance as unknown as { setVariableValues: ReturnType<typeof vi.fn> }).setVariableValues
		expect(mock).toHaveBeenCalledOnce()
		const values = mock.mock.calls[0][0] as Record<string, string>
		expect(values.status).toBe('OFFLINE')
	})
})

describe('updateVariables', () => {
	function callUpdate(data: KumaApiStatus): Record<string, string> {
		const instance = makeMockInstance()
		updateVariables(instance, data)
		const mock = (instance as unknown as { setVariableValues: ReturnType<typeof vi.fn> }).setVariableValues
		return mock.mock.calls[0][0] as Record<string, string>
	}

	it('maps timer field directly', () => {
		expect(callUpdate({ timer: '05:30' }).timer).toBe('05:30')
	})

	it('defaults timer to "--:--" when undefined', () => {
		expect(callUpdate({}).timer).toBe('--:--')
	})

	it('converts timer_seconds to string', () => {
		expect(callUpdate({ timer_seconds: 330 }).timer_seconds).toBe('330')
	})

	it('defaults timer_seconds to "0"', () => {
		expect(callUpdate({}).timer_seconds).toBe('0')
	})

	it('uppercases status', () => {
		expect(callUpdate({ status: 'live' }).status).toBe('LIVE')
		expect(callUpdate({ status: 'paused' }).status).toBe('PAUSED')
		expect(callUpdate({ status: 'standby' }).status).toBe('STANDBY')
		expect(callUpdate({ status: 'hidden' }).status).toBe('HIDDEN')
	})

	it('defaults status to "STANDBY" when undefined', () => {
		expect(callUpdate({}).status).toBe('STANDBY')
	})

	it('uppercases display_mode', () => {
		expect(callUpdate({ display_mode: 'timer' }).display_mode).toBe('TIMER')
		expect(callUpdate({ display_mode: 'CLOCK' }).display_mode).toBe('CLOCK')
	})

	it('defaults display_mode to "TIMER"', () => {
		expect(callUpdate({}).display_mode).toBe('TIMER')
	})

	it('uses em-dash placeholder when cue_name is empty string', () => {
		expect(callUpdate({ cue_name: '' }).cue_name).toBe('—')
	})

	it('uses em-dash placeholder when cue_name is undefined', () => {
		expect(callUpdate({}).cue_name).toBe('—')
	})

	it('uses actual cue_name when provided', () => {
		expect(callUpdate({ cue_name: 'John Smith' }).cue_name).toBe('John Smith')
	})

	it('converts cue_index to string', () => {
		expect(callUpdate({ cue_index: 3 }).cue_index).toBe('3')
	})

	it('defaults cue_index to "-1"', () => {
		expect(callUpdate({}).cue_index).toBe('-1')
	})

	it('converts overtime boolean to string', () => {
		expect(callUpdate({ overtime: true }).overtime).toBe('true')
		expect(callUpdate({ overtime: false }).overtime).toBe('false')
	})

	it('defaults overtime to "false"', () => {
		expect(callUpdate({}).overtime).toBe('false')
	})

	it('converts progress to string', () => {
		expect(callUpdate({ progress: 75 }).progress).toBe('75')
	})

	it('defaults progress to "0"', () => {
		expect(callUpdate({}).progress).toBe('0')
	})

	it('converts sms_active boolean to string', () => {
		expect(callUpdate({ sms_active: true }).sms_active).toBe('true')
		expect(callUpdate({ sms_active: false }).sms_active).toBe('false')
	})

	it('defaults sms_active to "false"', () => {
		expect(callUpdate({}).sms_active).toBe('false')
	})
})

describe('clearVariables', () => {
	function callClear(): Record<string, string> {
		const instance = makeMockInstance()
		clearVariables(instance)
		const mock = (instance as unknown as { setVariableValues: ReturnType<typeof vi.fn> }).setVariableValues
		return mock.mock.calls[0][0] as Record<string, string>
	}

	it('sets status to OFFLINE', () => {
		expect(callClear().status).toBe('OFFLINE')
	})

	it('sets timer to "--:--"', () => {
		expect(callClear().timer).toBe('--:--')
	})

	it('sets timer_seconds to "0"', () => {
		expect(callClear().timer_seconds).toBe('0')
	})

	it('sets display_mode to "TIMER"', () => {
		expect(callClear().display_mode).toBe('TIMER')
	})

	it('sets cue_name to em-dash', () => {
		expect(callClear().cue_name).toBe('—')
	})

	it('sets cue_index to "-1"', () => {
		expect(callClear().cue_index).toBe('-1')
	})

	it('sets overtime to "false"', () => {
		expect(callClear().overtime).toBe('false')
	})

	it('sets progress to "0"', () => {
		expect(callClear().progress).toBe('0')
	})

	it('sets sms_active to "false"', () => {
		expect(callClear().sms_active).toBe('false')
	})
})

// v2.5.0 — feedback-only state flags exposed as variables, under the SAME ids
// as their feedbacks (feedbacks.ts). [variable id, field on /api/status]. The
// LTC Generator is `ltc_tx_*` on the wire but `ltc_generator_*` everywhere else.
const STATE_FLAGS: Array<[string, keyof KumaApiStatus]> = [
	['omt_enabled', 'omt_enabled'],
	['omt_active', 'omt_active'],
	['ltc_generator_enabled', 'ltc_tx_enabled'],
	['ltc_generator_active', 'ltc_tx_active'],
	['ltc_chase_enabled', 'ltc_chase_enabled'],
	['ltc_chase_active', 'ltc_chase_active'],
	['dsan_rx_active', 'dsan_rx_active'],
	['blackmagic_active', 'blackmagic_active'],
]

describe('state-flag variables (v2.5.0)', () => {
	const values = (fn: (i: Parameters<typeof setupVariables>[0]) => void): Record<string, string> => {
		const instance = makeMockInstance()
		fn(instance)
		const mock = (instance as unknown as { setVariableValues: ReturnType<typeof vi.fn> }).setVariableValues
		return mock.mock.calls[0][0] as Record<string, string>
	}

	it.each(STATE_FLAGS)('%s is defined as a variable', (id) => {
		const instance = makeMockInstance()
		setupVariables(instance)
		const mock = (instance as unknown as { setVariableDefinitions: ReturnType<typeof vi.fn> }).setVariableDefinitions
		const defs = mock.mock.calls[0][0] as Record<string, { name: string }>
		expect(defs[id]).toBeDefined()
		expect(defs[id].name).toMatch(/\(true\/false\)$/)
	})

	it.each(STATE_FLAGS)('%s <- %s maps true to "true"', (id, field) => {
		expect(values((i) => updateVariables(i, { [field]: true } as KumaApiStatus))[id]).toBe('true')
	})

	it.each(STATE_FLAGS)('%s <- %s maps false to "false"', (id, field) => {
		expect(values((i) => updateVariables(i, { [field]: false } as KumaApiStatus))[id]).toBe('false')
	})

	it.each(STATE_FLAGS)('%s defaults to "false" when the host omits the field', (id) => {
		expect(values((i) => updateVariables(i, {}))[id]).toBe('false')
	})

	it('does not cross-wire the flags: only the one that is set turns true', () => {
		for (const [id, field] of STATE_FLAGS) {
			const v = values((i) => updateVariables(i, { [field]: true } as KumaApiStatus))
			for (const [otherId] of STATE_FLAGS) {
				expect(v[otherId]).toBe(otherId === id ? 'true' : 'false')
			}
		}
	})

	it('ignores the pre-rename names (ltc_generator_* is not read from the wire)', () => {
		const v = values((i) => updateVariables(i, { ltc_generator_enabled: true } as unknown as KumaApiStatus))
		expect(v.ltc_generator_enabled).toBe('false')
	})

	it.each(STATE_FLAGS)('clearVariables resets %s to "false"', (id) => {
		expect(values((i) => clearVariables(i))[id]).toBe('false')
	})
})

// v2.5.0 — timer split into HH / MM / SS / FF / whole-display variables.
describe('timer parts (v2.5.0)', () => {
	const parts = (data: KumaApiStatus) => {
		const t = splitTimer(data)
		return [t.hh, t.mm, t.ss, t.ff, t.full]
	}

	it('MM:SS format: no hours part, no frames', () => {
		expect(parts({ timer: '05:23', _timer_display: '05:23' })).toEqual(['00', '05', '23', '--', '05:23'])
	})

	it('HH:MM:SS format', () => {
		expect(parts({ timer: '01:05:23', _timer_display: '01:05:23' })).toEqual(['01', '05', '23', '--', '01:05:23'])
	})

	it('MM:SS:FR — a 3-part display over a 2-part timer means the last part is frames', () => {
		expect(parts({ timer: '05:23', _timer_display: '05:23:12' })).toEqual(['00', '05', '23', '12', '05:23:12'])
	})

	it('HH:MM:SS:FR', () => {
		expect(parts({ timer: '01:05:23', _timer_display: '01:05:23:12' })).toEqual(['01', '05', '23', '12', '01:05:23:12'])
	})

	it('LTC mode: timecode is already HH:MM:SS:FF', () => {
		expect(parts({ timer: '10:00:00:24', _timer_display: '10:00:00:24' })).toEqual([
			'10',
			'00',
			'00',
			'24',
			'10:00:00:24',
		])
	})

	it('older host without _timer_display: falls back to timer', () => {
		expect(parts({ timer: '07:08' })).toEqual(['00', '07', '08', '--', '07:08'])
		expect(parts({ timer: '02:07:08' })).toEqual(['02', '07', '08', '--', '02:07:08'])
	})

	it('minutes may exceed 59 in MM:SS and are kept as-is', () => {
		expect(parts({ timer: '75:00', _timer_display: '75:00' })).toEqual(['00', '75', '00', '--', '75:00'])
	})

	it('pads single digits', () => {
		expect(parts({ timer: '5:3', _timer_display: '5:3' })).toEqual(['00', '05', '03', '--', '5:3'])
	})

	it('nothing from the host: dashes, not zeros', () => {
		expect(parts({})).toEqual(['--', '--', '--', '--', '--:--'])
	})

	it.each(['--:--', 'abc', '1:2:3:4:5', '12:xx'])('unparseable %j gives dashes but keeps the text', (txt) => {
		const t = splitTimer({ timer: txt, _timer_display: txt })
		expect([t.hh, t.mm, t.ss, t.ff]).toEqual(['--', '--', '--', '--'])
		expect(t.full).toBe(txt)
	})

	it('updateVariables publishes the five variables, clearVariables resets them', () => {
		const set = vi.fn()
		const inst = { setVariableValues: set } as unknown as Parameters<typeof updateVariables>[0]
		updateVariables(inst, { timer: '05:23', _timer_display: '05:23:12' })
		expect(set.mock.calls[0][0]).toMatchObject({
			timer: '05:23',
			timer_hh: '00',
			timer_mm: '05',
			timer_ss: '23',
			timer_ff: '12',
			timer_full: '05:23:12',
		})
		clearVariables(inst)
		expect(set.mock.calls[1][0]).toMatchObject({
			timer_hh: '--',
			timer_mm: '--',
			timer_ss: '--',
			timer_ff: '--',
			timer_full: '--:--',
		})
	})

	it('the existing `timer` variable is unchanged (still the plain text, no frames)', () => {
		const set = vi.fn()
		updateVariables({ setVariableValues: set } as unknown as Parameters<typeof updateVariables>[0], {
			timer: '05:23',
			_timer_display: '05:23:12',
		})
		expect(set.mock.calls[0][0].timer).toBe('05:23')
	})
})

// v2.5.0 — timecode / timer TEXT from the host ('' = no signal).
describe('timecode variables (v2.5.0)', () => {
	const FIELDS = ['ltc_timecode', 'ltc_generator_timecode', 'dsan_rx_timer'] as const
	const run = (fn: (i: Parameters<typeof updateVariables>[0]) => void): Record<string, string> => {
		const set = vi.fn()
		fn({ setVariableValues: set } as unknown as Parameters<typeof updateVariables>[0])
		return set.mock.calls[0][0] as Record<string, string>
	}

	it.each(FIELDS)('%s is defined', (id) => {
		const defs = vi.fn()
		setupVariables({ setVariableDefinitions: defs, setVariableValues: vi.fn() } as unknown as Parameters<
			typeof setupVariables
		>[0])
		expect(Object.keys(defs.mock.calls[0][0])).toContain(id)
	})

	it.each(FIELDS)('%s passes the host text through verbatim', (id) => {
		expect(run((i) => updateVariables(i, { [id]: '01:02:03:04' } as KumaApiStatus))[id]).toBe('01:02:03:04')
	})

	it.each(FIELDS)('%s is empty when the host reports no signal', (id) => {
		expect(run((i) => updateVariables(i, { [id]: '' } as KumaApiStatus))[id]).toBe('')
	})

	it.each(FIELDS)('%s is empty (not "undefined") when an older host omits it', (id) => {
		expect(run((i) => updateVariables(i, {}))[id]).toBe('')
	})

	it.each(FIELDS)('clearVariables blanks %s', (id) => {
		expect(run((i) => clearVariables(i))[id]).toBe('')
	})

	it('the three sources do not bleed into each other', () => {
		const v = run((i) => updateVariables(i, { ltc_timecode: '10:00:00:01' }))
		expect(v.ltc_timecode).toBe('10:00:00:01')
		expect(v.ltc_generator_timecode).toBe('')
		expect(v.dsan_rx_timer).toBe('')
	})
})

// v2.5.0 — source-neutral TCR + Time Glide / Jump variables.
describe('TCR / Glide / Jump variables (v2.5.0)', () => {
	const run = (data: KumaApiStatus): Record<string, string> => {
		const set = vi.fn()
		updateVariables({ setVariableValues: set } as unknown as Parameters<typeof updateVariables>[0], data)
		return set.mock.calls[0][0] as Record<string, string>
	}

	it('tcr_source is upper-cased and defaults to OFF', () => {
		expect(run({ tcr_source: 'kumapoint' }).tcr_source).toBe('KUMAPOINT')
		expect(run({}).tcr_source).toBe('OFF')
	})

	it('tcr_following uses the new field, falling back to the legacy flag', () => {
		expect(run({ tcr_following: true }).tcr_following).toBe('true')
		expect(run({ tcr_following: false, qlab_following: true }).tcr_following).toBe('false')
		expect(run({ qlab_following: true }).tcr_following).toBe('true')
		expect(run({}).tcr_following).toBe('false')
	})

	it('tcr_line and tcr_name pass the host text through, blank when absent', () => {
		const v = run({ tcr_line: '00:23', tcr_name: 'Opening video' })
		expect(v.tcr_line).toBe('00:23')
		expect(v.tcr_name).toBe('Opening video')
		expect(run({}).tcr_line).toBe('')
		expect(run({}).tcr_name).toBe('')
	})

	it('time_glide_active / time_jump_active mirror warp_active / jump_active', () => {
		expect(run({ warp_active: true, jump_active: false })).toMatchObject({
			time_glide_active: 'true',
			time_jump_active: 'false',
		})
		expect(run({})).toMatchObject({ time_glide_active: 'false', time_jump_active: 'false' })
	})

	it('clearVariables resets all of them', () => {
		const set = vi.fn()
		clearVariables({ setVariableValues: set } as unknown as Parameters<typeof clearVariables>[0])
		expect(set.mock.calls[0][0]).toMatchObject({
			tcr_source: 'OFF',
			tcr_following: 'false',
			tcr_line: '',
			tcr_name: '',
			time_glide_active: 'false',
			time_jump_active: 'false',
		})
	})
})
