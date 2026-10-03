# Cognitive Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A guided 8-task cognitive test for dogs with per-dog profiles, results stored on the device, and comparison with the previous test.

**Architecture:** Pure TypeScript modules in `src/cogtest/` hold the task definitions, scoring, comparison, storage and a reducer; they are unit-tested with Vitest. React pages under `src/pages/profile/` use a `useCogStore()` hook that wraps the reducer and persists to localStorage after every change. Routing stays on `HashRouter`.

**Tech Stack:** React 19, TypeScript, Vite 8, react-router 8 (`HashRouter`), zod 4, Vitest 5. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-03-cognitive-test-design.md`

## Global Constraints

- Free, no server, no accounts: data lives in `localStorage` under key `neurogames:v1`; export/import as a JSON file.
- Compare a dog only with itself. No percentiles, no "IQ", no comparison with other dogs.
- Show the "not a veterinary diagnosis" note before the test and on the result screen.
- Eight tasks in fixed order 1–8, each scored 0–3; skill = sum of its two tasks, 0–6; total 0–24 only when all eight are done.
- Seconds are floored to whole numbers before scoring.
- Skip reasons: «собака отказалась», «нет возможности», «собака нервничает».
- At most one unfinished test per dog.
- Retest warning when the previous finished test of the same dog started less than 30 days ago; warning only, never blocking.
- Compare only tests with the same `protocolVersion` (currently `1`), only tasks done in both tests.
- UI copy in Russian; visual style follows the existing cartoon CSS in `src/index.css`.
- Unit tests live in `src/**/*.test.ts` (the Vitest include pattern); UI is verified with the DevTools browser script described in Task 8.

## Review Focus

- `localStorage` throws (private mode, blocked site data, quota) → the app must still work for the session and show a one-line warning that results will not be saved. Test in Task 3.
- Stored JSON is corrupt or fails the schema → no crash; recovery notice with "download the data" and "start over". Test in Task 3 (`loadStore` returns `{ kind: 'corrupt' }`) and Task 5 (screen).
- Imported file is not JSON, fails the schema, or has a test whose `dogId` is unknown → error message, current data unchanged. Test in Task 3.
- URL `#/profile/run/<id>` for an unknown or already finished test → "Тест не найден" with a link back, or redirect to the result for a finished test. Covered in Task 6.
- Starting a test for a dog that already has an unfinished one → resume the existing test instead of creating a second. Test in Task 4.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/cogtest/tasks.ts` | Static definitions of the 8 test tasks (copy, equipment, steps, kind, scoring text, related game, sources) |
| `src/cogtest/types.ts` | Shared types: `Dog`, `TaskResult`, `CogTest`, `Store`, `SkipReason`, `DetourOutcome` |
| `src/cogtest/scoring.ts` | `scoreTask`, `summarizeTest` (skill scores, total, strongest, weakest) |
| `src/cogtest/compare.ts` | `previousTest`, `compareTests`, `daysBetween` |
| `src/cogtest/recommend.ts` | `recommendGames` for the weakest skill |
| `src/cogtest/storage.ts` | zod schema, `loadStore`, `saveStore`, `exportStore`, `parseImport`, `makeId` |
| `src/cogtest/reducer.ts` | Pure `reducer(store, action)` with all mutations |
| `src/cogtest/useCogStore.ts` | React hook: reducer + persistence + storage status |
| `src/cogtest/CogStoreContext.tsx` | One shared store for all test pages: `CogStoreProvider`, `useCogStoreContext()` |
| `src/pages/profile/ProfilesPage.tsx` | `#/profile`: onboarding, dog list, export/import, recovery |
| `src/pages/profile/TestRunPage.tsx` | `#/profile/run/:testId`: checklist and tasks |
| `src/pages/profile/TestResultPage.tsx` | `#/profile/result/:testId`: scores, comparison, recommendations, note |
| `src/pages/profile/DogProfilePage.tsx` | `#/profile/dog/:dogId`: history list and charts |
| `src/components/cogtest/Stopwatch.tsx` | Start/stop/reset stopwatch with optional auto-stop limit |
| `src/components/cogtest/TrendChart.tsx` | Inline SVG line chart of numeric points over dates |
| `src/App.tsx`, `src/index.css` | Routes, «Игры / Профиль» switch in the header, styles |

---

### Task 1: Task definitions and scoring

