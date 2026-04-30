export interface KumaConfig {
	host?: string
	port?: number
	poll_interval?: number
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
	display_mode?: string
	sms_active?: boolean
	is_countup?: boolean
}
