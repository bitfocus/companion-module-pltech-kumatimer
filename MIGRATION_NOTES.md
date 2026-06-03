# Companion Module API 2.0 — Migration Notes

> **Status:** Plan zlockowany 30 kwi 2026 wieczór. Implementation start: poniedziałek (Day 1).
> Cały recon zrobiony, decyzje podjęte, czekamy na pn rano.

## TL;DR

Migrujemy `pltech-kumatimer` z `@companion-module/base@~1.14.1` na **`^2.0.4`**. ~10-13h aktywnej roboty rozłożone na 5 dni roboczych. **70% breaking changes z oficjalnego guide nas nie dotyczy** — zostaje 13 must-fix punktów + opcjonalne refactoringi.

**Strategia:** osobny train (`feature/api-2.0`) w naszym repo, **NIE** wpychamy do bitfocus org dopóki v1.8.0 review nie skończy się. Pierwszy publish przez własny .tgz w releases hosta przez ~2 tyg., dopiero potem PR do bitfocus store.

## Locked-in decisions (6)

| # | Decyzja | Wybór | Implikacja |
|---|---|---|---|
| 1 | Module ID | **A — bump tego samego ID** (`pltech-kumatimer` 1.8.0 → 2.0.0) | `legacyIds` zostają, userzy automatycznie dostają update propozycję. Ryzyko brick dla Companion v4.2 userów mitigowane przez utrzymanie 1.8.0 .tgz w archiwum releases hosta. |
| 2 | First publish path | **B — własny .tgz przez ~2 tyg.** | Nie destabilizujemy bitfocus review queue. Zbieramy bug-reports prywatnie. Po stabilizacji → PR do bitfocus store. |
| 3 | In-tree mirror | **A — update razem z external** | Spójność na koniec Day 5. Realny user dostaje to dopiero przy następnym tagu hosta (CLAUDE.md: tagi tylko na żądanie Pawła). |
| 4 | Template consolidation | **TAK — Day 4 stretch goal** | `preset_0..5` (6 buttonów) + `cue_0..N` (dynamic) zwijają się do 2 template defs. Presets.ts schudnie z ~280 → ~180 linii. Buffer 2h jeśli Companion v4.3 templates mają edge case. |
| 5 | Logger | **B — `createModuleLogger('KUMA')`** | 5 min roboty (main.ts:114, 117), lepsze logi w Companion debug, forward compat. |
| Test fix | Separate PR | Tests 17→18 fix przeciw v1.8.0 train, **bez push na GitHub** bez prośby | Czysty bug-fix, oddzielny od migracji. Nie wpływa na bitfocus review (testy nie są w packaged .tgz). |

## Recon findings — co dotyka naszego kodu

### MUST FIX — 13 punktów z konkretnymi linijkami

| # | Plik:linia | Co | Akcja v2 |
|---|---|---|---|
| 1 | `src/main.ts:1` | `import { ..., runEntrypoint, ... }` | Wywal `runEntrypoint` z importu |
| 2 | `src/main.ts:123` | `runEntrypoint(KumaTimerInstance, UpgradeScripts)` | `export default KumaTimerInstance` + `export const UpgradeScripts = [...]` |
| 3 | `src/main.ts:10` | `extends InstanceBase<KumaConfig>` | `extends InstanceBase<KumaTypes>` (nowy generic shape) |
| 4 | `src/main.ts:79` | `this.checkFeedbacks()` (no-args) | `this.checkAllFeedbacks()` |
| 5 | `src/main.ts:95` | `this.checkFeedbacks()` (no-args) | `this.checkAllFeedbacks()` |
| 6 | `src/main.ts:26` | `this.setPresetDefinitions(setupPresets())` | `this.setPresetDefinitions(structure, presets)` — DWUARGUMENTOWE |
| 7 | `src/main.ts:88` | `this.setPresetDefinitions(setupPresets(...))` | jw. — refactor `setupPresets()` żeby zwracał `{ structure, presets }` |
| 8 | `src/variables.ts:4,20,35` | `InstanceBase<KumaConfig>` w 3 helper signatures | `InstanceBase<KumaTypes>` |
| 9 | `src/variables.ts:5-16` | `setVariableDefinitions(definitions: array)` | obiekt: `{ timer: { name: '...' }, ... }` |
| 10 | `src/types.ts` | tylko `KumaConfig` + `KumaApiStatus` | dodać `interface KumaTypes extends InstanceTypes { config: KumaConfig }` |
| 11 | `companion/manifest.json:3-12` | brak `"type": "connection"` na top-level | dodać na samej górze |
| 12 | `package.json` deps | `@companion-module/base ~1.14.1`, `tools ^2.6.1` | `base ^2.0.4`, `tools ^3.0.0` (zalecane przez guide) |
| 13 | `tests/actions.test.ts:20,43` | **PRE-EXISTING BUG** — test mówi 17, mamy 18 actionów (`adjust_time` brak w expected) | osobny PR przed migracją |