**Files:**
- Create: `src/cogtest/types.ts`, `src/cogtest/tasks.ts`, `src/cogtest/scoring.ts`
- Test: `src/cogtest/scoring.test.ts`

**Interfaces:**
- Produces:
  - `type TaskId = 'towel-find' | 'which-hand' | 'delayed-search' | 'distraction-search' | 'detour' | 'empty-cup' | 'leave-it' | 'bowl-wait'`
  - `type DetourOutcome = 'fast' | 'slow' | 'barges' | 'gave-up'`
  - `type SkipReason = 'refused' | 'not-possible' | 'stressed'` with `SKIP_REASON_LABELS: Record<SkipReason, string>` = «собака отказалась», «нет возможности», «собака нервничает»
  - `type TaskResult = { status: 'done'; score: 0|1|2|3; trials?: boolean[]; seconds?: number; found?: boolean; outcome?: DetourOutcome } | { status: 'skipped'; reason: SkipReason }`
  - `type RawResult = { trials: boolean[] } | { seconds: number; found?: boolean } | { outcome: DetourOutcome }`
  - `interface TestTask { id: TaskId; skill: GameType; title: string; goal: string; equipment: string[]; steps: string[]; kind: 'trials' | 'timer' | 'outcome'; trialCount?: 3; timerLimitSeconds?: number; scoring: string[]; relatedGameId?: string; sources: { title: string; url: string }[] }`
  - `const TEST_TASKS: TestTask[]` (order 1–8 as in the spec table), `const PROTOCOL_VERSION = 1`
  - `scoreTask(id: TaskId, raw: RawResult): 0|1|2|3`
  - `summarizeTest(results: Partial<Record<TaskId, TaskResult>>): TestSummary` where `TestSummary = { skills: Record<GameType, { score: number; max: 3 | 6; complete: boolean; done: number }>; total: number | null; strongest: GameType[]; weakest: GameType[] }`

- [ ] **Step 1: Write failing tests in `src/cogtest/scoring.test.ts`**

```ts
it.each([[0, 3], [15, 3], [15.9, 3], [16, 2], [60, 2], [61, 1], [119, 1]])(
  'towel-find found in %s s → %i', (s, p) => expect(scoreTask('towel-find', { seconds: s, found: true })).toBe(p))
it('towel-find not found → 0', () => expect(scoreTask('towel-find', { seconds: 120, found: false })).toBe(0))
it.each([[[true, true, true], 3], [[true, false, true], 2], [[false, false, false], 0]])(
  'trials %j → %i', (t, p) => expect(scoreTask('which-hand', { trials: t })).toBe(p))
it.each([['fast', 3], ['slow', 2], ['barges', 1], ['gave-up', 0]])(
  'detour %s → %i', (o, p) => expect(scoreTask('detour', { outcome: o as DetourOutcome })).toBe(p))
it.each([[60, 3], [59, 2], [15, 2], [14, 1], [3, 1], [2.9, 0], [0, 0]])(
  'leave-it %s s → %i', (s, p) => expect(scoreTask('leave-it', { seconds: s })).toBe(p))
it.each([[15, 3], [14, 2], [5, 2], [4, 1], [1, 1], [0.9, 0]])(
  'bowl-wait %s s → %i', (s, p) => expect(scoreTask('bowl-wait', { seconds: s })).toBe(p))
```

Plus `summarizeTest` cases:
- all eight done with scores `[3,2, 3,1, 2,2, 0,1]` → skills `scent 5/6, memory 4/6, thinking 4/6, self-control 1/6`, all `complete`, `total 18`, `strongest ['scent']`, `weakest ['self-control']`.
- `leave-it` skipped → `self-control` `{ score: bowl score, max: 3, complete: false }`, `total null`, weakest chosen among complete skills only.
- fewer than two complete skills → `strongest []` and `weakest []`.
- ties: memory and thinking both 4 and lowest → `weakest ['memory', 'thinking']`.
- `TEST_TASKS` has 8 entries, ids unique, two per skill, in spec order.

