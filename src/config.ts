import type { SomeCompanionConfigField } from '@companion-module/base'
import type { KumaConfig } from './types.js'

export type { KumaConfig }

export const configFields: SomeCompanionConfigField[] = [
	{
		type: 'textinput',
		id: 'host',
		label: 'KUMA Timer IP address',
		width: 8,
		default: '127.0.0.1',
	},
	{
		type: 'number',
		id: 'port',
		label: 'KUMA Timer port (default 5555)',
		width: 4,
		default: 5555,
		min: 1,
		max: 65535,
	},
	{
		type: 'number',
		id: 'poll_interval',
		label: 'Poll interval (ms)',
		width: 4,
		default: 500,
		min: 200,
		max: 5000,
	},
]