### POTENTIAL — 5 punktów do zweryfikowania pod typecheckiem

| # | Plik:linia | Co | Ryzyko |
|---|---|---|---|
| 14 | `src/actions.ts` (18 callbacks) | `(action: { options: Record<string, unknown> })` | Strongly-typed options refactor — `CompanionActionDefinition<{ minutes: number, seconds: number }>` itp. ~2-3h |
| 15 | `src/feedbacks.ts:46-48,54-56` | `(feedback: { options: Record<string, unknown> })` | jw. — typed dla `is_cue_active`, `low_time` |
| 16 | `src/presets.ts:120` | `size: 12` (number) — pozostałe użycia używają string `'18'`, `'14'` | Stricter typings v2 mogą wymagać unifikacji |
| 17 | `src/main.ts:114,117` | `this.log('warn', ...)`, `this.log('error', ...)` | Migracja na `createModuleLogger` (decyzja 5B = TAK) |
| 18 | `src/presets.ts:138,169,179` | `'$(pltech-kumatimer:timer)'` interpolacje | Działają w v2, ale nowy expression-mode pozwala na arytmetykę — opcjonalna refaktoryzacja |

### CLEAN — 11 patterns z guide których NIE używamy (potwierdzone grep)

✓ `parseVariablesInString` — 0 wystąpień
✓ `subscribe` callback for feedbacks — 0
✓ `isVisibleFunction` / `isVisibleExpression` — 0
✓ `required:` property — 0
✓ `relativeDelay` w presets — 0
✓ `optionsToIgnoreForSubscribe` — 0
✓ `imageBuffer` w feedbacks — 0 (mamy 9× boolean)
✓ `InputValue` typing — 0
✓ `useVariables: true` w polach — 0
✓ `learn:` callback — 0
✓ `tcp/udp` async helpers — 0 (HTTP only)

### ALREADY GUIDE-COMPLIANT (niespodzianki na plus)

✓ `tsconfig.json` ma `"module": "NodeNext"` + `"moduleResolution": "NodeNext"`
✓ `package.json` ma `"type": "module"` (ESM gotowe)
✓ `engines.node: "^22.20"` (Node 22 wymagany przez v2)
✓ `scripts/fix-manifest.mjs` auto-syncuje `runtime.apiVersion` z installed base — po bump deps manifest sam się zaktualizuje
✓ `upgrades.ts` pusty — brak legacy upgrade scripts do refaktorowania pod wrapped options

## Effort estimate per file

| Plik | Linie | Trudność | Czas |
|---|---|---|---|
| `src/main.ts` | 123 | low | 30 min |
| `src/types.ts` | 20 | trivial | 10 min |
| `src/config.ts` | 32 | none | 0 min (already clean) |
| `src/variables.ts` | 48 | low | 20 min |
| `src/feedbacks.ts` | 74 | medium | 45 min |
| `src/actions.ts` | 211 | medium | 2-3h |
| `src/presets.ts` | 276 | **high** | 4-6h |
| `src/upgrades.ts` | 6 | none | 0 min |
| `companion/manifest.json` | 24 | trivial | 5 min |
| `package.json` | 33 | trivial | 5 min |
| `tests/*.ts` (4 files) | 821 | medium | 1-2h |
| **TOTAL** | 1611 + cfg | — | **~10-13h** |

## Day-by-day plan (Mon-Fri)

