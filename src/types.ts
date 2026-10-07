import type { InstanceTypes, JsonObject } from '@companion-module/base'

// In v2, InstanceTypes['config'] is constrained to JsonObject, which requires
// every property's type to be JsonValue (no `| undefined`). Optional `?` fields
// fail because TS expands them to `string | undefined`, which isn't JsonValue.
// Declaring fields required is safe here: Companion always passes the defaults
// from config.ts (host=127.0.0.1, port=5555, poll_interval=500), and the
// `_baseUrl()` getter still has runtime fallbacks for paranoia.
export interface KumaConfig extends JsonObject {
	host: string
	port: number
	poll_interval: number
	password: string
}

export interface KumaTypes extends InstanceTypes {
	config: KumaConfig
	// We don't use secrets — declaring `undefined` lets saveConfig and the
	// init/configUpdated signatures stay tight (no JsonObject | undefined).
	secrets: undefined
}

export interface KumaApiStatus {
	status?: 'live' | 'paused' | 'standby' | 'hidden' | 'countup'
	timer?: string
	/** Frame-aware display string the host renders (adds the frame segment in
	 * the :FR clock formats, or HH:MM:SS:FF in LTC mode). Underscore = host-
	 * internal, but /api/status returns the whole snapshot. */
	_timer_display?: string
	timer_seconds?: number
	overtime?: boolean
	progress?: number
	cue_name?: string
	cue_index?: number
	cues?: string[]
	presets?: number[]
	// v1.12.0: second-precision parallel array. Module reads this when
	// available so $preset_N_minutes survives sub-minute presets like
	// 1:30. Falls back to `presets * 60` for older hosts.
	preset_seconds?: number[]
	// Structured cue list — round-trippable form. Each entry has
	// `name` + `min` + `sec`. Used to populate $cue_N_name + minutes
	// variables for user-built Stream Deck buttons (Thomas request).
	cue_list_full?: { name?: string; min?: number; sec?: number; minutes?: number; seconds?: number }[]
	display_mode?: string
	sms_active?: boolean
	is_countup?: boolean
	// QLab follow (Direction 3) — exposed by the host's /api/status.
	qlab_triggers_enabled?: boolean
	qlab_follow_enabled?: boolean
	qlab_following?: boolean // currently mirroring a running cue
	qlab_follow_cue?: string
	qlab_follow_mode?: string // 'active' | 'cue'
	qlab_health?: string // 'ok' | 'idle' | 'error' | 'off'
	qlab_hold?: boolean // audition-safe HOLD armed (TCR hidden)
	// Source-neutral TCR (host v1.17.4+; KumaPoint is a source since v1.18.0).
	// tcr_source is one of off | qlab | mitti | millumin | kumapoint.
	tcr_source?: string
	tcr_following?: boolean // any source is actually driving the timer
	tcr_line_active?: boolean
	tcr_line?: string // the TCR readout text, e.g. "00:23"
	tcr_line_color?: string
	tcr_name_active?: boolean
	tcr_name?: string // clip / cue name shown next to it
	// PowerPoint add-in (KumaPoint) slide-show state. The whole object is OMITTED
	// by the host when no show is running or the add-in has gone quiet, and on
	// hosts older than the release that added it — so every field is read through
	// `data.ppt?.…` and a missing object must mean "no show", never an error.
	ppt?: {
		file?: string // presentation file name, e.g. "sample-presentation.pptx"
		slide?: number // current slide position in the show
		total?: number // slides in the deck
		builds_remaining?: number // animation clicks still ahead on this slide
		builds_total?: number // animation clicks defined on this slide
		media?: string // 'playing' | 'idle'
		media_remaining?: number | null // seconds left on the playing clip, else null
	}
	// Time Glide / Time Jump (the "Time Cut" panel)
	warp_active?: boolean // a Time Glide is running
	warp_interval_ms?: number
	jump_active?: boolean // a Time Jump (stealth cut) is running
	jump_remaining_cut?: number
	time_cut_mode?: string
	// Layout presets ("Looks") — lightweight {slot, id, name} list + the active
	// preset id. Recall via the recall_layout action (by slot or name).
	layout_presets?: { slot: number; id: string; name: string }[]
	layout_preset_active?: string
	// v1.19.0 additions — OMT / LTC Generator / Chase to Timecode / DSAN
	// Limitimer RX. `_enabled` mirrors the Settings config toggle,
	// `_active` is true only once the underlying sender/thread/decoder
	// is actually running (mirrors the ndi_active / omt_active split).
	omt_enabled?: boolean
	omt_active?: boolean
	ltc_tx_enabled?: boolean
	ltc_tx_active?: boolean
	ltc_chase_enabled?: boolean
	ltc_chase_active?: boolean // true only while armed + counting to a cue target
	dsan_rx_active?: boolean
	// Current timecode / timer TEXT for external readouts. '' = no signal.
	// Evaluated by the host per /api/status request (host v1.19.3+; older hosts
	// simply omit them, which reads as '').
	ltc_timecode?: string // incoming LTC (Chase / RX), HH:MM:SS:FF
	ltc_generator_timecode?: string // LTC Generator output position, HH:MM:SS:FF
	dsan_rx_timer?: string // timer text received from the DSAN Limitimer
	// RC2, 17 Sep 2026 — Blackmagic "Live KUMA Timer" output. Dev/test
	// feature with no persisted config flag (unlike omt_enabled etc.), so
	// there's only one state bit: whether it's actually on air right now.
	blackmagic_active?: boolean
}
