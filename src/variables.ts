import type { InstanceBase, CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'
import type { KumaConfig, KumaApiStatus } from './types.js'

export function setupVariables(instance: InstanceBase<KumaConfig>): void {
	const definitions: CompanionVariableDefinition[] = [
		{ variableId: 'timer', name: 'Timer string (MM:SS)' },
		{ variableId: 'timer_seconds', name: 'Timer value in seconds' },
		{ variableId: 'status', name: 'Status (LIVE/PAUSED/STANDBY/HIDDEN)' },
		{ variableId: 'display_mode', name: 'Display mode (TIMER/CLOCK)' },
		{ variableId: 'cue_name', name: 'Current cue name' },
		{ variableId: 'cue_index', name: 'Current cue index' },
		{ variableId: 'overtime', name: 'Overtime (true/false)' },
		{ variableId: 'progress', name: 'Progress bar %' },
		{ variableId: 'sms_active', name: 'SMS message active (true/false)' },
	]
	instance.setVariableDefinitions(definitions)
	clearVariables(instance)
}

export function updateVariables(instance: InstanceBase<KumaConfig>, data: KumaApiStatus): void {
	const values: CompanionVariableValues = {
		timer: data.timer ?? '--:--',
		timer_seconds: String(data.timer_seconds ?? 0),
		status: (data.status ?? 'standby').toUpperCase(),
		display_mode: (data.display_mode ?? 'TIMER').toUpperCase(),
		cue_name: data.cue_name || '—',
		cue_index: String(data.cue_index ?? -1),
		overtime: String(data.overtime ?? false),
		progress: String(data.progress ?? 0),
		sms_active: String(data.sms_active ?? false),
	}
	instance.setVariableValues(values)
}

export function clearVariables(instance: InstanceBase<KumaConfig>): void {
	const values: CompanionVariableValues = {
		timer: '--:--',
		timer_seconds: '0',
		status: 'OFFLINE',
		display_mode: 'TIMER',
		cue_name: '—',
		cue_index: '-1',
		overtime: 'false',
		progress: '0',
		sms_active: 'false',
	}
	instance.setVariableValues(values)
}
