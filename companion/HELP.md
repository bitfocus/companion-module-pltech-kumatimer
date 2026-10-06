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

| Action                                | Description                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| Start                                 | Start the countdown timer                                                            |
| Pause / Resume                        | Pause or resume the timer                                                            |
| Reset                                 | Stop and reset the timer                                                             |
| Hide / Show Display                   | Toggle the display window visibility                                                 |
| +1 Minute                             | Add 60 seconds to remaining time                                                     |
| -1 Minute                             | Subtract 60 seconds from remaining time                                              |
| Load Time (seconds)                   | Load a specific duration in seconds                                                  |
| Load Time (MM:SS)                     | Load a specific duration as minutes + seconds                                        |
| Load Preset                           | Load one of the 6 quick-access preset times (index 0–5)                              |
| Load Cue                              | Load a cue from the runsheet by index (0 = first)                                    |
| Next Cue                              | Advance to the next cue in the list                                                  |
| Previous Cue                          | Go back to the previous cue in the list                                              |
| Set Display Mode                      | Switch between TIMER and CLOCK display modes                                         |
| Send Message (SMS)                    | Display a text message overlay on the timer display                                  |
| Cancel SMS                            | Remove the active message overlay                                                    |
| Time Glide: finish at wall-clock time | Stretch/squeeze the timer so it ends exactly at HH:MM:SS today (or tomorrow)         |
| Time Glide: finish in a set duration  | The same, for a duration from now                                                    |
| Time Glide: cancel                    | Stop a running Time Glide                                                            |
| Time Jump: cancel                     | Stop a running Time Jump                                                             |
| TCR: Visible / Hidden (hold)          | Hide the TCR readout for auditioning — works for QLab, Mitti, Millumin and KumaPoint |

---

## Available Feedbacks

| Feedback                                  | Trigger                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| Timer is LIVE                             | Timer is actively counting down                                          |
| Timer is PAUSED                           | Timer is paused                                                          |
| Timer in STANDBY                          | Timer is stopped (standby)                                               |
| Display is HIDDEN                         | Display window is hidden                                                 |
| Timer in OVERTIME                         | Timer has passed zero and is counting up                                 |
| Cue is active (by index)                  | The cue at the specified index is currently loaded                       |
| Low time warning                          | Progress % has dropped below a configurable threshold                    |
| SMS message is active                     | A message overlay is currently displayed                                 |
| Display mode is …                         | The display is in TIMER or CLOCK mode (pick which)                       |
| Layout preset is the active one           | The chosen layout preset (by slot or name) is the active one             |
| Time Glide: a glide is running            | A Time Glide is in progress                                              |
| Time Jump: a jump is running              | A Time Jump is in progress                                               |
| TCR: a follow source is driving the timer | QLab, Mitti, Millumin or KumaPoint is following a running cue/clip       |
| TCR: selected source is …                 | The TCR source is QLab / Mitti / Millumin / KumaPoint / Off (pick which) |

---

## Available Variables

| Variable                                                   | Description                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `$(pltech-kumatimer:timer)`                                | Current time string (e.g. `05:23`)                                                   |
| `$(pltech-kumatimer:timer_seconds)`                        | Remaining seconds as a number                                                        |
| `$(pltech-kumatimer:status)`                               | Status: `LIVE`, `PAUSED`, `STANDBY`, or `HIDDEN`                                     |
| `$(pltech-kumatimer:display_mode)`                         | Display mode: `TIMER` or `CLOCK`                                                     |
| `$(pltech-kumatimer:cue_name)`                             | Name of the currently loaded cue / speaker                                           |
| `$(pltech-kumatimer:cue_index)`                            | Index of the current cue (−1 if none)                                                |
| `$(pltech-kumatimer:overtime)`                             | `true` if in overtime, otherwise `false`                                             |
| `$(pltech-kumatimer:progress)`                             | Progress bar value (0–100 %)                                                         |
| `$(pltech-kumatimer:sms_active)`                           | `true` if a message overlay is active                                                |
| `$(pltech-kumatimer:omt_enabled)`                          | `true` if OMT output is enabled, otherwise `false`                                   |
| `$(pltech-kumatimer:omt_active)`                           | `true` while the OMT sender is live                                                  |
| `$(pltech-kumatimer:ltc_generator_enabled)`                | `true` if the LTC Generator is enabled                                               |
| `$(pltech-kumatimer:ltc_generator_active)`                 | `true` while the LTC Generator transport is live                                     |
| `$(pltech-kumatimer:ltc_chase_enabled)`                    | `true` if Chase to Timecode is enabled                                               |
| `$(pltech-kumatimer:ltc_chase_active)`                     | `true` while Chase to Timecode is armed and counting to the next cue                 |
| `$(pltech-kumatimer:dsan_rx_active)`                       | `true` while a live DSAN Limitimer RX signal is received                             |
| `$(pltech-kumatimer:blackmagic_active)`                    | `true` while the Blackmagic output is live                                           |
| `$(pltech-kumatimer:timer_hh)` `timer_mm` `timer_ss`       | The timer split into hours / minutes / seconds (`00` hours when the format has none) |
| `$(pltech-kumatimer:timer_ff)`                             | Frames — only in the frame-accurate (`:FR`) formats and in LTC mode, otherwise `--`  |
| `$(pltech-kumatimer:tcr_source)`                           | Selected TCR source: `QLAB`, `MITTI`, `MILLUMIN`, `KUMAPOINT` or `OFF`               |
| `$(pltech-kumatimer:tcr_following)`                        | `true` while a TCR source is driving the timer                                       |
| `$(pltech-kumatimer:tcr_line)` `tcr_name`                  | The TCR readout (e.g. `00:23`) and the clip/cue name; empty when none                |
| `$(pltech-kumatimer:time_glide_active)` `time_jump_active` | `true` while a Time Glide / Time Jump is running                                     |
| `$(pltech-kumatimer:timer_full)`                           | The whole display text on one button, including frames when shown (e.g. `05:23:12`)  |
| `$(pltech-kumatimer:ltc_timecode)`                         | Incoming LTC timecode `HH:MM:SS:FF`; empty when there is no signal                   |
| `$(pltech-kumatimer:ltc_generator_timecode)`               | LTC Generator output position `HH:MM:SS:FF`; empty when the generator is not running |
| `$(pltech-kumatimer:dsan_rx_timer)`                        | Timer received from the DSAN Limitimer; empty when there is no signal                |

The last eight are the same states as the feedbacks of the same name, exposed
as variables so external dashboards (which read variables, not feedbacks) can
show them. They read `false` while the host is unreachable.

The three timecode variables need KUMA Timer v1.19.3 or later (older hosts leave them empty).

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