- [ ] **Step 2: Run** `npx vitest run src/cogtest/scoring.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement** `types.ts`, `tasks.ts` (Russian copy from the spec and the matching catalog games: `relatedGameId` = `treat-hide-and-seek`, `which-hand`, `delayed-search`, `search-after-distraction`, `barrier-detour`, `empty-cup`, `leave-it-floor`, `wait-at-bowl`; `timerLimitSeconds` 120 for `towel-find`, 60 for `leave-it`, 60 for `bowl-wait`; sources: Coren via Outward Hound, Dognition guide, Dog Aging Project, CBS/Linköping where relevant) and `scoring.ts`. Floor seconds with `Math.floor` before comparing.

- [ ] **Step 4: Run** `npx vitest run src/cogtest` — Expected: PASS.

- [ ] **Step 5: Commit** `git commit -m "feat(test): task definitions and scoring"`

---

### Task 2: Comparison and recommendations

**Files:**
- Create: `src/cogtest/compare.ts`, `src/cogtest/recommend.ts`
- Test: `src/cogtest/compare.test.ts`, `src/cogtest/recommend.test.ts`

**Interfaces:**
- Consumes: `CogTest` (Task 3 defines the stored shape; define it in `types.ts` now): `interface CogTest { id: string; dogId: string; protocolVersion: number; startedAt: string /* ISO */; finishedAt?: string; tasks: Partial<Record<TaskId, TaskResult>>; note?: string }`; `summarizeTest`.
- Produces:
  - `previousTest(tests: CogTest[], current: CogTest): CogTest | undefined` — latest finished test of the same dog and `protocolVersion`, `startedAt` earlier than `current.startedAt`.
  - `compareTests(current: CogTest, previous: CogTest): Comparison` where `Comparison = { tasks: Partial<Record<TaskId, { now: number; before: number; delta: number }>>; skills: Partial<Record<GameType, { now: number; before: number; delta: number }>> }` — tasks only when done in both; a skill only when both its tasks are done in both tests.
  - `daysBetween(fromIso: string, toIso: string): number` (whole days, floored).
  - `recommendGames(skill: GameType, games: Game[], count = 3): Game[]` — games whose `types[0] === skill`, sorted by `difficulty` then `title` (`localeCompare` `'ru'`).

- [ ] **Step 1: Write failing tests**
  - `previousTest` ignores: unfinished tests, other dogs, other `protocolVersion`, tests started after `current`; returns the most recent of the rest; `undefined` when none.
  - `compareTests`: memory `now 5, before 3, delta 2`; a task skipped in either test is absent; a skill with any skipped task is absent.
  - `daysBetween('2026-10-01T10:00:00Z', '2026-10-30T09:00:00Z')` → `28`.
  - `recommendGames('memory', games)` on the real catalog → 3 games, all `types[0] === 'memory'`, difficulties non-decreasing.

- [ ] **Step 2: Run** `npx vitest run src/cogtest` — Expected: FAIL.
- [ ] **Step 3: Implement** both modules.
- [ ] **Step 4: Run** `npx vitest run src/cogtest` — Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(test): comparison with previous test and game recommendations"`

---

### Task 3: Storage, schema, export and import

**Files:**
- Create: `src/cogtest/storage.ts`
- Test: `src/cogtest/storage.test.ts`