```
Mon  ▶ Branch feature/api-2.0
       Bump deps: @companion-module/base ^2.0.4, tools ^3.0.0
       Add KumaTypes wrapper (types.ts)
       Add type:"connection" w manifest.json
       Yarn install (fresh — nuke node_modules + yarn.lock)
       (target: pełna lista TS errorów dla day 2-3)

Tue  ▶ Variables: array → object form
       checkFeedbacks() → checkAllFeedbacks() x2
       runEntrypoint → default export
       createModuleLogger migration (decyzja 5B)
       Test 17→18 fix (jeśli nie zrobiony osobnym PR-em wcześniej)
       (target: yarn build green)

Wed  ▶ Actions x18: typed options refactor
       Feedbacks x9: typed options for is_cue_active, low_time
       (target: yarn build + lint green)

Thu  ▶ Presets: dwuargumentowy setPresetDefinitions(structure, presets)
       Templates dla preset_0..5 i cue_0..N (decyzja 4 = TAK)
       Dynamic regen logic dla cuesheet refresh
       (target: yarn build + lint green)

Fri  ▶ Tests update (type-shape adjustments)
       Manual smoke test w Companion v4.3+ sideload
       Bump version → 2.0.0
       Sync external repo (bitfocus org) jako branch, BEZ request review
       Sync in-tree mirror (decyzja 3A)
       Update CLAUDE.md sekcja "Wersje aktywne"
       Tag NIE — czekamy na prośbę po smoke
```

### Punkty kontrolne (escalation gates)

1. **Wtorek wieczór** — `yarn build` zielony? Jeśli nie, eskalujemy zanim Wed się zacznie.
2. **Czwartek po lunchu** — presets two-tier shape działa? Jeśli nie, templates idą na 2.0.1, na Day 4 zostaje tylko core split.
3. **Piątek przed sync** — smoke test pass? Bug-list pusta? Jeśli nie — sync TYLKO do `feature/api-2.0` w naszym repo, BEZ external bitfocus push.

## Risk register

| Ryzyko | Prawd. | Wpływ | Mitigacja |
|---|---|---|---|
| Presets overhaul większy niż szacuję (276 linii + dwuargumentowe + dynamic regen + templates) | wysoka | +1 dzień | Wed buffer + Thu dedykowany dzień + templates jako stretch (skip jeśli się nie mieści) |
| Bitfocus odmraża review v1.8.0 w środku migracji z prośbą o zmiany | niska | przerwać migrację, fix v1, wrócić | Sprawdzam queue codziennie przed startem dnia |
| Companion v4.3 dev environment ma własne bugi (świeża wersja) | średnia | trudniej smoke testować | Plan B: nightly Companion v4.4 |
| Strongly-typed options wycieka do hosta (HTTP layer) | niska | refaktor `sendCommand` | Mamy clean separation — `sendCommand(action, params)` zostaje typowo `Record<string, unknown>` przy wyjściu HTTP |
| Userzy na Companion v4.2 zostają orphaned | wysoka | support ticket flood | 1.8.0 .tgz pozostaje w historic releases hosta + komunikat na stronie |
| Test 17→18 bug ujawnia że CI nie odpalał testów | średnia | weryfikacja CI workflow | Quick check przed pierwszym commit Day 1 |

## Surprise findings

### S1. Pre-existing bug w testach
`tests/actions.test.ts:20` mówi `'exposes all 17 actions'` ale `actions.ts` ma 18 (od dodania `adjust_time`). `expect(ids).toHaveLength(17)` powinno failować przy 18. Jeśli CI ostatnio był zielony — możliwe że testy nie odpalały się od ostatniej zmiany. **Action item Day 1 morning:** zweryfikować `yarn test` na current main przed migracją.

### S2. setupPresets ma side-effect w main.ts:88
`setupPresets` wywoływany co 10s z dynamic cues+presets. Po migracji do `setPresetDefinitions(structure, presets)` musimy zachować dynamic refresh — refactor wzór:
```ts
const { structure, presets } = setupPresets(data.cues || [], data.presets || [])
this.setPresetDefinitions(structure, presets)
```

### S3. Categories migrują do osobnego structure array
Obecnie `category: 'Transport'` na każdym preset. W v2 to przenosi się do osobnego `structure[]` z grupowaniem. Implikacja: structure też musi być dynamicznie regenerowane razem z presetami (żeby `cues` group zawierał aktualne `cue_0..N`).

### S4. fix-manifest.mjs jest naszym przyjacielem
Skrypt już syncuje `runtime.apiVersion` z installed `@companion-module/base@version`. Po bump deps do `^2.0.4`, manifest **automatycznie** dostanie `apiVersion: "2.0.4"` przy `yarn package`. Manualnie tylko dodać `"type": "connection"` na top-level.

## Test fix — osobny PR

