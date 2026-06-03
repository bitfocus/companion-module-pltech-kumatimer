import {
	combineRgb,
	type CompanionPresetDefinitions,
	type CompanionPresetReference,
	type CompanionPresetSection,
} from '@companion-module/base'

export interface KumaPresets {
	structure: CompanionPresetSection[]
	presets: CompanionPresetDefinitions
}

// Why no template consolidation: the v2 template feature injects ONE local
// variable per generated preset, but our preset_0..5 and cue_0..N buttons each
// need a unique style.text label (e.g. "10M", "15M", "John Smith\nKeynote")
// derived from data we don't get on the template engine's hot path. Keeping
// individual preset definitions costs ~50 LOC vs templates but keeps labels
// dynamic. Revisit if Bitfocus adds per-templateValue style overrides.
export function setupPresets(cues: string[] = [], presetValues: number[] = []): KumaPresets {
	const WHITE = combineRgb(255, 255, 255)
	const BLACK = combineRgb(0, 0, 0)
	const GREEN = combineRgb(0, 180, 80)
	const RED = combineRgb(220, 50, 50)
	const ORANGE = combineRgb(220, 140, 0)
	const GREY = combineRgb(80, 80, 80)

	const presets: CompanionPresetDefinitions = {}
	const transportIds: CompanionPresetReference[] = []
	const presetIds: CompanionPresetReference[] = []
	const cueIds: CompanionPresetReference[] = []
	const infoIds: CompanionPresetReference[] = []
	const smsIds: CompanionPresetReference[] = []

	// START
	presets['start'] = {
		type: 'simple',
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
	transportIds.push('start')

	// STOP
	presets['stop'] = {
		type: 'simple',
		name: 'Stop / Reset',
		style: { text: 'STOP', size: '18', color: WHITE, bgcolor: RED },
		steps: [{ down: [{ actionId: 'reset', options: {} }], up: [] }],
		feedbacks: [],
	}
	transportIds.push('stop')

	// PAUSE / RESUME
	presets['pause'] = {
		type: 'simple',
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
	transportIds.push('pause')

	// HIDE / SHOW
	presets['hide'] = {
		type: 'simple',
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
	transportIds.push('hide')

	// +1m / -1m
	presets['add1m'] = {
		type: 'simple',
		name: '+1 minute',
		style: { text: '+1m', size: '18', color: WHITE, bgcolor: combineRgb(30, 100, 180) },
		steps: [{ down: [{ actionId: 'add_minute', options: {} }], up: [] }],
		feedbacks: [],
	}
	transportIds.push('add1m')

	presets['sub1m'] = {
		type: 'simple',
		name: '-1 minute',
		style: { text: '-1m', size: '18', color: WHITE, bgcolor: combineRgb(30, 100, 180) },
		steps: [{ down: [{ actionId: 'sub_minute', options: {} }], up: [] }],
		feedbacks: [],
	}
	transportIds.push('sub1m')

	// Mode switching
	presets['mode_timer'] = {
		type: 'simple',
		name: 'Switch to Timer mode',
		style: { text: 'TIMER\nMODE', size: '14', color: WHITE, bgcolor: combineRgb(50, 50, 80) },
		steps: [{ down: [{ actionId: 'set_mode', options: { mode: 'TIMER' } }], up: [] }],
		feedbacks: [],
	}
	transportIds.push('mode_timer')

	presets['mode_clock'] = {
		type: 'simple',
		name: 'Switch to Clock mode',
		style: { text: 'CLOCK\nMODE', size: '14', color: WHITE, bgcolor: combineRgb(50, 50, 80) },
		steps: [{ down: [{ actionId: 'set_mode', options: { mode: 'CLOCK' } }], up: [] }],
		feedbacks: [],
	}
	transportIds.push('mode_clock')

	// COUNT UP
	presets['count_up'] = {
		type: 'simple',
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
	transportIds.push('count_up')

	// Presets 1–6
	// v2.0.1: button text uses $(kumatimer:preset_N_label) variable
	// instead of a literal "5M" / "15M". Reason: setPresetDefinitions
	// only updates the LIBRARY panel — buttons already dragged onto
	// Stream Deck pages are independent copies and won't relabel
	// themselves when the host config changes. By embedding the
	// variable in the preset's text, Companion resolves it on every
	// render, so EVERY button (newly-dragged or 6-month-old) tracks
	// the current host config in real time. Pawel reported 8 May 2026:
	// preset button was stuck at "15M" after he changed the host
	// preset to a different value.
	const BLUE = combineRgb(40, 80, 160)
	for (let i = 0; i < 6; i++) {
		const val = presetValues[i]
		// Library-panel display name still shows the current literal
		// so the operator can scan the panel and pick the right one;
		// the BUTTON text uses the variable for live updates.
		const libraryLabel = val != null ? `${val}M` : `P${i + 1}`
		const id = `preset_${i}`
		const slot = i + 1 // variable names are 1-based (preset_1_label)
		presets[id] = {
			type: 'simple',
			name: `Load Preset ${i + 1} (${libraryLabel})`,
			style: {
				text: `$(kumatimer:preset_${slot}_label)`,
				size: '24',
				color: WHITE,
				bgcolor: BLUE,
			},
			steps: [{ down: [{ actionId: 'preset', options: { index: i } }], up: [] }],
			feedbacks: [],
		}
		presetIds.push(id)
	}

	// Cues — dynamic from cuesheet
	if (cues.length === 0) {
		presets['cue_empty'] = {
			type: 'simple',
			name: 'No cues loaded',
			style: { text: 'NO\nCUES', size: '14', color: GREY, bgcolor: BLACK },
			steps: [],
			feedbacks: [],
		}
		cueIds.push('cue_empty')
	} else {
		cues.forEach((label, i) => {
			const id = `cue_${i}`
			// Same variable-text trick as presets above: dragged buttons
			// auto-update when host edits cue name/duration. Falls back
			// to library label for the panel display name (operator
			// scans the panel to pick the right cue). Indexes 1..N
			// in variable names are 1-based.
			const slot = i + 1
			presets[id] = {
				type: 'simple',
				name: label,
				style: {
					text: `$(kumatimer:cue_${slot}_name)`,
					size: 12,
					color: WHITE,
					bgcolor: combineRgb(40, 60, 40),
				},
				steps: [{ down: [{ actionId: 'load_cue', options: { index: i } }], up: [] }],
				feedbacks: [
					{
						feedbackId: 'is_cue_active',
						options: { index: i },
						style: { color: BLACK, bgcolor: combineRgb(0, 210, 100) },
					},
				],
			}
			cueIds.push(id)
		})
	}

	// Next / Prev Cue
	presets['next_cue'] = {
		type: 'simple',
		name: 'Next Cue',
		style: { text: 'NEXT\nCUE', size: '14', color: WHITE, bgcolor: combineRgb(60, 80, 60) },
		steps: [{ down: [{ actionId: 'next_cue', options: {} }], up: [] }],
		feedbacks: [],
	}
	cueIds.push('next_cue')

	presets['prev_cue'] = {
		type: 'simple',
		name: 'Previous Cue',
		style: { text: 'PREV\nCUE', size: '14', color: WHITE, bgcolor: combineRgb(60, 60, 80) },
		steps: [{ down: [{ actionId: 'prev_cue', options: {} }], up: [] }],
		feedbacks: [],
	}
	cueIds.push('prev_cue')

	// Timer display with variable
	presets['timer_display'] = {
		type: 'simple',
		name: 'Timer display',
		style: { text: '$(pltech-kumatimer:timer)', size: '18', color: WHITE, bgcolor: combineRgb(40, 40, 40) },
		steps: [],
		feedbacks: [
			{ feedbackId: 'is_live', options: {}, style: { color: WHITE, bgcolor: GREEN } },
			{ feedbackId: 'is_paused', options: {}, style: { color: BLACK, bgcolor: ORANGE } },
			{ feedbackId: 'is_overtime', options: {}, style: { color: WHITE, bgcolor: RED } },
			{ feedbackId: 'is_hidden', options: {}, style: { color: GREY, bgcolor: BLACK } },
		],
	}
	infoIds.push('timer_display')

	// Status display
	presets['status_display'] = {
		type: 'simple',
		name: 'Status display',
		style: { text: '$(pltech-kumatimer:status)', size: '14', color: WHITE, bgcolor: BLACK },
		steps: [],
		feedbacks: [],
	}
	infoIds.push('status_display')

	// Speaker name
	presets['cue_name'] = {
		type: 'simple',
		name: 'Current speaker name',
		style: { text: '$(pltech-kumatimer:cue_name)', size: '14', color: WHITE, bgcolor: combineRgb(20, 40, 80) },
		steps: [],
		feedbacks: [],
	}
	infoIds.push('cue_name')

	// Send SMS
	presets['send_sms'] = {
		type: 'simple',
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
	smsIds.push('send_sms')

	// Cancel SMS
	presets['cancel_sms'] = {
		type: 'simple',
		name: 'Cancel SMS',
		style: { text: 'CANCEL\nSMS', size: '14', color: WHITE, bgcolor: RED },
		steps: [{ down: [{ actionId: 'cancel_sms', options: {} }], up: [] }],
		feedbacks: [],
	}
	smsIds.push('cancel_sms')

	const structure: CompanionPresetSection[] = [
		{ id: 'transport', name: 'Transport', definitions: transportIds },
		{ id: 'presets', name: 'Presets', definitions: presetIds },
		{ id: 'cues', name: 'Cues', definitions: cueIds },
		{ id: 'info', name: 'Info', definitions: infoIds },
		{ id: 'sms', name: 'SMS', definitions: smsIds },
	]

	return { structure, presets }
}
