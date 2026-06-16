import { describe, it, expect, vi } from 'vitest'
import { setupActions } from '../src/actions.js'

// CompanionActionDefinitions is a type-only import — no runtime mock needed.
vi.mock('@companion-module/base', () => ({}))

type ActionCallback = (action?: { options: Record<string, unknown> }) => Promise<void>

function getCallbackAndMock(id: string): {
	callback: ActionCallback
	sendCommand: ReturnType<typeof vi.fn>
} {
	const sendCommand = vi.fn().mockResolvedValue(undefined)
	const actions = setupActions(sendCommand)
	const action = actions[id] as { callback: ActionCallback }
	return { callback: action.callback, sendCommand }
}

describe('setupActions', () => {
	it('exposes all 23 actions', () => {
		const { sendCommand } = getCallbackAndMock('start')
		const actions = setupActions(sendCommand)
		const ids = Object.keys(actions)
		const expected = [
			'start',
			'pause',
			'reset',
			'hide',
			'add_minute',
			'sub_minute',
			'adjust_time',
			'load_time',
			'load_time_mmss',
			'load_time_hhmmss',
			'preset',
			'load_cue',
			'next_cue',
			'prev_cue',
			'set_mode',
			'send_sms',
			'cancel_sms',
			'count_up',
			'qlab_hold',
			'qlab_follow_enable',
			'qlab_triggers_enable',
			'qlab_set_follow_cue',
			'recall_layout',
		]
		expect(ids).toHaveLength(23)
		for (const id of expected) expect(ids).toContain(id)
	})

	describe('simple command actions (no options)', () => {
		const simple: Array<[string, string]> = [
			['start', 'start'],
			['pause', 'pause'],
			['reset', 'reset'],
			['hide', 'hide'],
			['add_minute', 'add_minute'],
			['sub_minute', 'sub_minute'],
			['next_cue', 'next_cue'],
			['prev_cue', 'prev_cue'],
			['cancel_sms', 'cancel_sms'],
			['count_up', 'count_up'],
		]

		for (const [actionId, command] of simple) {
			it(`${actionId} calls sendCommand('${command}')`, async () => {
				const { callback, sendCommand } = getCallbackAndMock(actionId)
				await callback()
				expect(sendCommand).toHaveBeenCalledOnce()
				expect(sendCommand).toHaveBeenCalledWith(command)
			})
		}
	})

	describe('load_time', () => {
		it('sends load_time with numeric seconds', async () => {
			const { callback, sendCommand } = getCallbackAndMock('load_time')
			await callback({ options: { seconds: 300 } })
			expect(sendCommand).toHaveBeenCalledWith('load_time', { seconds: 300 })
		})

		it('coerces string seconds to number', async () => {
			const { callback, sendCommand } = getCallbackAndMock('load_time')
			await callback({ options: { seconds: '120' } })
			expect(sendCommand).toHaveBeenCalledWith('load_time', { seconds: 120 })
		})
	})

	describe('load_time_mmss', () => {
		it('converts minutes + seconds to total seconds', async () => {
			const { callback, sendCommand } = getCallbackAndMock('load_time_mmss')
			await callback({ options: { minutes: 5, seconds: 30 } })
			expect(sendCommand).toHaveBeenCalledWith('load_time', { seconds: 330 })
		})

		it('handles 0:00 (zero values)', async () => {
			const { callback, sendCommand } = getCallbackAndMock('load_time_mmss')
			await callback({ options: { minutes: 0, seconds: 0 } })
			expect(sendCommand).toHaveBeenCalledWith('load_time', { seconds: 0 })
		})

		it('handles large values (1h = 60 min)', async () => {
			const { callback, sendCommand } = getCallbackAndMock('load_time_mmss')
			await callback({ options: { minutes: 60, seconds: 0 } })
			expect(sendCommand).toHaveBeenCalledWith('load_time', { seconds: 3600 })
		})
	})

	describe('load_time_hhmmss', () => {
		it('converts hours + minutes + seconds to total seconds', async () => {
			const { callback, sendCommand } = getCallbackAndMock('load_time_hhmmss')
			await callback({ options: { hours: 1, minutes: 30, seconds: 0 } })
			expect(sendCommand).toHaveBeenCalledWith('load_time', { seconds: 5400 })
		})

		it('handles 0:00:00 (zero values)', async () => {
			const { callback, sendCommand } = getCallbackAndMock('load_time_hhmmss')
			await callback({ options: { hours: 0, minutes: 0, seconds: 0 } })
			expect(sendCommand).toHaveBeenCalledWith('load_time', { seconds: 0 })
		})

		it('handles minutes and seconds only', async () => {
			const { callback, sendCommand } = getCallbackAndMock('load_time_hhmmss')
			await callback({ options: { hours: 0, minutes: 5, seconds: 30 } })
			expect(sendCommand).toHaveBeenCalledWith('load_time', { seconds: 330 })
		})
	})

	describe('preset', () => {
		it('sends preset with numeric index', async () => {
			const { callback, sendCommand } = getCallbackAndMock('preset')
			await callback({ options: { index: 3 } })
			expect(sendCommand).toHaveBeenCalledWith('preset', { index: 3 })
		})

		it('coerces string index to number', async () => {
			const { callback, sendCommand } = getCallbackAndMock('preset')
			await callback({ options: { index: '0' } })
			expect(sendCommand).toHaveBeenCalledWith('preset', { index: 0 })
		})
	})

	describe('load_cue', () => {
		it('sends load_cue with numeric index', async () => {
			const { callback, sendCommand } = getCallbackAndMock('load_cue')
			await callback({ options: { index: 2 } })
			expect(sendCommand).toHaveBeenCalledWith('load_cue', { index: 2 })
		})
	})

	describe('set_mode', () => {
		it('sends set_mode with TIMER mode', async () => {
			const { callback, sendCommand } = getCallbackAndMock('set_mode')
			await callback({ options: { mode: 'TIMER' } })
			expect(sendCommand).toHaveBeenCalledWith('set_mode', { mode: 'TIMER' })
		})

		it('sends set_mode with CLOCK mode', async () => {
			const { callback, sendCommand } = getCallbackAndMock('set_mode')
			await callback({ options: { mode: 'CLOCK' } })
			expect(sendCommand).toHaveBeenCalledWith('set_mode', { mode: 'CLOCK' })
		})
	})

	describe('send_sms', () => {
		it('sends send_sms with all fields correctly typed', async () => {
			const { callback, sendCommand } = getCallbackAndMock('send_sms')
			await callback({
				options: {
					text: 'Hello World',
					duration: 10,
					color: '#ffffff',
					border_color: '#ffaa00',
					size: 'medium',
					position: 'bottom',
					flash: false,
					scroll: true,
					fullscreen: false,
				},
			})
			expect(sendCommand).toHaveBeenCalledWith('send_sms', {
				text: 'Hello World',
				duration: 10,
				color: '#ffffff',
				border_color: '#ffaa00',
				size: 'medium',
				position: 'bottom',
				flash: false,
				scroll: true,
				fullscreen: false,
			})
		})

		it('coerces duration to number', async () => {
			const { callback, sendCommand } = getCallbackAndMock('send_sms')
			await callback({
				options: {
					text: 'test',
					duration: '15',
					color: '#fff',
					border_color: '#000',
					size: 'small',
					position: 'top',
					flash: false,
					scroll: false,
				},
			})
			const call = sendCommand.mock.calls[0]
			expect(call[1].duration).toBe(15)
		})

		it('coerces flash/scroll to boolean', async () => {
			const { callback, sendCommand } = getCallbackAndMock('send_sms')
			await callback({
				options: {
					text: '',
					duration: 5,
					color: '',
					border_color: '',
					size: '',
					position: '',
					flash: 1,
					scroll: 0,
				},
			})
			const call = sendCommand.mock.calls[0]
			expect(call[1].flash).toBe(true)
			expect(call[1].scroll).toBe(false)
		})
	})
})
