import { describe, it, expect, vi } from 'vitest'

vi.mock('@companion-module/base', () => ({
	combineRgb: (r: number, g: number, b: number) => (r << 16) | (g << 8) | b,
}))

import { setupPresets } from '../src/presets.js'

type SimplePreset = {
	type: 'simple'
	name: string
	style: { text: string; bgcolor: number; color: number; size: string | number }
	steps: Array<{ down: Array<{ actionId: string; options: Record<string, unknown> }>; up: unknown[] }>
	feedbacks: Array<{ feedbackId: string; options: Record<string, unknown> }>
}

function btn(result: ReturnType<typeof setupPresets>, id: string): SimplePreset {
	return result.presets[id] as unknown as SimplePreset
}

function sectionDefs(result: ReturnType<typeof setupPresets>, sectionId: string): readonly string[] {
	const section = result.structure.find((s) => s.id === sectionId)
	if (!section) throw new Error(`Section ${sectionId} not found`)
	return section.definitions as readonly string[]
}

describe('setupPresets', () => {
	describe('called with no arguments (defaults)', () => {
		const p = setupPresets()

		it('returns { structure, presets } shape (v2)', () => {
			expect(p.structure).toBeDefined()
			expect(Array.isArray(p.structure)).toBe(true)
			expect(p.presets).toBeDefined()
			expect(typeof p.presets).toBe('object')
		})

		it('has a "cue_empty" placeholder when no cues provided', () => {
			expect(p.presets['cue_empty']).toBeDefined()
			expect(sectionDefs(p, 'cues')).toContain('cue_empty')
		})

		it('generates 6 preset buttons referencing live label variable', () => {
			// v2.0.1 — button text uses $(kumatimer:preset_N_label) so
			// dragged buttons auto-update when the host config changes
			// (setPresetDefinitions only refreshes the LIBRARY panel,
			// not previously-placed buttons). Library `name` keeps
			// the literal current label so the operator can scan and
			// pick from the panel.
			for (let i = 0; i < 6; i++) {
				const preset = btn(p, `preset_${i}`)
				expect(preset).toBeDefined()
				expect(preset.style.text).toBe(`$(kumatimer:preset_${i + 1}_label)`)
				expect(preset.name).toContain(`P${i + 1}`)
				expect(sectionDefs(p, 'presets')).toContain(`preset_${i}`)
			}
		})

		it('all presets use type: "simple" (v2)', () => {
			for (const id of Object.keys(p.presets)) {
				expect(btn(p, id).type).toBe('simple')
			}
		})
	})

	describe('called with preset values', () => {
		const p = setupPresets([], [10, 15, 20, 30, 45, 60])

		it('button text uses live preset_N_label variable', () => {
			// v2.0.1: text is variable, name is literal label.
			expect(btn(p, 'preset_0').style.text).toBe('$(kumatimer:preset_1_label)')
			expect(btn(p, 'preset_0').name).toContain('10M')
			expect(btn(p, 'preset_3').name).toContain('30M')
			expect(btn(p, 'preset_5').name).toContain('60M')
		})

		it('library name falls back to Pn for unconfigured slots, button text always uses variable', () => {
			const partial = setupPresets([], [5, 10])
			expect(btn(partial, 'preset_0').style.text).toBe('$(kumatimer:preset_1_label)')
			expect(btn(partial, 'preset_0').name).toContain('5M')
			expect(btn(partial, 'preset_1').name).toContain('10M')
			expect(btn(partial, 'preset_2').name).toContain('P3')
		})
	})

	describe('called with cues', () => {
		const cues = ['John Smith — Keynote', 'Jane Doe — Q&A', 'Panel Discussion']
		const p = setupPresets(cues)

		it('does not generate cue_empty when cues are provided', () => {
			expect(p.presets['cue_empty']).toBeUndefined()
		})

		it('generates one button per cue', () => {
			for (let i = 0; i < cues.length; i++) {
				expect(p.presets[`cue_${i}`]).toBeDefined()
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

		it('cue button text uses live cue_N_name variable', () => {
			// v2.0.1: same auto-update pattern as preset buttons.
			// Library `name` keeps the literal cue label for the
			// panel display; button text resolves $(...) live.
			expect(btn(p, 'cue_0').style.text).toBe('$(kumatimer:cue_1_name)')
			expect(btn(p, 'cue_0').name).toBe('John Smith — Keynote')
		})

		it('cue ids are listed in the cues structure section', () => {
			const defs = sectionDefs(p, 'cues')
			for (let i = 0; i < cues.length; i++) {
				expect(defs).toContain(`cue_${i}`)
			}
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
			const pauseFeedback = btn(p, 'pause').feedbacks[0] as SimplePreset['feedbacks'][0] & {
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
			const hideFeedback = btn(p, 'hide').feedbacks[0] as SimplePreset['feedbacks'][0] & {
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

	describe('structure (v2 categorisation replacement)', () => {
		const p = setupPresets(['Cue A'], [5])

		it('exposes 6 sections in stable order', () => {
			expect(p.structure.map((s) => s.id)).toEqual(['transport', 'presets', 'cues', 'qlab', 'info', 'sms'])
		})

		it('transport section contains all transport buttons', () => {
			const defs = sectionDefs(p, 'transport')
			for (const id of ['start', 'stop', 'pause', 'hide', 'add1m', 'sub1m', 'mode_timer', 'mode_clock', 'count_up']) {
				expect(defs).toContain(id)
			}
		})

		it('presets section contains all 6 preset buttons', () => {
			const defs = sectionDefs(p, 'presets')
			for (let i = 0; i < 6; i++) {
				expect(defs).toContain(`preset_${i}`)
			}
		})

		it('cues section contains cue buttons + navigation', () => {
			const defs = sectionDefs(p, 'cues')
			expect(defs).toContain('cue_0')
			expect(defs).toContain('next_cue')
			expect(defs).toContain('prev_cue')
		})

		it('info section contains info display buttons', () => {
			const defs = sectionDefs(p, 'info')
			for (const id of ['timer_display', 'status_display', 'cue_name']) {
				expect(defs).toContain(id)
			}
		})

		it('sms section contains SMS buttons', () => {
			const defs = sectionDefs(p, 'sms')
			expect(defs).toContain('send_sms')
			expect(defs).toContain('cancel_sms')
		})
	})
})
