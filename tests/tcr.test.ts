import { describe, it, expect, vi } from 'vitest'

vi.mock('@companion-module/base', () => ({
	combineRgb: (r: number, g: number, b: number) => (r << 16) | (g << 8) | b,
}))

import {
	TCR_LANES,
	groupOfLane,
	groupStatus,
	inputState,
	laneLine,
	laneLineActive,
	tcrVariableDefaults,
	tcrVariableDefinitions,
	tcrVariableValues,
} from '../src/tcr.js'
import { setupFeedbacks } from '../src/feedbacks.js'
import type { KumaApiStatus } from '../src/types.js'

// GFX 1 + GFX 1 BACKUP (group 1) and GFX 2 + GFX 2 BACKUP (group 2); the backup of
// group 1 is on air because its primary went quiet.
const SHOW: KumaApiStatus = {
	tcr_source: 'kumapoint',
	tcr_active_source: 'kumapoint2',
	tcr_extra_sources: ['qlab'],
	tcr_qlab_line: 'QLAB 00:12',
	tcr_qlab_line_active: true,
	tcr_kumapoint_line: 'GFX 1 BACKUP 00:48',
	tcr_kumapoint_line_active: true,
	tcr_kumapoint2_line: 'GFX 2 00:40',
	tcr_kumapoint2_line_active: true,
	kumapoint_inputs: [
		{
			name: 'GFX 1',
			lane: 'kumapoint',
			role: 'primary',
			port: 8010,
			receiving: false,
			playing: false,
			remaining: null,
			media: '',
			active: false,
		},
		{
			name: 'GFX 1 BACKUP',
			lane: 'kumapoint',
			role: 'backup',
			port: 8011,
			receiving: true,
			playing: true,
			remaining: 47.6,
			media: 'vt',
			active: true,
		},
		{
			name: 'GFX 2',
			lane: 'kumapoint2',
			role: 'primary',
			port: 8012,
			receiving: true,
			playing: true,
			remaining: 40,
			media: 'vt',
			active: true,
		},
		{
			name: 'GFX 2 BACKUP',
			lane: 'kumapoint2',
			role: 'backup',
			port: 8013,
			receiving: true,
			playing: false,
			remaining: null,
			media: '',
			active: false,
		},
	],
	kumapoint_groups: [
		{
			lane: 'kumapoint',
			active_input: 'GFX 1 BACKUP',
			using_backup: true,
			primary_ok: false,
			backup_ok: true,
			diverge_s: null,
			diverged: false,
		},
		{
			lane: 'kumapoint2',
			active_input: 'GFX 2',
			using_backup: false,
			primary_ok: true,
			backup_ok: true,
			diverge_s: 3.5,
			diverged: true,
		},
	],
	kumapoint_backup_active: true,
	kumapoint_diverged: true,
}

describe('lane helpers', () => {
	it('maps lanes to PowerPoint group numbers', () => {
		expect(groupOfLane('kumapoint')).toBe(1)
		expect(groupOfLane('kumapoint2')).toBe(2)
		expect(groupOfLane('kumapoint4')).toBe(4)
		expect(groupOfLane('qlab')).toBe(0)
		expect(groupOfLane('kumapoint9')).toBe(0)
	})
	it('reads each lane own line, blank / false on an old host', () => {
		expect(laneLine(SHOW, 'qlab')).toBe('QLAB 00:12')
		expect(laneLineActive(SHOW, 'kumapoint2')).toBe(true)
		expect(laneLine({}, 'mitti')).toBe('')
		expect(laneLineActive({}, 'mitti')).toBe(false)
	})
	it('formats a machine state', () => {
		const [a, b, , d] = SHOW.kumapoint_inputs!
		expect(inputState(a)).toBe('NO SIGNAL')
		expect(inputState(b)).toBe('PLAYING 00:47')
		expect(inputState(d)).toBe('IDLE')
	})
	it('finds a group by number', () => {
		expect(groupStatus(SHOW, 2)?.diverge_s).toBe(3.5)
		expect(groupStatus(SHOW, 3)).toBeUndefined()
	})
})

