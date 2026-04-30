# companion-module-pltech-kumatimer

Bitfocus Companion module for **KUMA Timer** — control the timer via HTTP/JSON.

## Features

- Start, pause, reset, hide/show the timer
- Load cues from the cue sheet with active-cue highlight feedback
- Load presets (P1–P6) with dynamic labels
- +1 min / −1 min adjustments
- Switch between Timer and Clock display modes
- Send and cancel on-screen SMS messages
- Live variables: `timer`, `timer_seconds`, `status`, `cue_name`, `cue_index`, `overtime`, `progress`, `sms_active`, `display_mode`
- 8 feedbacks for dynamic button colours (live, paused, standby, hidden, overtime, cue active, low time, sms)

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
