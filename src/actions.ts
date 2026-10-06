import type { CompanionActionDefinitions } from '@companion-module/base'
import type { KumaApiStatus } from './types.js'

// 'toggle' | 'on' | 'off' helper: resolve the desired on-state, reading the
// current value for a toggle.
function resolveOnState(mode: unknown, current: boolean): boolean {
	if (mode === 'on') return true
	if (mode === 'off') return false
	return !current // toggle
}

const onOffToggle = {
	type: 'dropdown' as const,
	id: 'mode',
	label: 'Action',
	default: 'toggle',
	choices: [
		{ id: 'toggle', label: 'Toggle' },
		{ id: 'on', label: 'On' },
		{ id: 'off', label: 'Off' },
	],
}

export function setupActions(
	sendCommand: (action: string, params?: Record<string, unknown>) => Promise<void>,
	getStatus: () => KumaApiStatus = () => ({}),
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

		cut_nudge: {
			// "Cut:" total nudge (Pawel 16 Sep 2026) — for the Time Glide /
			// Stealth Jump panel's "Cut:" field, which now holds a TOTAL
			// amount to remove rather than a target duration (see host's
			// timer_mixin.py::_apply_cut_amount). This bumps that total by
			// delta_seconds — positive to remove more, negative to remove
			// less — live, with no Cancel-then-reapply needed on the host
			// side. If no cut is active yet, a positive nudge starts one
			// fresh from 0. Four presets below wire up +1m/-1m/+1s/-1s
			// buttons against this one parameterized action, matching the
			// live-show workflow: press +1m when a show caller asks for a
			// minute, press it again for another.
			name: 'Nudge Time Cut (+/- seconds)',
			options: [{ type: 'number', id: 'delta_seconds', label: 'Delta (seconds)', default: 60, min: -3599, max: 3599 }],
			callback: async (action: { options: Record<string, unknown> }) => {
				const delta = Number(action.options['delta_seconds'])
				if (!delta) return
				return sendCommand('cut_nudge', { delta_seconds: delta })
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

		recall_layout: {
			name: 'Recall Layout Preset',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Recall by',
					default: 'slot',
					choices: [
						{ id: 'slot', label: 'Slot number' },
						{ id: 'name', label: 'Name' },
					],
				},
				{
					type: 'number',
					id: 'slot',
					label: 'Slot (1 = first) — used when "Recall by" = Slot number',
					default: 1,
					min: 1,
					max: 99,
				},
				{
					type: 'textinput',
					id: 'name',
					label: 'Preset name — used when "Recall by" = Name',
					default: '',
				},
			],
			callback: async (action: { options: Record<string, unknown> }) => {
				if (action.options['mode'] === 'name') {
					return sendCommand('recall_layout', { name: (action.options['name'] as string | undefined) ?? '' })
				}
				return sendCommand('recall_layout', { slot: Number(action.options['slot']) })
			},
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

		// ─── Time Glide / Time Jump ───────────────────────────────────
		// Host: warp_time / warp_duration start a Time Glide (the timer is
		// stretched or squeezed so it ends exactly on target); cancel_warp /
		// cancel_jump stop one. All four are no-ops the host answers with 400
		// when the input makes no sense (e.g. a zero duration) — see sendCommand.
		warp_time: {
			name: 'Time Glide: finish at wall-clock time (HH:MM:SS)',
			options: [
				{ type: 'number', id: 'hours', label: 'Hour (0-23)', default: 18, min: 0, max: 23 },
				{ type: 'number', id: 'minutes', label: 'Minute', default: 0, min: 0, max: 59 },
				{ type: 'number', id: 'seconds', label: 'Second', default: 0, min: 0, max: 59 },
			],
			callback: async (action: { options: Record<string, unknown> }) =>
				sendCommand('warp_time', {
					hours: Number(action.options['hours']),
					minutes: Number(action.options['minutes']),
					seconds: Number(action.options['seconds']),
				}),
		},

		warp_duration: {
			name: 'Time Glide: finish in a set duration',
			options: [
				{ type: 'number', id: 'hours', label: 'Hours', default: 0, min: 0, max: 23 },
				{ type: 'number', id: 'minutes', label: 'Minutes', default: 5, min: 0, max: 59 },
				{ type: 'number', id: 'seconds', label: 'Seconds', default: 0, min: 0, max: 59 },
			],
			callback: async (action: { options: Record<string, unknown> }) =>
				sendCommand('warp_duration', {
					hours: Number(action.options['hours']),
					minutes: Number(action.options['minutes']),
					seconds: Number(action.options['seconds']),
				}),
		},

		cancel_warp: {
			name: 'Time Glide: cancel',
			options: [],
			callback: async () => sendCommand('cancel_warp'),
		},

		cancel_jump: {
			name: 'Time Jump: cancel',
			options: [],
			callback: async () => sendCommand('cancel_jump'),
		},

		// ─── QLab follow (Direction 3) ────────────────────────────────
		qlab_hold: {
			name: 'TCR: Visible / Hidden (audition hold) — QLab / Mitti / Millumin / KumaPoint',
			options: [onOffToggle],
			callback: async (action: { options: Record<string, unknown> }) => {
				// 'on' = hold = TCR HIDDEN. Toggle reads current hold state.
				const on = resolveOnState(action.options['mode'], !!getStatus().qlab_hold)
				return sendCommand('qlab_follow_hold', { on })
			},
		},

		qlab_follow_enable: {
			name: 'QLab: Follow On / Off',
			options: [onOffToggle],
			callback: async (action: { options: Record<string, unknown> }) => {
				const on = resolveOnState(action.options['mode'], !!getStatus().qlab_follow_enabled)
				return sendCommand('qlab_follow_enable', { on })
			},
		},

		qlab_triggers_enable: {
			name: 'QLab: Triggers On / Off',
			options: [onOffToggle],
			callback: async (action: { options: Record<string, unknown> }) => {
				const on = resolveOnState(action.options['mode'], !!getStatus().qlab_triggers_enabled)
				return sendCommand('qlab_triggers_enable', { on })
			},
		},

		qlab_set_follow_cue: {
			name: 'QLab: Set Followed Cue (cue mode)',
			options: [{ type: 'textinput', id: 'cue', label: 'Cue number or id', default: '' }],
			callback: async (action: { options: Record<string, unknown> }) =>
				sendCommand('qlab_set_follow_cue', { cue: (action.options['cue'] as string | undefined) ?? '' }),
		},

		// ─── v1.19.0: OMT / LTC Generator / Chase to Timecode ─────────
		omt_enable: {
			name: 'OMT Output On / Off',
			options: [onOffToggle],
			callback: async (action: { options: Record<string, unknown> }) => {
				const on = resolveOnState(action.options['mode'], !!getStatus().omt_enabled)
				return sendCommand('omt_enable', { on })
			},
		},

		ltc_generator_enable: {
			name: 'LTC Generator On / Off',
			options: [onOffToggle],
			callback: async (action: { options: Record<string, unknown> }) => {
				const on = resolveOnState(action.options['mode'], !!getStatus().ltc_tx_enabled)
				return sendCommand('ltc_generator_enable', { on })
			},
		},

		ltc_chase_enable: {
			name: 'Chase to Timecode On / Off',
			options: [onOffToggle],
			callback: async (action: { options: Record<string, unknown> }) => {
				const on = resolveOnState(action.options['mode'], !!getStatus().ltc_chase_enabled)
				return sendCommand('ltc_chase_enable', { on })
			},
		},

		blackmagic_enable: {
			// RC2, 17 Sep 2026 (Pawel: "guzik do companion z START i STOP
			// Blackmagic output... lub toggle") — starts/stops "Live KUMA
			// Timer" on the Blackmagic output. No persisted config flag to
			// mirror (unlike omt_enable) — Toggle mode reads whether it's
			// actually on air right now (blackmagic_active).
			name: 'Blackmagic Output On / Off',
			options: [onOffToggle],
			callback: async (action: { options: Record<string, unknown> }) => {
				const on = resolveOnState(action.options['mode'], !!getStatus().blackmagic_active)
				return sendCommand('blackmagic_enable', { on })
			},
		},
	}
}