```
Branch:    pltech-dev/Kuma-Timer → fix/test-action-count
Repo:      tylko monorepo (companion-module-pltech-kumatimer/)
Files:     tests/actions.test.ts (1 plik)
Diff:      +1 linia w expected[] ('adjust_time'), 17 → 18 w toHaveLength()
Tag:       BRAK
PR title:  "test: bump expected action count from 17 to 18 (adjust_time)"
Commits:   1 commit, no co-author tag (per CLAUDE.md)
Push:      tylko na żądanie
```

## Sources / official refs

- **Migration guide (truth):** https://companion.free/for-developers/module-development/api-changes/v2.0
- **@companion-module/base v2.0.0 release notes:** https://github.com/bitfocus/companion-module-base/releases/tag/companion-module-base-v2.0.0
- **@companion-module/base v2.0.0-alpha (full breaking changes list):** https://github.com/bitfocus/companion-module-base/releases/tag/companion-module-base-v2.0.0-alpha.0
- **npm package:** https://www.npmjs.com/package/@companion-module/base (latest stable: 2.0.4, 2026-04-19)
- **companion-module-tools releases:** https://github.com/bitfocus/companion-module-tools/releases (v3.0.0 zalecane)
- **Migration tracking issue (kontekst od maintainerów):** https://github.com/bitfocus/companion-module-youtube-live/issues/155

## Open follow-ups (nie zapomnieć)

- [x] ~~Day 1 morning: zweryfikować `yarn test` na current main (czy 17→18 bug faktycznie failuje)~~ — DONE 1 maja, fix landed na `main` (commits ed942ea + 1ca9dc4)
- [ ] Day 5: bump in-tree mirror razem z external (decyzja 3A)
- [ ] Po smoke test: zaktualizować `CLAUDE.md` → tabela "Wersje aktywne" z dual-train info
- [ ] +2 tyg po Day 5: PR do bitfocus org (gdy v1.8.0 skończy review queue)
- [ ] Po accept przez bitfocus: usunąć banner "module pending Bitfocus review" z `web-kuma/index.html` + `help.html`
- [ ] **GitHub Actions Node.js 20 deprecation** (deadline 2 czerwca 2026) — bump `actions/checkout@v4` + `actions/setup-node@v4` w build.yml + module-test.yml + 3 innych workflows (cały repo)

## Day 1 progress log (1 maja 2026)

### Morning (DONE — landed na origin/main)
- ✅ `tests/actions.test.ts` 17→18 fix (commit `ed942ea`)
- ✅ `.github/workflows/module-test.yml` — lint + vitest na push/PR (commit `1ca9dc4`)
- ✅ Workflow zielony: 21s total, run #25207675704

### Implementation start (na branch `feature/api-2.0`)
- ✅ Branch `feature/api-2.0` created
- ✅ `package.json` deps bumped: `@companion-module/base ^2.0.4`, `@companion-module/tools ^3.0.0` → installed `2.0.4` + `3.0.1`
- ✅ `companion/manifest.json` dostało `"type": "connection"` (linia 3)
- ✅ `src/types.ts` dostało `KumaTypes extends InstanceTypes` wrapper
- ✅ Fresh `yarn install` przeszło (YN0086 peer warnings, non-blocking)
- ✅ `yarn build` inventory zebrana — **40 TS errorów** w 5 plikach

### TS errors inventory (zapisane w `/tmp/api2-tsc-errors.log`)

| Plik | Errors | Kategoria |
|---|---|---|
| `src/main.ts` | 6 | runEntrypoint, InstanceBase generic, checkFeedbacks×2, setPresetDefinitions×2 |
| `src/variables.ts` | 12 | InstanceBase generic×3, variableId format×9 |
| `src/presets.ts` | 20 | `type: 'button'` → `type: 'simple'` × 20 wystąpień |
| `src/types.ts` | 1 | KumaTypes JsonObject constraint mismatch |
| `src/upgrades.ts` | 1 | KumaConfig JsonObject cascade z types.ts |
| **TOTAL** | **40** | — |

### 2 świeże znaleziska (poza original recon)

**S5. `KumaConfig` nie spełnia `JsonObject` constraint**
- `InstanceTypes.config: JsonObject` (`{ [k: string]: JsonValue }`)
- Nasz `KumaConfig` ma optional fields ze stałymi typami — TS zgłasza missing index signature
- **Decision required Day 2:** patrz inne HTTP-only zmigrowane moduły jak rozwiązują (15 min research)

