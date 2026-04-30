import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type { KumaApiStatus } from './types.js'

export function setupFeedbacks(lastStatus: () => KumaApiStatus): CompanionFeedbackDefinitions {
	return {
		is_live: {
			name: 'Timer is LIVE',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(0, 180, 0), color: combineRgb(255, 255, 255) },
			options: [],
			callback: () => lastStatus().status === 'live',
		},
		is_paused: {
			name: 'Timer is PAUSED',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(255, 170, 0), color: combineRgb(0, 0, 0) },
			options: [],
			callback: () => lastStatus().status === 'paused',
		},
		is_standby: {
			name: 'Timer in STANDBY',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(60, 60, 60), color: combineRgb(200, 200, 200) },
			options: [],
			callback: () => lastStatus().status === 'standby',
		},
		is_hidden: {
			name: 'Display is HIDDEN',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(80, 0, 0), color: combineRgb(255, 100, 100) },
			options: [],
			callback: () => lastStatus().status === 'hidden',
		},
		is_overtime: {
			name: 'Timer in OVERTIME',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(200, 0, 0), color: combineRgb(255, 255, 255) },
			options: [],
			callback: () => !!lastStatus().overtime,
		},
		is_cue_active: {
			name: 'Cue is active (by index)',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(0, 210, 100), color: combineRgb(0, 0, 0) },
			options: [{ type: 'number', id: 'index', label: 'Cue index (0 = first)', default: 0, min: 0, max: 999 }],
			callback: (feedback: { options: Record<string, unknown> }) =>
				Number(lastStatus().cue_index) === Number(feedback.options['index']),
		},
		low_time: {
			name: 'Low time warning (progress below threshold)',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(220, 50, 50), color: combineRgb(255, 255, 255) },
			options: [{ type: 'number', id: 'threshold', label: 'Threshold % (e.g. 20)', default: 20, min: 1, max: 99 }],
			callback: (feedback: { options: Record<string, unknown> }) => {
				const p = Number(lastStatus().progress ?? 100)
				return p > 0 && p <= Number(feedback.options['threshold'])
			},
		},
		sms_active: {
			name: 'SMS message is active',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(0, 100, 200), color: combineRgb(255, 255, 255) },
			options: [],
			callback: () => !!lastStatus().sms_active,
		},
		is_countup: {
			name: 'Timer is COUNT UP',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(200, 100, 0), color: combineRgb(255, 255, 255) },
			options: [],
			callback: () => !!lastStatus().is_countup,
		},
	}
}
