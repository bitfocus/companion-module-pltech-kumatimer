import { describe, it, expect, vi } from 'vitest'

vi.mock('@companion-module/base', () => ({}))

import { setupVariables, updateVariables, clearVariables } from '../src/variables.js'
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
		const defs = mock.mock.calls[0][0] as Array<{ variableId: string }>
		const ids = defs.map((d) => d.variableId)
		expect(ids).toContain('timer')
		expect(ids).toContain('timer_seconds')
		expect(ids).toContain('status')
		expect(ids).toContain('display_mode')
		expect(ids).toContain('cue_name')
		expect(ids).toContain('cue_index')
		expect(ids).toContain('overtime')
		expect(ids).toContain('progress')
		expect(ids).toContain('sms_active')
		expect(ids).toHaveLength(9)
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