**S6. Presets `type: 'button'` → `type: 'simple'`**
- Literal value rename, 20 mechanicznych zmian w presets.ts
- Plus integracja z dwuargumentowym `setPresetDefinitions(structure, presets)` zostaje Day 4

### Implications dla day-by-day plan

- **Day 2 lżejsze niż szacowałem** — actions.ts i feedbacks.ts NIE wyrzucają TS errorów (strongly-typed options to optional hardening, Day 3 zostaje robotą "soft").
- **Day 4 cięższe niż szacowałem** — 20 presets × `type` rename + structure split = większy skok, ale wciąż mechaniczny.
- **Day 2 dostaje +15 min na research** — KumaTypes JsonObject pattern z innych modułów.

## Day 2 progress log (1 maja 2026 popołudnie)

### Done

- ✅ **Research InstanceTypes / JsonObject / createModuleLogger** z `node_modules/@companion-module/base/dist/`. Authoritatywne źródło. Kluczowy finding: `JsonObject` to intersection type który **nie akceptuje optional fields** (`string | undefined` nie spełnia value type constraint). Trzeba: a) extend JsonObject **i** b) fields required (no optional). Companion zawsze pasuje defaults z config.ts schema, więc to bezpieczne.
- ✅ **types.ts** — `KumaConfig extends JsonObject` z required fields (`host: string`, `port: number`, `poll_interval: number`); `KumaTypes` dostaje `secrets: undefined` żeby saveConfig sygnatura była tight.
- ✅ **variables.ts** — array → object form (per official guide); `InstanceBase<KumaConfig>` → `InstanceBase<KumaTypes>` w 3 sygnaturach helper functions.
- ✅ **main.ts** — runEntrypoint → `export default` + named `UpgradeScripts` export; `InstanceBase<KumaTypes>`; `checkFeedbacks()` → `checkAllFeedbacks()` ×2; `this.log('warn'/'error', ...)` → module-level `createModuleLogger('KUMA')` instance z `.warn`/`.error` methods (decyzja 5B); init/configUpdated dostały `isFirstInit` + `secrets` underscore-prefixed.
- ✅ **upgrades.ts** — dodany named export obok default (v2 entry-point pattern).
- ✅ **tests/variables.test.ts** — assertion zmieniona z `array.map((d) => d.variableId)` na `Object.keys()` żeby pasowało do nowego v2 shape.
- ✅ Commit `d4e60fe WIP: Day 2 — lifecycle + variables + KumaConfig JsonObject [skip ci]` na branchu.

### Stan po Day 2

| Metric | Wartość |
|---|---|
| TS errors | **40 → 21** (zostało: 19 w presets.ts + 2 w main.ts setPresetDefinitions arity) |
| `yarn test` | 120/120 ✓ |
| `yarn lint` | clean ✓ |
| Pliki clean (zero TS errors) | types.ts, variables.ts, upgrades.ts, config.ts, actions.ts, feedbacks.ts |
| Pliki z remaining errors | presets.ts (Day 4) + main.ts setPresetDefinitions calls (Day 4) |

### Surprise findings (nowe)

**S7. `JsonObject` nie pozwala na optional fields**
- Próba `extends JsonObject` z `host?: string` failuje bo TS expanduje na `string | undefined`, a `JsonObject` value type wymaga `JsonValue` (no undefined).
- Rozwiązanie: required fields + zaufanie do Companion's config defaults schema.
- **Future-proof note:** jeśli kiedyś dodajemy nowy config field, MUSI być required (chyba że zaakceptujemy wszystkie fallbacki w setterze).

**S8. `init` i `configUpdated` mają w v2 dodatkowe argumenty**
- `init(config, isFirstInit, secrets)` — recon nie złapał, tylko przejrzałem release notes.
- `configUpdated(config, secrets)` — jw.
- Naszą sygnaturę odhaczam podkreśleniem (`_isFirstInit`, `_secrets`) bo nie używamy.
- **Aktualizuje original recon checklist** — to powinno być w "MUST FIX" lecz nie było.

## Day 4 progress log (1 maja 2026 popołudnie, kontynuacja)

### Skip Day 3 — accepted

Day 3 (strongly-typed action/feedback options refactor) świadomie pominięty. Po Day 2 inventory potwierdziło że actions.ts i feedbacks.ts **nie wyrzucają TS errorów** — strongly-typed options to opcjonalne hardening. Można wrócić post-2.0.0 jeśli potrzeba (jako 2.0.1 polish).

