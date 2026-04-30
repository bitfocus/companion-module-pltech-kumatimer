import { describe, it, expect, vi } from 'vitest'

vi.mock('@companion-module/base', () => ({
	combineRgb: (r: number, g: number, b: number) => (r << 16) | (g << 8) | b,
}))

import { setupPresets } from '../src/presets.js'

type ButtonPreset = {
	type: 'button'
	category: string
	name: string
	style: { text: string; bgcolor: number; color: number; size: string | number }
	steps: Array<{ down: Array<{ actionId: string; options: Record<string, unknown> }>; up: unknown[] }>
	feedbacks: Array<{ feedbackId: string; options: Record<string, unknown> }>
}

function btn(presets: ReturnType<typeof setupPresets>, id: string): ButtonPreset {
	return presets[id] as ButtonPreset
}

describe('setupPresets', () => {
	describe('called with no arguments (defaults)', () => {
		const p = setupPresets()

		it('has a "cue_empty" placeholder when no cues provided', () => {
			expect(p['cue_empty']).toBeDefined()
			expect(btn(p, 'cue_empty').category).toBe('Cues')
		})

		it('generates 6 preset buttons with P1–P6 labels when no values provided', () => {
			for (let i = 0; i < 6; i++) {
				const preset = btn(p, `preset_${i}`)
				expect(preset).toBeDefined()
				expect(preset.style.text).toBe(`P${i + 1}`)
				expect(preset.category).toBe('Presets')
			}
		})
	})

	describe('called with preset values', () => {
		const p = setupPresets([], [10, 15, 20, 30, 45, 60])

		it('uses preset values as button labels', () => {
			expect(btn(p, 'preset_0').style.text).toBe('10M')
			expect(btn(p, 'preset_3').style.text).toBe('30M')
			expect(btn(p, 'preset_5').style.text).toBe('60M')
		})

		it('falls back to Pn for missing preset values', () => {
			const partial = setupPresets([], [5, 10])
			expect(btn(partial, 'preset_0').style.text).toBe('5M')
			expect(btn(partial, 'preset_1').style.text).toBe('10M')
			expect(btn(partial, 'preset_2').style.text).toBe('P3')
		})
	})

	describe('called with cues', () => {
		const cues = ['John Smith — Keynote', 'Jane Doe — Q&A', 'Panel Discussion']
		const p = setupPresets(cues)

		it('does not generate cue_empty when cues are provided', () => {
			expect(p['cue_empty']).toBeUndefined()
		})

		it('generates one button per cue', () => {
			for (let i = 0; i < cues.length; i++) {
				expect(p[`cue_${i}`]).toBeDefined()
			}
		})

		it('uses cue names as preset names', () => {
			expect(btn(p, 'cue_0').name).toBe(cues[0])
			expect(btn(p, 'cue_1').name).toBe(cues[1])
		})

		it('each cue button has load_cue action with correct index', () => {
			for (let i = 0; i < cues.length; i++) {
				const steps = btn(p, `cue_${i}`).steps
				expect(steps[0].down[0].actionId).toBe('load_cue')
				expect(steps[0].down[0].options.index).toBe(i)
			}
		})

		it('each cue button has is_cue_active feedback with correct index', () => {
			for (let i = 0; i < cues.length; i++) {
				const feedbacks = btn(p, `cue_${i}`).feedbacks
				expect(feedbacks[0].feedbackId).toBe('is_cue_active')
				expect(feedbacks[0].options.index).toBe(i)
			}
		})

		it('replaces " — " with newline in button text', () => {
			// "John Smith — Keynote" → "John Smith\nKeynote"
			expect(btn(p, 'cue_0').style.text).toBe('John Smith\nKeynote')
		})
	})

	describe('transport buttons', () => {
		const p = setupPresets()

		it('START uses start action and is_live feedback', () => {
			const start = btn(p, 'start')
			expect(start.steps[0].down[0].actionId).toBe('start')
			expect(start.feedbacks[0].feedbackId).toBe('is_live')
		})

		it('STOP uses reset action', () => {
			expect(btn(p, 'stop').steps[0].down[0].actionId).toBe('reset')
		})

		it('PAUSE uses pause action and is_paused feedback', () => {
			const pause = btn(p, 'pause')
			expect(pause.steps[0].down[0].actionId).toBe('pause')
			expect(pause.feedbacks[0].feedbackId).toBe('is_paused')
		})

		it('PAUSE feedback style text is RESUME', () => {
			const pauseFeedback = btn(p, 'pause').feedbacks[0] as ButtonPreset['feedbacks'][0] & {
				style: { text: string }
			}
			expect(pauseFeedback.style.text).toBe('RESUME')
		})

		it('HIDE uses hide action and is_hidden feedback', () => {
			const hide = btn(p, 'hide')
			expect(hide.steps[0].down[0].actionId).toBe('hide')
			expect(hide.feedbacks[0].feedbackId).toBe('is_hidden')
		})

		it('HIDE feedback style text is SHOW', () => {
			const hideFeedback = btn(p, 'hide').feedbacks[0] as ButtonPreset['feedbacks'][0] & {
				style: { text: string }
			}
			expect(hideFeedback.style.text).toBe('SHOW')
		})

		it('+1m uses add_minute action', () => {
			expect(btn(p, 'add1m').steps[0].down[0].actionId).toBe('add_minute')
		})

		it('-1m uses sub_minute action', () => {
			expect(btn(p, 'sub1m').steps[0].down[0].actionId).toBe('sub_minute')
		})

		it('mode_timer sends TIMER mode', () => {
			expect(btn(p, 'mode_timer').steps[0].down[0].actionId).toBe('set_mode')
			expect(btn(p, 'mode_timer').steps[0].down[0].options.mode).toBe('TIMER')
		})

		it('mode_clock sends CLOCK mode', () => {
			expect(btn(p, 'mode_clock').steps[0].down[0].options.mode).toBe('CLOCK')
		})
	})

	describe('info buttons', () => {
		const p = setupPresets()

		it('timer_display uses $(pltech-kumatimer:timer) variable', () => {
			expect(btn(p, 'timer_display').style.text).toBe('$(pltech-kumatimer:timer)')
		})

		it('timer_display has 4 feedbacks (live, paused, overtime, hidden)', () => {
			const fbs = btn(p, 'timer_display').feedbacks.map((f) => f.feedbackId)
			expect(fbs).toContain('is_live')
			expect(fbs).toContain('is_paused')
			expect(fbs).toContain('is_overtime')
			expect(fbs).toContain('is_hidden')
			expect(fbs).toHaveLength(4)
		})

		it('status_display uses $(pltech-kumatimer:status) variable', () => {
			expect(btn(p, 'status_display').style.text).toBe('$(pltech-kumatimer:status)')
		})

		it('cue_name uses $(pltech-kumatimer:cue_name) variable', () => {
			expect(btn(p, 'cue_name').style.text).toBe('$(pltech-kumatimer:cue_name)')
		})
	})

	describe('cue navigation buttons', () => {
		const p = setupPresets()

		it('next_cue uses next_cue action', () => {
			expect(btn(p, 'next_cue').steps[0].down[0].actionId).toBe('next_cue')
		})

		it('prev_cue uses prev_cue action', () => {
			expect(btn(p, 'prev_cue').steps[0].down[0].actionId).toBe('prev_cue')
		})
	})

	describe('SMS buttons', () => {
		const p = setupPresets()

		it('send_sms uses send_sms action', () => {
			expect(btn(p, 'send_sms').steps[0].down[0].actionId).toBe('send_sms')
		})

		it('cancel_sms uses cancel_sms action', () => {
			expect(btn(p, 'cancel_sms').steps[0].down[0].actionId).toBe('cancel_sms')
		})
	})

	describe('categories', () => {
		const p = setupPresets(['Cue A'], [5])

		it('transport buttons are in Transport category', () => {
			for (const id of ['start', 'stop', 'pause', 'hide', 'add1m', 'sub1m', 'mode_timer', 'mode_clock']) {
				expect(btn(p, id).category).toBe('Transport')
			}
		})

		it('preset buttons are in Presets category', () => {
			for (let i = 0; i < 6; i++) {
				expect(btn(p, `preset_${i}`).category).toBe('Presets')
			}
		})

		it('cue buttons are in Cues category', () => {
			expect(btn(p, 'cue_0').category).toBe('Cues')
			expect(btn(p, 'next_cue').category).toBe('Cues')
			expect(btn(p, 'prev_cue').category).toBe('Cues')
		})

		it('info buttons are in Info category', () => {
			for (const id of ['timer_display', 'status_display', 'cue_name']) {
				expect(btn(p, id).category).toBe('Info')
			}
		})

		it('sms buttons are in SMS category', () => {
			expect(btn(p, 'send_sms').category).toBe('SMS')
			expect(btn(p, 'cancel_sms').category).toBe('SMS')
		})
	})
})
