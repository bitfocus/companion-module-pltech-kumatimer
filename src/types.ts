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
}