### Done

- ✅ **Research v2 preset structure types** w `node_modules/@companion-module/base/dist/module-api/preset/`:
  - `CompanionPresetSection<TManifest>` — `{ id, name, definitions: [] }`
  - `CompanionPresetDefinitions` — keyed object (preset id → definition)
  - `CompanionSimplePresetDefinition` — `type: 'simple'` + style + steps + feedbacks (BEZ `category` field — tym zajmuje się structure)
  - Templates dostępne (`CompanionPresetGroupTemplate`) ale ograniczone — patrz S9
- ✅ **presets.ts pełen rewrite** — 22 buttony, wszystkie `type: 'button'` → `type: 'simple'`. `setupPresets()` zwraca teraz `{ structure, presets }`. Structure ma 5 sekcji w stabilnym porządku (transport, presets, cues, info, sms).
- ✅ **main.ts** — oba miejsca `setPresetDefinitions` zaktualizowane do dwuargumentowej formy. Dynamic regen w poll loop dalej działa (struktura też się odświeża razem z presetami przy zmianie cuesheet).
- ✅ **tests/presets.test.ts** — pełen rewrite pod nowy shape. Helper `btn()` czyta z `result.presets[id]`. Stary `categories` test suite wymieniony na `structure` test suite. Plus 4 nowe v2-shape regression tests.
- ✅ Commit `328989b Day 4 — presets v2 shape: type 'simple' + structure array` (BEZ [skip ci] — build green, workflow ma prawo gate'ować).

### S9. Template consolidation — technicznie niedopasowane do naszych danych

Decyzja 4 była "TAK" (template consolidation cues/presets), ale podczas Day 4 implementation odkryłem że v2 template feature ma ograniczenie blokujące dla naszego use case:

`CompanionPresetGroupTemplate.templateValues` injects tylko **jeden** `CompanionVariableValue` per generated button. Nasz preset_0..5 i cue_0..N mają **per-button dynamiczne labels** (`'10M'`, `'15M'`, `'John Smith\nKeynote'`) które nie są derywable z pojedynczej zmiennej w czasie definicji template'a.

Workaround przez `style.text: '$(local:var)'` z fixed format też nie działa — różne presets mają różny format (preset shows minutes-suffix, cue shows speaker-newline-topic).

**Decyzja:** zostawiam individual preset definitions (50 LOC overhead vs templates), labels pozostają dynamiczne. Udokumentowane w komentarzu `setupPresets()` header. Revisit gdy Bitfocus doda per-templateValue style overrides.

### Stan po Day 4 (migracja code-side complete)

| Metric | Wartość |
|---|---|
| TS errors | **40 → 0** ✓ |
| `yarn build` | EXIT 0 ✓ |
| `yarn test` | **124/124** (było 120, +4 nowe v2 regression tests) |
| `yarn lint` | clean ✓ |
| Commits na branchu `feature/api-2.0` | 6 (4× WIP + dist catchup + Day 4) |

### Co zostało (Day 5)

- [x] ~~Manual smoke test w Companion v4.3+~~ — **PASS 1 maja 2026** (patrz Day 5 progress log)
- [x] ~~Bump `package.json` version 1.8.0 → 2.0.0~~ — done
- [x] ~~Update CLAUDE.md tabela "Wersje aktywne"~~ — done
- [ ] **PR do bitfocus org** — odłożone na **~lipiec 2026** (~2 miesiące field testingu, decyzja Pawła z 1 maja). v1.8.0 może w międzyczasie zostać zaakceptowany przez Dist albo nie — nieważne, v2.0 i tak supersede'uje.
- [ ] Sync in-tree mirror (decyzja 3A — automatycznie przy mergu feature/api-2.0 → main, dopiero gdy gotowi do bitfocus push)
- [ ] Push `feature/api-2.0` na origin (czeka na decyzję Pawła)

## Day 5 progress log (1 maja 2026 wieczór — migracja COMPLETE)

### Smoke test workflow setup
1. **Symlink fail (Permission Model)** — pierwszy setup `~/companion-dev/pltech-kumatimer → /Users/pawel/Countdown Clock/...` failował z "Restart forced" bo Companion v4.3.1 odpala child process z `--allow-fs-read=<dev path>` i Node permission model rozwiązuje symlink do target poza allowlist'em → child crashuje.
2. **Real folder + yarn dev script** — fix: rsync do `~/companion-dev/pltech-kumatimer/` (real files w allowlisted path), commit `8e89e8a` dodaje `yarn dev` script (`yarn build && fix-manifest && rsync`) dla future dev iteracji. Initial copy: 1.75s, subsequent rsync: <1s delta.
3. **Manifest apiVersion 1.14.1 → 2.0.4 sync** (commit `dc33b69`) — fix-manifest.mjs odpala się tylko podczas `yarn package`, więc przy pierwszym dev folder load apiVersion był stale. Yarn dev teraz zawiera fix-manifest, więc to nie powtórzy się.

### Smoke results
| Test | Status | Notatki |
|---|---|---|
| Connection startup | ✓ PASS | Po fix dev folder workflow, child process startuje czysto, polling działa |
| Variables (B) | ✓ PASS | Manualnie `$(KUMA_Timer_DEV:timer)` działa; drag z preset library auto-rewrites prefix `pltech-kumatimer` → `KUMA_Timer_DEV` (Companion behavior, nie module-side) |
| Actions (C) | ✓ PASS | Wszystkie 18 actions dispatched i odebrane przez host (po dodaniu auth feature) |
| Feedbacks (D) | ✓ PASS | is_live, is_paused, is_hidden i Timer display 4-feedback combo działają |
| Preset library structure (E) | ✓ PASS | **5 sekcji w stabilnej kolejności** (Transport / Presets / Cues / Info / SMS) — confirms `setPresetDefinitions(structure, presets)` two-arg form działa w Companion v4.3.1 |

### S10. Auth feature added during smoke (out-of-scope but unavoidable)

Smoke test wykrył że host ma włączone `web_control_password` auth, a moduł nigdy nie obsługiwał tego ani w v1.8.0. Trzy ścieżki rozważone (wyłączyć auth na hoście / dodać feature / odłożyć na 2.0.1). User wybrał: dodać feature do v2.0.0.

Commit `1d1bc0d feat(companion): add shared-password auth support for /api/command`:
- `config.ts` — nowe pole `password` (textinput, width 12, default '')
- `types.ts` — `KumaConfig.password: string` (required przez JsonObject constraint, empty string OK = no auth)
- `main.ts::sendCommand` — wstrzykuje `key: <password>` do JSON body **gdy non-empty**. Empty password = brak `key` w payload, host's `provided != configured_pwd` check daje przy obu pustych = match → command idzie. Backwards compatible.

Note: NIE strictly migration-related, ale wymagane dla smoke test pass. v1.8.0 NIE miał tego — userzy z auth-on hostami nie mogli używać Bitfocus before this commit.

### Final state — branch feature/api-2.0

```
8e89e8a -> 1d1bc0d  (build/dev infrastructure + auth feature)
328989b -> 17c9306  (Day 4 + docs)
b0071aa -> d4e60fe -> 5b71363  (Day 1 + Day 2 + docs)
6ee451c  (dist catchup pre-existing bug)
[origin/main]: 1ca9dc4 ci workflow + ed942ea test fix 17→18
```

Final metrics:
- TS errors: 40 → **0**
- yarn build: EXIT 0
- yarn test: 124/124
- yarn lint: clean
- Czas Day 1+2+4+5: **~5h aktywnej roboty** (6h estymowane originally — w czasie)
- Day 3 (typed options) świadomie pominięty — opcjonalny, post-2.0.0 jeśli potrzeba

### Decyzje recap

| # | Decyzja | Realizacja |
|---|---|---|
| 1 | Same module ID, bump 1.8.0 → 2.0.0 | ✓ done w v2.0.0 commit |
| 2 | Własny .tgz przez ~2 tyg., potem PR do bitfocus | **Updated 1 maja:** ~2 miesiące (lipiec 2026) field testing zamiast 2 tyg. Pawel testuje v2.0 lokalnie z dev folder (`yarn dev` workflow), bug-find w tym oknie wraca do v2.0.x patches, dopiero gdy stable → PR do bitfocus org |
| 3 | In-tree mirror update razem z external | ⏳ przy mergu feature/api-2.0 |
| 4 | Template consolidation cues/presets | ✗ technicznie niedopasowane (S9), zostały individual presets |
| 5 | createModuleLogger migration | ✓ done w Day 2 |
| 6 (test fix) | Osobny PR przeciwko v1.8.0 train | ✓ landed na origin/main jako commit ed942ea + 1ca9dc4 |