**Interfaces:**
- Produces:
  - `interface Dog { id: string; name: string; breed?: string; birthMonth?: string /* YYYY-MM */; createdAt: string }`
  - `interface Store { version: 1; dogs: Dog[]; tests: CogTest[] }`, `emptyStore(): Store`
  - `storeSchema` (zod, strict) matching `Store`; `TaskResult` validated as a discriminated union on `status`, `score` 0–3; `birthMonth` regex `^\d{4}-(0[1-9]|1[0-2])$`; every `test.dogId` must reference an existing dog (`superRefine`).
  - `const STORAGE_KEY = 'neurogames:v1'`
  - `loadStore(storage: Pick<Storage, 'getItem'> | null): { kind: 'ok'; store: Store } | { kind: 'empty' } | { kind: 'corrupt'; raw: string } | { kind: 'unavailable' }`
  - `saveStore(storage: Pick<Storage, 'setItem'> | null, store: Store): boolean` (false when storage is null or throws)
  - `exportStore(store: Store): string` (pretty JSON)
  - `parseImport(text: string): { ok: true; store: Store } | { ok: false; error: 'not-json' | 'invalid' }`
  - `makeId(): string` — `crypto.randomUUID` when available, otherwise time + random base36 (file:// pages may lack it).

- [ ] **Step 1: Write failing tests** with an in-memory fake storage:
  - round trip: `saveStore` then `loadStore` → `{ kind: 'ok' }` with equal store.
  - nothing stored → `{ kind: 'empty' }`; storage `null` → `{ kind: 'unavailable' }`; `getItem` throws → `{ kind: 'unavailable' }`.
  - stored `'{bad'` → `{ kind: 'corrupt', raw: '{bad' }`; stored valid JSON with `score: 7` → `corrupt`.
  - `saveStore` returns `false` when `setItem` throws.
  - `parseImport('nope')` → `not-json`; JSON with a test whose `dogId` matches no dog → `invalid`; `parseImport(exportStore(store))` → `ok` with equal store.
  - `makeId()` twice → two different non-empty strings.

- [ ] **Step 2: Run** `npx vitest run src/cogtest/storage.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** `storage.ts`. Move `Dog`/`Store` into `types.ts` if that keeps imports one-directional.
- [ ] **Step 4: Run** `npx vitest run src/cogtest` — Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(test): local storage, schema, export and import"`

---

### Task 4: Reducer and `useCogStore` hook

**Files:**
- Create: `src/cogtest/reducer.ts`, `src/cogtest/useCogStore.ts`
- Test: `src/cogtest/reducer.test.ts`

**Interfaces:**
- Consumes: `Store`, `CogTest`, `TaskResult`, `makeId`, `loadStore`, `saveStore`, `PROTOCOL_VERSION`.
- Produces:
  - `type Action =`
    `{ type: 'addDogs'; dogs: { name: string; breed?: string; birthMonth?: string }[]; now: string }` |
    `{ type: 'updateDog'; dogId: string; name: string; breed?: string; birthMonth?: string }` |
    `{ type: 'deleteDog'; dogId: string }` (also deletes the dog's tests) |
    `{ type: 'startTest'; dogId: string; now: string; testId: string }` |
    `{ type: 'recordTask'; testId: string; taskId: TaskId; result: TaskResult }` |
    `{ type: 'finishTest'; testId: string; now: string }` |
    `{ type: 'setNote'; testId: string; note: string }` |
    `{ type: 'replaceAll'; store: Store }`
  - `reducer(store: Store, action: Action): Store` — pure; ids for new dogs come from `makeId()` (inject via a second optional parameter `ids = makeId` so tests are deterministic).
  - `unfinishedTest(store: Store, dogId: string): CogTest | undefined`
  - `useCogStore(): { store: Store; status: 'ok' | 'unavailable' | 'corrupt'; corruptRaw?: string; dispatch(action: Action): void; startTest(dogId: string): string /* returns testId (existing unfinished one if present) */ ; resetCorrupt(): void }` — initializes from `loadStore(window.localStorage)` inside try/catch, saves after every dispatch; `status` becomes `'unavailable'` if a save fails.

- [ ] **Step 1: Write failing tests**
  - `addDogs` with two names → two dogs, names trimmed, empty names rejected (store unchanged).
  - `startTest` for a dog that already has an unfinished test → store unchanged (the hook then returns the existing id); `unfinishedTest` finds it.
  - `recordTask` overwrites a previous result for the same task; unknown `testId` → store unchanged.
  - `finishTest` sets `finishedAt`; a finished test ignores further `recordTask`.
  - `deleteDog` removes the dog and all its tests, other dogs untouched.
  - `replaceAll` returns the given store.

- [ ] **Step 2: Run** `npx vitest run src/cogtest/reducer.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** `reducer.ts` and `useCogStore.ts` (`useReducer` + `useEffect` to persist; keep the hook thin).
- [ ] **Step 4: Run** `npx vitest run src/cogtest && npx tsc -b` — Expected: PASS, no type errors.
- [ ] **Step 5: Commit** `git commit -m "feat(test): store reducer and persistence hook"`

---

### Task 5: Routes, header switch and the profiles page

**Files:**
- Create: `src/cogtest/CogStoreContext.tsx`, `src/pages/profile/ProfilesPage.tsx`
- Modify: `src/App.tsx` (provider, routes, header switch), `src/index.css` (append a `/* Cognitive test */` section)

**Interfaces:**
- Consumes: `useCogStore`, `exportStore`, `parseImport`, `unfinishedTest`, `previousTest`, `daysBetween`.
- Produces: `CogStoreProvider({ children })` wrapping `<Routes>` in `App.tsx`, and `useCogStoreContext(): ReturnType<typeof useCogStore>` (throws if used outside the provider); routes `/profile`, `/profile/run/:testId`, `/profile/result/:testId`, `/profile/dog/:dogId` (later tasks fill the last three; add placeholder elements now). Header gets a two-link switch «Игры» (`/`) and «Профиль» (`/profile`) with `aria-current="page"` on the active one.

Behaviour of `#/profile`:
- No dogs → onboarding: «Сколько у вас собак?» number input 1–10, then that many forms (name required, breed, birth month `type="month"`), button «Сохранить». All test pages read the store through `useCogStoreContext()`, never by calling `useCogStore()` themselves.
- With dogs → one card per dog: name, last finished test date and total (or «неполный»), buttons «Пройти тест» (or «Продолжить тест» when unfinished), «История», «Изменить», «Удалить» (confirm with `window.confirm` naming the dog and saying the history will be deleted). «Добавить собаку».
- «Пройти тест» shows the 30-day warning inline when `daysBetween(previous.startedAt, now) < 30`, with «Всё равно пройти».
- «Сохранить копию» downloads `neurogames-backup-YYYY-MM-DD.json` via `Blob` + temporary `<a download>`; «Загрузить копию» (`<input type="file" accept="application/json">`) → `parseImport` → error line in Russian for `not-json` / `invalid`, otherwise `confirm` and `replaceAll`.
- `status === 'unavailable'` → warning «Браузер не даёт сохранять данные: результаты пропадут после закрытия страницы».
- `status === 'corrupt'` → recovery block: «Сохранённые данные повреждены», buttons «Скачать данные» (the raw string) and «Начать заново» (`resetCorrupt`).
- Disclaimer «Тест не является ветеринарной диагностикой.»

- [ ] **Step 1: Implement** context provider, routes, header switch, `ProfilesPage`, styles.
- [ ] **Step 2: Run** `npm run lint && npx tsc -b && npm test` — Expected: no errors, all tests pass.
- [ ] **Step 3: Verify in the browser:** `npm run build:single`, open `dist-single/index.html#/profile`, create two dogs, reload, both remain; export downloads a file; import of a `.txt` file shows the error.
- [ ] **Step 4: Commit** `git commit -m "feat(test): test home page with dog profiles, export and import"`

---

### Task 6: Running the test

**Files:**
- Create: `src/pages/profile/TestRunPage.tsx`, `src/components/cogtest/Stopwatch.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `TEST_TASKS`, `scoreTask`, `SKIP_REASON_LABELS`, `useCogStoreContext()`, `findGame` for «Похожая игра» links.
- Produces: `Stopwatch` props `{ limitSeconds?: number; onStop(seconds: number): void }` — shows whole seconds, auto-stops at the limit and calls `onStop(limit)`.

Behaviour:
- Unknown `testId` → «Тест не найден» + link to `#/profile`. Finished test → `<Navigate to={/profile/result/:id} replace />`.
- First screen of an unfinished test with no recorded tasks: preparation checklist (all equipment from `TEST_TASKS`, quiet room, slightly hungry dog, helper if possible) and the disclaimer; «Начать».
- Then the first task without a result, one per screen: number «Задание N из 8», skill label, goal, equipment, steps, stop-signals reminder («Если собака нервничает — пропустите задание»), and the recorder:
  - `trials`: three rows «Попытка 1–3» with «Верно» / «Неверно» toggles; «Дальше» enabled when all three are set.
  - `timer`: `Stopwatch`; for `towel-find` an extra «Не нашла» button records `{ seconds: 120, found: false }`.
  - `outcome` (`detour`): four buttons with the spec's outcomes.
  - «Пропустить» opens the three skip reasons.
- Each «Дальше» / skip dispatches `recordTask` with `scoreTask` result → saved immediately. After task 8: `finishTest` and navigate to the result page.
- «Назад к заданию N−1» re-opens the previous task and overwrites its result on «Дальше».

- [ ] **Step 1: Implement** `Stopwatch` and `TestRunPage`, styles in the cartoon style (big tap targets ≥ 44 px).
- [ ] **Step 2: Run** `npm run lint && npx tsc -b && npm test` — Expected: clean.
- [ ] **Step 3: Verify in the browser** (390 px wide): start a test, answer tasks 1–3, reload the page, «Продолжить тест» resumes at task 4; skip task 7 with a reason; finish; lands on `#/profile/result/<id>`; opening `#/profile/run/<id>` again redirects to the result; `#/profile/run/nope` shows «Тест не найден».
- [ ] **Step 4: Commit** `git commit -m "feat(test): guided test run with stopwatch, trials and skipping"`

---

### Task 7: Result page and dog profile page

**Files:**
- Create: `src/pages/profile/TestResultPage.tsx`, `src/pages/profile/DogProfilePage.tsx`, `src/components/cogtest/TrendChart.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `summarizeTest`, `previousTest`, `compareTests`, `recommendGames`, `games`, `GAME_TYPE_LABELS`, `TypeIcon`, `useCogStoreContext()`.
- Produces: `TrendChart` props `{ points: { date: string; value: number }[]; max: number; label: string; color?: string; compact?: boolean }` — inline SVG polyline with dots; the full variant labels dates and values, the compact one draws only the line and the last dot; renders «Пока мало данных» for fewer than two points.

Result page:
- Header: dog name, test date, total `N из 24` or «Тест неполный».
- Four skill rows: icon, label, bar of `score/max`, `score из max`, «неполный» marker; when a comparison exists, previous value and an arrow `↑ +2`, `↓ −1` or `=`.
- «Сильная сторона» / «Над чем поработать» from `summarizeTest`; three recommended games as links to `#/games/<id>` (from the first weakest skill).
- Per-task details (collapsible `<details>`): score, raw data in words, skipped reason; comparison per task.
- Note textarea saved on blur via `setNote`.
- Retest hint and practice-effect note (copy from the spec); disclaimer.
- Links «История собаки» and «К собакам».

Dog profile page (`#/profile/dog/:dogId`), layout agreed on the mockup, top to bottom:
- Header: name, breed, age from `birthMonth` (e.g. «4 года»), number of finished tests; button «Пройти тест» / «Продолжить тест»; hint «Следующий тест лучше после <date>» = latest finished `startedAt` + 30 days, hidden once that date has passed.
- «Общий балл»: `TrendChart` over finished complete tests, max 24.
- «По навыкам»: 2×2 grid of compact `TrendChart`s, one per skill in the catalog type colour, title shows the latest skill score out of 6 and the arrow vs the previous test; points = tests where that skill is complete.
- «Тесты» feed, newest first: the latest finished test expanded (date, total and arrow, four skill bars with score and arrow, link «Подробнее о тесте» → result page); older tests collapsed to «date — total — arrow» and expandable on tap (`<details>`); an unfinished test as a yellow card on top «Тест от <date> не закончен» with «Продолжить», excluded from charts.

- [ ] **Step 1: Implement** the components and pages.
- [ ] **Step 2: Run** `npm run lint && npx tsc -b && npm test` — Expected: clean.
- [ ] **Step 3: Verify in the browser:** finish two tests for the same dog with different answers; the second result shows arrows matching `compareTests`; the dog profile page shows two points on the total chart, four skill mini charts and the feed with the latest test expanded; a dog with one test shows «Пока мало данных».
- [ ] **Step 4: Commit** `git commit -m "feat(test): results with comparison, recommendations and history charts"`

---

### Task 8: End-to-end check, docs and publish

**Files:**
- Modify: `README.md` (section «Когнитивный тест»: what it is, where data is stored, export/import), `docs/superpowers/specs/2026-10-02-neurogames-design.md` (move the cognitive test from «Отложено» to a link to the new spec)

- [ ] **Step 1: Browser scenario** with a DevTools-protocol script at 390×844 against `dist-single/index.html` (file://) and `npm run preview` (http): onboarding with 2 dogs → test for dog 1 with one skip → reload mid-test and resume → result → second test → arrows → history charts → export → clear `localStorage` → import the exported file → data back. Also: put `'{bad'` into `localStorage['neurogames:v1']` and reload → recovery block. Record the JSON report; every step must pass.
- [ ] **Step 2: Run** `npm run lint && npm test && npm run build && npm run build:single` — Expected: all clean.
- [ ] **Step 3: Update docs** as listed above.
- [ ] **Step 4: Commit** `git commit -m "docs: cognitive test"`
- [ ] **Step 5: Publish only after the user approves:** `git push origin main`, wait for the Netlify deploy of that commit to be `ready`, rerun the browser scenario against `https://neurodog.netlify.app/`.
