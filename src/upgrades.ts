import type {
	CompanionStaticUpgradeScript,
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeResult,
	CompanionUpgradeContext,
} from '@companion-module/base'
import type { KumaConfig } from './types.js'

const UpgradeScripts: CompanionStaticUpgradeScript<KumaConfig>[] = [
	// v2.1.1 — the `password` field was added after the first releases, so a
	// connection saved by an older module has no `password` key (it reads back
	// as `undefined`). KumaConfig declares it required, so backfill the empty
	// default for any pre-existing connection. Read through an index type to
	// detect a genuinely missing key without tripping strict null checks.
	function backfillPassword(
		_context: CompanionUpgradeContext<KumaConfig>,
		props: CompanionStaticUpgradeProps<KumaConfig, undefined>,
	): CompanionStaticUpgradeResult<KumaConfig, undefined> {
		const raw = props.config as Record<string, unknown> | null
		if (raw && typeof raw['password'] !== 'string') {
			raw['password'] = ''
			return { updatedConfig: raw as unknown as KumaConfig, updatedActions: [], updatedFeedbacks: [] }
		}
		return { updatedConfig: null, updatedActions: [], updatedFeedbacks: [] }
	},
]

export { UpgradeScripts }
export default UpgradeScripts
