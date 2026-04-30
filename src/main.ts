import { InstanceBase, InstanceStatus, runEntrypoint, type SomeCompanionConfigField } from '@companion-module/base'
import { type KumaConfig, configFields } from './config.js'
import { type KumaApiStatus } from './types.js'
import { setupActions } from './actions.js'
import { setupFeedbacks } from './feedbacks.js'
import { setupVariables, updateVariables, clearVariables } from './variables.js'
import { setupPresets } from './presets.js'
import UpgradeScripts from './upgrades.js'

class KumaTimerInstance extends InstanceBase<KumaConfig> {
	config!: KumaConfig
	private _pollTimer: ReturnType<typeof setInterval> | null = null
	private _polling = false
	private _lastStatus: KumaApiStatus = {}
	private _lastCuesJson = '[]'
	private _lastPresetsJson = '[]'
	private _pollCount = 19 // trigger cue/preset check on first poll

	// ─── Lifecycle ────────────────────────────────────────────────

	async init(config: KumaConfig): Promise<void> {
		this.config = config
		this.setActionDefinitions(setupActions(async (action, params) => this.sendCommand(action, params)))
		this.setFeedbackDefinitions(setupFeedbacks(() => this._lastStatus))
		setupVariables(this)
		this.setPresetDefinitions(setupPresets())
		this._startPolling()
	}

	async destroy(): Promise<void> {
		this._stopPolling()
	}

	async configUpdated(config: KumaConfig): Promise<void> {
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
			this.checkFeedbacks()
			// Regenerate presets every ~10s (every 20th poll at 500ms)
			this._pollCount++
			if (this._pollCount % 20 === 0) {
				const newCues = JSON.stringify(data.cues || [])
				const newPresets = JSON.stringify(data.presets || [])
				if (newCues !== this._lastCuesJson || newPresets !== this._lastPresetsJson) {
					this._lastCuesJson = newCues
					this._lastPresetsJson = newPresets
					this.setPresetDefinitions(setupPresets(data.cues || [], data.presets || []))
				}
			}
		} catch (e) {
			this._lastStatus = {}
			this.updateStatus(InstanceStatus.ConnectionFailure, (e as Error).message)
			clearVariables(this)
			this.checkFeedbacks()
		} finally {
			this._polling = false
		}
	}

	// ─── HTTP command helper ──────────────────────────────────────

	async sendCommand(action: string, params: Record<string, unknown> = {}): Promise<void> {
		const url = `${this._baseUrl()}/api/command`
		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action, ...params }),
				signal: AbortSignal.timeout(3000),
			})
			if (!res.ok) {
				const msg = await res.text()
				this.log('warn', `Command '${action}' failed: ${msg}`)
			}
		} catch (e) {
			this.log('error', `HTTP error sending '${action}': ${(e as Error).message}`)
			this.updateStatus(InstanceStatus.ConnectionFailure)
		}
	}
}

runEntrypoint(KumaTimerInstance, UpgradeScripts)
