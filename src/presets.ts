import { combineRgb, type CompanionPresetDefinitions } from '@companion-module/base'

export function setupPresets(cues: string[] = [], presetValues: number[] = []): CompanionPresetDefinitions {
	const WHITE = combineRgb(255, 255, 255)
	const BLACK = combineRgb(0, 0, 0)
	const GREEN = combineRgb(0, 180, 80)
	const RED = combineRgb(220, 50, 50)
	const ORANGE = combineRgb(220, 140, 0)
	const GREY = combineRgb(80, 80, 80)

	const presets: CompanionPresetDefinitions = {}

	// START
	presets['start'] = {
		type: 'button',
		category: 'Transport',
		name: 'Start',
		style: { text: 'START', size: '18', color: WHITE, bgcolor: combineRgb(30, 120, 30) },
		steps: [{ down: [{ actionId: 'start', options: {} }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'is_live',
				options: {},
				style: { text: 'LIVE', color: WHITE, bgcolor: GREEN },
			},
		],
	}

	// STOP
	presets['stop'] = {
		type: 'button',
		category: 'Transport',
		name: 'Stop / Reset',
		style: { text: 'STOP', size: '18', color: WHITE, bgcolor: RED },
		steps: [{ down: [{ actionId: 'reset', options: {} }], up: [] }],
		feedbacks: [],
	}

	// PAUSE / RESUME
	presets['pause'] = {
		type: 'button',
		category: 'Transport',
		name: 'Pause / Resume',
		style: { text: 'PAUSE', size: '18', color: BLACK, bgcolor: ORANGE },
		steps: [{ down: [{ actionId: 'pause', options: {} }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'is_paused',
				options: {},
				style: { text: 'RESUME', color: WHITE, bgcolor: GREEN },
			},
		],
	}

	// HIDE / SHOW
	presets['hide'] = {
		type: 'button',
		category: 'Transport',
		name: 'Hide / Show display',
		style: { text: 'HIDE', size: '18', color: WHITE, bgcolor: GREY },
		steps: [{ down: [{ actionId: 'hide', options: {} }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'is_hidden',
				options: {},
				style: { text: 'SHOW', color: WHITE, bgcolor: combineRgb(180, 0, 0) },
			},
		],
	}

	// +1m / -1m
	presets['add1m'] = {
		type: 'button',
		category: 'Transport',
		name: '+1 minute',
		style: { text: '+1m', size: '18', color: WHITE, bgcolor: combineRgb(30, 100, 180) },
		steps: [{ down: [{ actionId: 'add_minute', options: {} }], up: [] }],
		feedbacks: [],
	}
	presets['sub1m'] = {
		type: 'button',
		category: 'Transport',
		name: '-1 minute',
		style: { text: '-1m', size: '18', color: WHITE, bgcolor: combineRgb(30, 100, 180) },
		steps: [{ down: [{ actionId: 'sub_minute', options: {} }], up: [] }],
		feedbacks: [],
	}

	// Presets 1–6
	const BLUE = combineRgb(40, 80, 160)
	for (let i = 0; i < 6; i++) {
		const val = presetValues[i]
		const label = val != null ? `${val}M` : `P${i + 1}`
		presets[`preset_${i}`] = {
			type: 'button',
			category: 'Presets',
			name: `Load Preset ${i + 1} (${label})`,
			style: { text: label, size: '24', color: WHITE, bgcolor: BLUE },
			steps: [{ down: [{ actionId: 'preset', options: { index: i } }], up: [] }],
			feedbacks: [],
		}
	}

	// Cues — dynamic from cuesheet
	if (cues.length === 0) {
		presets['cue_empty'] = {
			type: 'button',
			category: 'Cues',
			name: 'No cues loaded',
			style: { text: 'NO\nCUES', size: '14', color: GREY, bgcolor: BLACK },
			steps: [],
			feedbacks: [],
		}
	} else {
		cues.forEach((label, i) => {
			presets[`cue_${i}`] = {
				type: 'button',
				category: 'Cues',
				name: label,
				style: { text: label.replace(' — ', '\n'), size: 12, color: WHITE, bgcolor: combineRgb(40, 60, 40) },
				steps: [{ down: [{ actionId: 'load_cue', options: { index: i } }], up: [] }],
				feedbacks: [
					{
						feedbackId: 'is_cue_active',
						options: { index: i },
						style: { color: BLACK, bgcolor: combineRgb(0, 210, 100) },
					},
				],
			}
		})
	}

	// Timer display with variable
	presets['timer_display'] = {
		type: 'button',
		category: 'Info',
		name: 'Timer display',
		style: { text: '$(pltech-kumatimer:timer)', size: '18', color: WHITE, bgcolor: combineRgb(40, 40, 40) },
		steps: [],
		feedbacks: [
			{
				feedbackId: 'is_live',
				options: {},
				style: { color: WHITE, bgcolor: GREEN },
			},
			{
				feedbackId: 'is_paused',
				options: {},
				style: { color: BLACK, bgcolor: ORANGE },
			},
			{
				feedbackId: 'is_overtime',
				options: {},
				style: { color: WHITE, bgcolor: RED },
			},
			{
				feedbackId: 'is_hidden',
				options: {},
				style: { color: GREY, bgcolor: BLACK },
			},
		],
	}

	// Status display
	presets['status_display'] = {
		type: 'button',
		category: 'Info',
		name: 'Status display',
		style: { text: '$(pltech-kumatimer:status)', size: '14', color: WHITE, bgcolor: BLACK },
		steps: [],
		feedbacks: [],
	}

	// Speaker name
	presets['cue_name'] = {
		type: 'button',
		category: 'Info',
		name: 'Current speaker name',
		style: { text: '$(pltech-kumatimer:cue_name)', size: '14', color: WHITE, bgcolor: combineRgb(20, 40, 80) },
		steps: [],
		feedbacks: [],
	}

	// Next / Prev Cue
	presets['next_cue'] = {
		type: 'button',
		category: 'Cues',
		name: 'Next Cue',
		style: { text: 'NEXT\nCUE', size: '14', color: WHITE, bgcolor: combineRgb(60, 80, 60) },
		steps: [{ down: [{ actionId: 'next_cue', options: {} }], up: [] }],
		feedbacks: [],
	}
	presets['prev_cue'] = {
		type: 'button',
		category: 'Cues',
		name: 'Previous Cue',
		style: { text: 'PREV\nCUE', size: '14', color: WHITE, bgcolor: combineRgb(60, 60, 80) },
		steps: [{ down: [{ actionId: 'prev_cue', options: {} }], up: [] }],
		feedbacks: [],
	}

	// Mode switching
	presets['mode_timer'] = {
		type: 'button',
		category: 'Transport',
		name: 'Switch to Timer mode',
		style: { text: 'TIMER\nMODE', size: '14', color: WHITE, bgcolor: combineRgb(50, 50, 80) },
		steps: [{ down: [{ actionId: 'set_mode', options: { mode: 'TIMER' } }], up: [] }],
		feedbacks: [],
	}
	presets['mode_clock'] = {
		type: 'button',
		category: 'Transport',
		name: 'Switch to Clock mode',
		style: { text: 'CLOCK\nMODE', size: '14', color: WHITE, bgcolor: combineRgb(50, 50, 80) },
		steps: [{ down: [{ actionId: 'set_mode', options: { mode: 'CLOCK' } }], up: [] }],
		feedbacks: [],
	}

	// Send SMS
	presets['send_sms'] = {
		type: 'button',
		category: 'SMS',
		name: 'Send SMS message',
		style: { text: 'SEND\nSMS', size: '18', color: BLACK, bgcolor: ORANGE },
		steps: [
			{
				down: [
					{
						actionId: 'send_sms',
						options: {
							text: '',
							duration: 10,
							color: '#ffffff',
							border_color: '#ffaa00',
							size: 'medium',
							position: 'bottom',
							flash: false,
							scroll: true,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	// Cancel SMS
	presets['cancel_sms'] = {
		type: 'button',
		category: 'SMS',
		name: 'Cancel SMS',
		style: { text: 'CANCEL\nSMS', size: '14', color: WHITE, bgcolor: RED },
		steps: [{ down: [{ actionId: 'cancel_sms', options: {} }], up: [] }],
		feedbacks: [],
	}

	// COUNT UP
	presets['count_up'] = {
		type: 'button',
		category: 'Transport',
		name: 'Count Up',
		style: { text: 'COUNT\nUP', size: '14', color: WHITE, bgcolor: combineRgb(160, 80, 0) },
		steps: [{ down: [{ actionId: 'count_up', options: {} }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'is_countup',
				options: {},
				style: { color: WHITE, bgcolor: combineRgb(220, 100, 0) },
			},
		],
	}

	return presets
}
