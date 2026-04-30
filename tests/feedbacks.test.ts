import { describe, it, expect, vi } from 'vitest'

vi.mock('@companion-module/base', () => ({
	combineRgb: (r: number, g: number, b: number) => (r << 16) | (g << 8) | b,
}))

import { setupFeedbacks } from '../src/feedbacks.js'
import type { KumaApiStatus } from '../src/types.js'

// Helper: extract typed callback from a feedback definition
type FeedbackCallback = (feedback?: { options: Record<string, unknown> }) => boolean
function cb(feedbacks: ReturnType<typeof setupFeedbacks>, id: string): FeedbackCallback {
	return (feedbacks[id] as { callback: FeedbackCallback }).callback
}

describe('setupFeedbacks', () => {
	describe('is_live', () => {
		it('returns true when status is "live"', () => {
			const f = setupFeedbacks(() => ({ status: 'live' }))
			expect(cb(f, 'is_live')()).toBe(true)
		})
		it('returns false for paused', () => {
			const f = setupFeedbacks(() => ({ status: 'paused' }))
			expect(cb(f, 'is_live')()).toBe(false)
		})
		it('returns false for standby', () => {
			const f = setupFeedbacks(() => ({ status: 'standby' }))
			expect(cb(f, 'is_live')()).toBe(false)
		})
		it('returns false when status is undefined', () => {
			const f = setupFeedbacks(() => ({}))
			expect(cb(f, 'is_live')()).toBe(false)
		})
	})

	describe('is_paused', () => {
		it('returns true when status is "paused"', () => {
			const f = setupFeedbacks(() => ({ status: 'paused' }))
			expect(cb(f, 'is_paused')()).toBe(true)
		})
		it('returns false when status is "live"', () => {
			const f = setupFeedbacks(() => ({ status: 'live' }))
			expect(cb(f, 'is_paused')()).toBe(false)
		})
	})

	describe('is_standby', () => {
		it('returns true when status is "standby"', () => {
			const f = setupFeedbacks(() => ({ status: 'standby' }))
			expect(cb(f, 'is_standby')()).toBe(true)
		})
		it('returns false when status is "live"', () => {
			const f = setupFeedbacks(() => ({ status: 'live' }))
			expect(cb(f, 'is_standby')()).toBe(false)
		})
	})

	describe('is_hidden', () => {
		it('returns true when status is "hidden"', () => {
			const f = setupFeedbacks(() => ({ status: 'hidden' }))
			expect(cb(f, 'is_hidden')()).toBe(true)
		})
		it('returns false when status is "live"', () => {
			const f = setupFeedbacks(() => ({ status: 'live' }))
			expect(cb(f, 'is_hidden')()).toBe(false)
		})
	})

	describe('is_overtime', () => {
		it('returns true when overtime is true', () => {
			const f = setupFeedbacks(() => ({ overtime: true }))
			expect(cb(f, 'is_overtime')()).toBe(true)
		})
		it('returns false when overtime is false', () => {
			const f = setupFeedbacks(() => ({ overtime: false }))
			expect(cb(f, 'is_overtime')()).toBe(false)
		})
		it('returns false when overtime is undefined', () => {
			const f = setupFeedbacks(() => ({}))
			expect(cb(f, 'is_overtime')()).toBe(false)
		})
	})

	describe('is_cue_active', () => {
		it('returns true when cue_index matches options.index', () => {
			const f = setupFeedbacks(() => ({ cue_index: 2 }))
			expect(cb(f, 'is_cue_active')({ options: { index: 2 } })).toBe(true)
		})
		it('returns true with string/number coercion (index: "2", cue_index: 2)', () => {
			const f = setupFeedbacks(() => ({ cue_index: 2 }))
			expect(cb(f, 'is_cue_active')({ options: { index: '2' } })).toBe(true)
		})
		it('returns false when cue_index does not match', () => {
			const f = setupFeedbacks(() => ({ cue_index: 1 }))
			expect(cb(f, 'is_cue_active')({ options: { index: 0 } })).toBe(false)
		})
		it('returns false when cue_index is undefined', () => {
			const f = setupFeedbacks(() => ({}))
			expect(cb(f, 'is_cue_active')({ options: { index: 0 } })).toBe(false)
		})
	})

	describe('low_time', () => {
		it('returns true when progress is below threshold and above 0', () => {
			const f = setupFeedbacks(() => ({ progress: 15 }))
			expect(cb(f, 'low_time')({ options: { threshold: 20 } })).toBe(true)
		})
		it('returns true when progress equals threshold', () => {
			const f = setupFeedbacks(() => ({ progress: 20 }))
			expect(cb(f, 'low_time')({ options: { threshold: 20 } })).toBe(true)
		})
		it('returns false when progress exceeds threshold', () => {
			const f = setupFeedbacks(() => ({ progress: 50 }))
			expect(cb(f, 'low_time')({ options: { threshold: 20 } })).toBe(false)
		})
		it('returns false when progress is 0 (timer stopped)', () => {
			const f = setupFeedbacks(() => ({ progress: 0 }))
			expect(cb(f, 'low_time')({ options: { threshold: 20 } })).toBe(false)
		})
		it('defaults progress to 100 when undefined — no warning', () => {
			const f = setupFeedbacks(() => ({}))
			expect(cb(f, 'low_time')({ options: { threshold: 20 } })).toBe(false)
		})
	})

	describe('sms_active', () => {
		it('returns true when sms_active is true', () => {
			const f = setupFeedbacks(() => ({ sms_active: true }))
			expect(cb(f, 'sms_active')()).toBe(true)
		})
		it('returns false when sms_active is false', () => {
			const f = setupFeedbacks(() => ({ sms_active: false }))
			expect(cb(f, 'sms_active')()).toBe(false)
		})
		it('returns false when sms_active is undefined', () => {
			const f = setupFeedbacks(() => ({}))
			expect(cb(f, 'sms_active')()).toBe(false)
		})
	})

	describe('is_countup', () => {
		it('returns true when is_countup is true', () => {
			const f = setupFeedbacks(() => ({ is_countup: true }))
			expect(cb(f, 'is_countup')()).toBe(true)
		})
		it('returns false when is_countup is false', () => {
			const f = setupFeedbacks(() => ({ is_countup: false }))
			expect(cb(f, 'is_countup')()).toBe(false)
		})
		it('returns false when is_countup is undefined', () => {
			const f = setupFeedbacks(() => ({}))
			expect(cb(f, 'is_countup')()).toBe(false)
		})
	})

	it('exposes all 9 feedbacks', () => {
		const f = setupFeedbacks(() => ({}))
		const ids = Object.keys(f)
		expect(ids).toContain('is_live')
		expect(ids).toContain('is_paused')
		expect(ids).toContain('is_standby')
		expect(ids).toContain('is_hidden')
		expect(ids).toContain('is_overtime')
		expect(ids).toContain('is_cue_active')
		expect(ids).toContain('low_time')
		expect(ids).toContain('sms_active')
		expect(ids).toContain('is_countup')
		expect(ids).toHaveLength(9)
	})

	it('uses latest status snapshot on every call', () => {
		let currentStatus: KumaApiStatus = { status: 'standby' }
		const f = setupFeedbacks(() => currentStatus)
		expect(cb(f, 'is_live')()).toBe(false)
		currentStatus = { status: 'live' }
		expect(cb(f, 'is_live')()).toBe(true)
	})
})
