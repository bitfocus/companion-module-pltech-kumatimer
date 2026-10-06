# KUMA Timer — Bitfocus Companion Module

Control **KUMA Timer** (macOS & Windows professional countdown timer) from Bitfocus Companion via HTTP/JSON API.

---

## Requirements

- KUMA Timer v1.6.3 or later
- HTTP API enabled in KUMA Timer settings (Settings → Connections → Enable HTTP API)
- Default port: **5555**

---

## Connection Setup

1. Add a new connection in Companion → select **PL Tech: KUMA Timer**
2. Enter the **IP address** of the machine running KUMA Timer
3. Enter the **port** (default: `5555`)
4. Set the **poll interval** (default: `500 ms`)

If KUMA Timer is running on the same machine as Companion, use `127.0.0.1`.

---

## Available Actions

| Action              | Description                                             |
| ------------------- | ------------------------------------------------------- |
| Start               | Start the countdown timer                               |
| Pause / Resume      | Pause or resume the timer                               |
| Reset               | Stop and reset the timer                                |
| Hide / Show Display | Toggle the display window visibility                    |
| +1 Minute           | Add 60 seconds to remaining time                        |
| -1 Minute           | Subtract 60 seconds from remaining time                 |
| Load Time (seconds) | Load a specific duration in seconds                     |
| Load Time (MM:SS)   | Load a specific duration as minutes + seconds           |
| Load Preset         | Load one of the 6 quick-access preset times (index 0–5) |
| Load Cue            | Load a cue from the runsheet by index (0 = first)       |
| Next Cue            | Advance to the next cue in the list                     |
| Previous Cue        | Go back to the previous cue in the list                 |
| Set Display Mode    | Switch between TIMER and CLOCK display modes            |
| Send Message (SMS)  | Display a text message overlay on the timer display     |
| Cancel SMS          | Remove the active message overlay                       |

---

## Available Feedbacks

| Feedback                 | Trigger                                               |
| ------------------------ | ----------------------------------------------------- |
| Timer is LIVE            | Timer is actively counting down                       |
| Timer is PAUSED          | Timer is paused                                       |
| Timer in STANDBY         | Timer is stopped (standby)                            |
| Display is HIDDEN        | Display window is hidden                              |
| Timer in OVERTIME        | Timer has passed zero and is counting up              |
| Cue is active (by index) | The cue at the specified index is currently loaded    |
| Low time warning         | Progress % has dropped below a configurable threshold |
| SMS message is active    | A message overlay is currently displayed              |

---

## Available Variables

| Variable                                    | Description                                                          |
| ------------------------------------------- | -------------------------------------------------------------------- |
| `$(pltech-kumatimer:timer)`                 | Current time string (e.g. `05:23`)                                   |
| `$(pltech-kumatimer:timer_seconds)`         | Remaining seconds as a number                                        |
| `$(pltech-kumatimer:status)`                | Status: `LIVE`, `PAUSED`, `STANDBY`, or `HIDDEN`                     |
| `$(pltech-kumatimer:display_mode)`          | Display mode: `TIMER` or `CLOCK`                                     |
| `$(pltech-kumatimer:cue_name)`              | Name of the currently loaded cue / speaker                           |
| `$(pltech-kumatimer:cue_index)`             | Index of the current cue (−1 if none)                                |
| `$(pltech-kumatimer:overtime)`              | `true` if in overtime, otherwise `false`                             |
| `$(pltech-kumatimer:progress)`              | Progress bar value (0–100 %)                                         |
| `$(pltech-kumatimer:sms_active)`            | `true` if a message overlay is active                                |
| `$(pltech-kumatimer:omt_enabled)`           | `true` if OMT output is enabled, otherwise `false`                   |
| `$(pltech-kumatimer:omt_active)`            | `true` while the OMT sender is live                                  |
| `$(pltech-kumatimer:ltc_generator_enabled)` | `true` if the LTC Generator is enabled                               |
| `$(pltech-kumatimer:ltc_generator_active)`  | `true` while the LTC Generator transport is live                     |
| `$(pltech-kumatimer:ltc_chase_enabled)`     | `true` if Chase to Timecode is enabled                               |
| `$(pltech-kumatimer:ltc_chase_active)`      | `true` while Chase to Timecode is armed and counting to the next cue |
| `$(pltech-kumatimer:dsan_rx_active)`        | `true` while a live DSAN Limitimer RX signal is received             |
| `$(pltech-kumatimer:blackmagic_active)`     | `true` while the Blackmagic output is live                           |

The last eight are the same states as the feedbacks of the same name, exposed
as variables so external dashboards (which read variables, not feedbacks) can
show them. They read `false` while the host is unreachable.

---

## Preset Buttons

The module provides ready-made preset buttons in these categories:

- **Transport** — Start (shows LIVE when running), Stop, Pause/Resume (label & colour change), Hide/Show, +1m, −1m, Timer Mode, Clock Mode
- **Presets** — 6 quick-load buttons with values from your KUMA Timer config
- **Cues** — One button per cue in your runsheet (loaded dynamically every 10 s); active cue highlighted in green
- **Info** — Timer display (colour changes with status), Status display, Current speaker name
- **SMS** — Send and Cancel message overlay buttons

---

## More Information

- Website: [kuma.pl-tech.co.uk](https://kuma.pl-tech.co.uk)
- API Reference: [kuma.pl-tech.co.uk/api.html](https://kuma.pl-tech.co.uk/api.html)
- Support: [kuma@pl-tech.co.uk](mailto:kuma@pl-tech.co.uk)
