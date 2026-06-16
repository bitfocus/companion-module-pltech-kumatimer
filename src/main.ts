import { InstanceBase, InstanceStatus, createModuleLogger, type SomeCompanionConfigField } from '@companion-module/base'
import { configFields } from './config.js'
import { type KumaApiStatus, type KumaConfig, type KumaTypes } from './types.js'
import { setupActions } from './actions.js'
import { setupFeedbacks } from './feedbacks.js'
import { setupVariables, updateVariables, clearVariables } from './variables.js'
import { setupPresets } from './presets.js'
import UpgradeScripts from './upgrades.js'

const log = createModuleLogger('KUMA')

class KumaTimerInstance extends InstanceBase<KumaTypes> {
	config!: KumaConfig
	private _pollTimer: ReturnType<typeof setInterval> | null = null
	private _polling = false
	private _lastStatus: KumaApiStatus = {}
	private _lastCuesJson = '[]'
	private _lastPresetsJson = '[]'
	private _pollCount = 19 // trigger cue/preset check on first poll

	// ─── Lifecycle ────────────────────────────────────────────────

	async init(config: KumaConfig, _isFirstInit: boolean, _secrets: undefined): Promise<void> {
		this.config = config
		this.setActionDefinitions(
			setupActions(
				async (action, params) => this.sendCommand(action, params),
				() => this._lastStatus,
			),
		)
		this.setFeedbackDefinitions(setupFeedbacks(() => this._lastStatus))
		setupVariables(this)
		const { structure, presets } = setupPresets()
		this.setPresetDefinitions(structure, presets)
		this._startPolling()
	}

	async destroy(): Promise<void> {
		this._stopPolling()
	}

	async configUpdated(config: KumaConfig, _secrets: undefined): Promise<void> {
		this.config = config
		this._stopPolling()
		this._startPolling()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return configFields
	}

	// ─── Polling ─────────────────────────────────────────────────

	private _baseUrl(): string {
		const host = (this.config.host || '127.0.0.1').trim()
		const port = this.config.port || 5555
		return `http://${host}:${port}`
	}

	private _startPolling(): void {
		this._stopPolling()
		this._polling = false
		const interval = this.config.poll_interval || 500
		void this._poll()
		this._pollTimer = setInterval(() => {
			void this._poll()
		}, interval)
	}

	private _stopPolling(): void {
		if (this._pollTimer) {
			clearInterval(this._pollTimer)
			this._pollTimer = null
		}
	}

	private async _poll(): Promise<void> {
		if (this._polling) return
		this._polling = true
		try {
			const res = await fetch(`${this._baseUrl()}/api/status`, { signal: AbortSignal.timeout(2000) })
			if (!res.ok) throw new Error(`HTTP ${res.status}`)
			const data = (await res.json()) as KumaApiStatus
			this._lastStatus = data
			this.updateStatus(InstanceStatus.Ok)
			updateVariables(this, data)
			this.checkAllFeedbacks()
			// Regenerate presets every ~10s (every 20th poll at 500ms)
			this._pollCount++
			if (this._pollCount % 20 === 0) {
				const newCues = JSON.stringify(data.cues || [])
				const newPresets = JSON.stringify(data.presets || [])
				if (newCues !== this._lastCuesJson || newPresets !== this._lastPresetsJson) {
					this._lastCuesJson = newCues
					this._lastPresetsJson = newPresets
					const { structure, presets } = setupPresets(data.cues || [], data.presets || [])
					this.setPresetDefinitions(structure, presets)
				}
			}
		} catch (e) {
			this._lastStatus = {}
			this.updateStatus(InstanceStatus.ConnectionFailure, (e as Error).message)
			clearVariables(this)
			this.checkAllFeedbacks()
		} finally {
			this._polling = false
		}
	}

	// ─── HTTP command helper ──────────────────────────────────────

	async sendCommand(action: string, params: Record<string, unknown> = {}): Promise<void> {
		const url = `${this._baseUrl()}/api/command`
		const payload: Record<string, unknown> = { action, ...params }
		// Host gates /api/command on a `web_control_password` config field. When
		// set, every command must include `key` matching it (else 401 auth_required).
		// We only inject the key when configured — empty password = no-auth host,
		// no-key payload, host's `provided != configured_pwd` check sees both as
		// empty and lets the command through.
		const password = (this.config.password || '').trim()
		if (password) {
			payload['key'] = password
		}
		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
				signal: AbortSignal.timeout(3000),
			})
			if (!res.ok) {
				const msg = (await res.text()).trim()
				log.warn(`Command '${action}' failed: HTTP ${res.status} ${msg}`)
				// Surface the failure to the operator instead of staying green.
				// A wrong/missing password makes /api/command return 401 while
				// /api/status still polls fine, so the connection would otherwise
				// look healthy while every button silently does nothing. The next
				// successful poll (≤ poll_interval) restores Ok for transient errors.
				const detail = res.status === 401 ? 'Auth failed — check the password' : `HTTP ${res.status}`
				this.updateStatus(InstanceStatus.ConnectionFailure, detail)
			}
		} catch (e) {
			log.error(`HTTP error sending '${action}': ${(e as Error).message}`)
			this.updateStatus(InstanceStatus.ConnectionFailure)
		}
	}
}

export default KumaTimerInstance
export { UpgradeScripts }
