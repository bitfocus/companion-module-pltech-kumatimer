import type { CompanionActionDefinitions } from '@companion-module/base'

export function setupActions(
	sendCommand: (action: string, params?: Record<string, unknown>) => Promise<void>,
): CompanionActionDefinitions {
	return {
		start: {
			name: 'Start',
			options: [],
			callback: async () => sendCommand('start'),
		},

		pause: {
			name: 'Pause / Resume',
			options: [],
			callback: async () => sendCommand('pause'),
		},

		reset: {
			name: 'Reset',
			options: [],
			callback: async () => sendCommand('reset'),
		},

		hide: {
			name: 'Hide / Show Display',
			options: [],
			callback: async () => sendCommand('hide'),
		},

		add_minute: {
			name: '+1 Minute',
			options: [],
			callback: async () => sendCommand('add_minute'),
		},

		sub_minute: {
			name: '-1 Minute',
			options: [],
			callback: async () => sendCommand('sub_minute'),
		},

		adjust_time: {
			// Arbitrary +/- adjustment for users who want a single button
			// to bump the timer by, say, +2:30 or -15s. Wraps the host's
			// add_seconds action; the host enforces the LITE 59:59
			// ceiling internally so a positive delta on a LITE host that
			// would push past 1h is silently swallowed.
			name: 'Adjust Time (+/- MM:SS)',
			options: [
				{
					type: 'dropdown',
					id: 'direction',
					label: 'Direction',
					default: 'add',
					choices: [
						{ id: 'add', label: 'Add (+)' },
						{ id: 'sub', label: 'Subtract (-)' },
					],
				},
				{ type: 'number', id: 'minutes', label: 'Minutes', default: 0, min: 0, max: 59 },
				{ type: 'number', id: 'seconds', label: 'Seconds', default: 30, min: 0, max: 59 },
			],
			callback: async (action: { options: Record<string, unknown> }) => {
				const total = Number(action.options['minutes']) * 60 + Number(action.options['seconds'])
				if (total === 0) return
				const signed = action.options['direction'] === 'sub' ? -total : total
				return sendCommand('add_seconds', { seconds: signed })
			},
		},

		load_time: {
			name: 'Load Time (seconds)',
			options: [{ type: 'number', id: 'seconds', label: 'Duration (seconds)', default: 300, min: 0, max: 86399 }],
			callback: async (action: { options: Record<string, unknown> }) =>
				sendCommand('load_time', { seconds: Number(action.options['seconds']) }),
		},

		load_time_mmss: {
			name: 'Load Time (MM:SS)',
			options: [
				{ type: 'number', id: 'minutes', label: 'Minutes', default: 5, min: 0, max: 1439 },
				{ type: 'number', id: 'seconds', label: 'Seconds', default: 0, min: 0, max: 59 },
			],
			callback: async (action: { options: Record<string, unknown> }) => {
				const total = Number(action.options['minutes']) * 60 + Number(action.options['seconds'])
				return sendCommand('load_time', { seconds: total })
			},
		},

		load_time_hhmmss: {
			name: 'Load Time (HH:MM:SS)',
			options: [
				{ type: 'number', id: 'hours', label: 'Hours', default: 0, min: 0, max: 23 },
				{ type: 'number', id: 'minutes', label: 'Minutes', default: 5, min: 0, max: 59 },
				{ type: 'number', id: 'seconds', label: 'Seconds', default: 0, min: 0, max: 59 },
			],
			callback: async (action: { options: Record<string, unknown> }) => {
				const total =
					Number(action.options['hours']) * 3600 +
					Number(action.options['minutes']) * 60 +
					Number(action.options['seconds'])
				return sendCommand('load_time', { seconds: total })
			},
		},

		preset: {
			name: 'Load Preset',
			options: [{ type: 'number', id: 'index', label: 'Preset index (0 = first button)', default: 0, min: 0, max: 5 }],
			callback: async (action: { options: Record<string, unknown> }) =>
				sendCommand('preset', { index: Number(action.options['index']) }),
		},

		load_cue: {
			name: 'Load Cue',
			options: [{ type: 'number', id: 'index', label: 'Cue index (0 = first)', default: 0, min: 0, max: 999 }],
			callback: async (action: { options: Record<string, unknown> }) =>
				sendCommand('load_cue', { index: Number(action.options['index']) }),
		},

		next_cue: {
			name: 'Next Cue',
			options: [],
			callback: async () => sendCommand('next_cue'),
		},

		prev_cue: {
			name: 'Previous Cue',
			options: [],
			callback: async () => sendCommand('prev_cue'),
		},

		set_mode: {
			name: 'Set Display Mode (TIMER / CLOCK)',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Mode',
					default: 'TIMER',
					choices: [
						{ id: 'TIMER', label: 'Timer' },
						{ id: 'CLOCK', label: 'Clock' },
					],
				},
			],
			callback: async (action: { options: Record<string, unknown> }) =>
				sendCommand('set_mode', { mode: action.options['mode'] }),
		},

		send_sms: {
			name: 'Send Message (SMS)',
			options: [
				{ type: 'textinput', id: 'text', label: 'Message text', default: '' },
				{ type: 'number', id: 'duration', label: 'Duration (seconds)', default: 10, min: 1, max: 600 },
				{ type: 'textinput', id: 'color', label: 'Text colour (hex)', default: '#ffffff' },
				{ type: 'textinput', id: 'border_color', label: 'Border colour (hex)', default: '#ffaa00' },
				{
					type: 'dropdown',
					id: 'size',
					label: 'Size',
					default: 'medium',
					choices: [
						{ id: 'small', label: 'Small' },
						{ id: 'medium', label: 'Medium' },
						{ id: 'large', label: 'Large' },
					],
				},
				{
					type: 'dropdown',
					id: 'position',
					label: 'Position',
					default: 'bottom',
					choices: [
						{ id: 'bottom', label: 'Bottom' },
						{ id: 'top', label: 'Top' },
					],
				},
				{ type: 'checkbox', id: 'flash', label: 'Flash effect', default: false },
				{ type: 'checkbox', id: 'scroll', label: 'Scroll text', default: false },
				{ type: 'checkbox', id: 'fullscreen', label: 'Fullscreen (hides timer)', default: false },
			],
			callback: async (action: { options: Record<string, unknown> }) => {
				const o = action.options
				return sendCommand('send_sms', {
					text: String(o['text']),
					duration: Number(o['duration']),
					color: String(o['color']),
					border_color: String(o['border_color']),
					size: String(o['size']),
					position: String(o['position']),
					flash: !!o['flash'],
					scroll: !!o['scroll'],
					fullscreen: !!o['fullscreen'],
				})
			},
		},

		cancel_sms: {
			name: 'Cancel SMS',
			options: [],
			callback: async () => sendCommand('cancel_sms'),
		},

		count_up: {
			name: 'Count Up',
			options: [],
			callback: async () => sendCommand('count_up'),
		},
	}
}