describe('variables', () => {
	it('defines 39 variables and every value key is defined', () => {
		const defs = Object.keys(tcrVariableDefinitions())
		expect(defs).toHaveLength(39)
		for (const k of Object.keys(tcrVariableValues(SHOW))) expect(defs).toContain(k)
		for (const k of Object.keys(tcrVariableDefaults())) expect(defs).toContain(k)
	})
	it('exposes each lane line and the machines', () => {
		const v = tcrVariableValues(SHOW)
		expect(v.tcr_active_source).toBe('KUMAPOINT2')
		expect(v.tcr_qlab_line).toBe('QLAB 00:12')
		expect(v.tcr_kumapoint2_line).toBe('GFX 2 00:40')
		expect(v.tcr_mitti_active).toBe('false')
		expect(v.kp_group1_active_input).toBe('GFX 1 BACKUP')
		expect(v.kp_group1_using_backup).toBe('true')
		expect(v.kp_group2_diverge_s).toBe('3.5')
		expect(v.kp_group1_diverge_s).toBe('')
		expect(v.kp_input1_name).toBe('GFX 1')
		expect(v.kp_input1_state).toBe('NO SIGNAL')
		expect(v.kp_input3_state).toBe('PLAYING 00:40')
		expect(v.kp_input4_state).toBe('IDLE')
		expect(v.kp_backup_active).toBe('true')
		expect(v.kp_diverged).toBe('true')
	})
	it('is all empty / false against an older host', () => {
		const v = tcrVariableValues({})
		expect(v.tcr_active_source).toBe('')
		expect(v.kp_backup_active).toBe('false')
		expect(v.kp_input1_state).toBe('')
		for (const lane of TCR_LANES) {
			expect(v[`tcr_${lane}_line`]).toBe('')
			expect(v[`tcr_${lane}_active`]).toBe('false')
		}
	})
})

describe('feedbacks', () => {
	function cb(status: KumaApiStatus, id: string, options: Record<string, unknown>): boolean {
		const f = setupFeedbacks(() => status)[id] as unknown as {
			callback: (fb: { options: Record<string, unknown> }) => boolean
		}
		return f.callback({ options })
	}
	it('tcr_lane_active follows the lane own line', () => {
		expect(cb(SHOW, 'tcr_lane_active', { lane: 'qlab' })).toBe(true)
		expect(cb(SHOW, 'tcr_lane_active', { lane: 'mitti' })).toBe(false)
		expect(cb(SHOW, 'tcr_lane_active', { lane: 'bogus' })).toBe(false)
	})
	it('tcr_active_source_is treats every PowerPoint group as PowerPoint', () => {
		expect(cb(SHOW, 'tcr_active_source_is', { source: 'kumapoint' })).toBe(true)
		expect(cb(SHOW, 'tcr_active_source_is', { source: 'qlab' })).toBe(false)
		expect(cb({ tcr_active_source: 'qlab' }, 'tcr_active_source_is', { source: 'qlab' })).toBe(true)
	})
	it('backup-on-air and diverged work per group and for any group', () => {
		expect(cb(SHOW, 'kp_backup_on_air', { group: '0' })).toBe(true)
		expect(cb(SHOW, 'kp_backup_on_air', { group: '1' })).toBe(true)
		expect(cb(SHOW, 'kp_backup_on_air', { group: '2' })).toBe(false)
		expect(cb(SHOW, 'kp_diverged', { group: '2' })).toBe(true)
		expect(cb(SHOW, 'kp_diverged', { group: '1' })).toBe(false)
		expect(cb({}, 'kp_backup_on_air', { group: '0' })).toBe(false)
	})
	it('machine state matches the row and the state', () => {
		expect(cb(SHOW, 'kp_machine_state', { machine: '1', state: 'NO SIGNAL' })).toBe(true)
		expect(cb(SHOW, 'kp_machine_state', { machine: '2', state: 'PLAYING' })).toBe(true)
		expect(cb(SHOW, 'kp_machine_state', { machine: '4', state: 'IDLE' })).toBe(true)
		expect(cb(SHOW, 'kp_machine_state', { machine: '2', state: 'NO SIGNAL' })).toBe(false)
		expect(cb({}, 'kp_machine_state', { machine: '1', state: 'NO SIGNAL' })).toBe(false)
	})
})
