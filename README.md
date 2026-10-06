# companion-module-pltech-kumatimer

Bitfocus Companion module for **KUMA Timer** — control the timer via HTTP/JSON.

## Features

**32 actions:**

- Start, pause, reset, hide/show the timer
- +1 min / −1 min, arbitrary +/- MM:SS adjustment
- **Time Cut nudge** (`cut_nudge`) — bump the Time Glide / Stealth Jump
  panel's "Cut:" total by any delta live, without cancelling first (4
  ready-made +1m/−1m/+1s/−1s presets included)
- Load time by seconds, MM:SS or HH:MM:SS
- Load presets (P1–P6) and cues from the cue sheet, next/prev cue
- Recall a saved custom Layout
- Switch between Timer and Clock display modes, start Count Up
- Send and cancel on-screen SMS messages
- **Time Glide / Time Jump:** start a glide to a wall-clock time or for a set
  duration, cancel a running glide or jump
- TCR HOLD (works for QLab, Mitti, Millumin and KumaPoint), QLab follow,
  triggers, set the followed cue
- OMT output enable, LTC Generator enable, LTC Chase-to-Timecode enable

**28 feedbacks** for dynamic button colours — live, paused, standby,
hidden, overtime, count-up, cue active, low time, SMS active, display mode
(Timer/Clock), active layout preset, Time Glide / Time Jump running, TCR
following and selected TCR source (QLab / Mitti / Millumin / KumaPoint), QLab
follow/hold/triggers state, OMT/LTC Generator/LTC Chase enabled+active,
DSAN RX active, Blackmagic live.

**Live variables:** `timer`, `timer_seconds`, `status`, `cue_name`, `cue_index`, `overtime`, `progress`, `sms_active`, `display_mode`

**State-flag variables** (same ids as the matching feedbacks, `true`/`false`):
`omt_enabled`, `omt_active`, `ltc_generator_enabled`, `ltc_generator_active`,
`ltc_chase_enabled`, `ltc_chase_active`, `dsan_rx_active`, `blackmagic_active`,
`tcr_following`, `time_glide_active`, `time_jump_active`

**TCR variables:** `tcr_source` (QLAB / MITTI / MILLUMIN / KUMAPOINT / OFF), `tcr_line`
(the readout text), `tcr_name`

**Timer parts and timecode variables:** `timer_hh`, `timer_mm`, `timer_ss`, `timer_ff`, `timer_full`;
`ltc_timecode`, `ltc_generator_timecode`, `dsan_rx_timer` (empty = no signal; host v1.19.3+)

## Requirements

- [KUMA Timer](https://kuma.pl-tech.co.uk) v1.6.0 or later running on the same network
- Bitfocus Companion v4.0.0 or later

## Development

### Prerequisites

- Node.js `^22.20`
- Yarn 4 (`corepack enable && corepack prepare yarn@4.9.1 --activate`)

### Setup

```bash
yarn install
```

### Build

```bash
yarn build          # compile TypeScript → dist/
yarn build:watch    # watch mode
```

### Lint

```bash
yarn lint           # check for issues
yarn lint:fix       # auto-fix
```

### Test

```bash
yarn test           # run unit tests (vitest)
yarn test:watch     # watch mode
```

### Package for Companion

```bash
yarn package        # build + companion-module-build
```

## Module ID

`pltech-kumatimer`

Legacy IDs (for upgrades): `kumatimer`, `kumatimer-http`, `pltech-kumatimer-http`

## License

MIT — see [LICENSE](LICENSE)
