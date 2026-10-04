# Behavior Survey (CCDR) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A 13-question behaviour survey (translated CCDR scale) per dog, stored with the existing profile data, with a result screen, history chart and comparison with the previous survey.

**Architecture:** Pure modules next to the cognitive test in `src/cogtest/` (`surveyQuestions.ts`, `surveyScoring.ts`), the store schema and reducer extended with a `surveys` array, a `startSurvey` hook method mirroring `startTest`, and three UI pieces: a survey card on the dog profile page, a run page and a result page under `src/pages/profile/`.

**Tech Stack:** React 19, TypeScript, Vite 8, react-router 8 (`HashRouter`), zod 4, Vitest 5. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-04-behavior-survey-design.md`

## Global Constraints

- Question and answer wording is copied verbatim from the spec section «Вопросы» — never paraphrased.
- Total = questions 1–10 and 13 + 2 × question 11 + 3 × question 12; range 16–80. Zones: 16–39 «Норма», 40–49 «Группа риска», 50–80 «Есть признаки когнитивной дисфункции»; advice texts verbatim from the spec section «Итог».
- Never write «у собаки деменция». The vet block and the translation caveat («Анкета — перевод шкалы CCDR. Перевод научно не проверялся; итог — ориентир, а не диагноз.») are shown on the result screen.
- The source link https://doi.org/10.1016/j.tvjl.2010.05.014 (Salvin et al., 2011) appears on the survey card and on the result screen.
- Survey is available for every dog; dogs aged 8+ (from `birthMonth`) get the «<Имя> <N лет> — рекомендуем» tag.
- One unfinished survey per dog; answers saved immediately; the survey finishes when all 13 are answered.
- Retest warning when the last finished survey of the dog started less than 60 days ago; warning only.
- Stored timestamps come from `new Date().toISOString()`. Stores and backup files without `surveys` must still load.
- Repo style: single quotes, no semicolons, 2-space indent; Russian UI copy; cartoon CSS in `src/index.css`; tap targets ≥ 44 px; works at 360 px and in WebKit (iPhone).
- Do not use `window.confirm`/`alert` (they do not show on the owner's iPhone).

## Review Focus

- A double tap on an answer auto-advances and then answers the next question by accident → answer buttons ignore taps for 400 ms after a question appears. Test in Task 4 (browser).
- Old store or old backup file without `surveys` → loads with `surveys: []`, nothing reported as corrupt. Test in Task 2.
- A stored survey with `finishedAt` but fewer than 13 answers, an unknown question id or an answer outside 1–5 → rejected by the schema (and never produced by the reducer). Test in Task 2.
- Deleting a dog that has surveys (including an unfinished one) → its surveys are removed and the store stays valid. Test in Task 2.
- `#/profile/survey/<id>` for a finished survey → redirect to its result; unknown id → «Анкета не найдена». Covered in Task 4/5 (browser).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/cogtest/surveyQuestions.ts` | The 13 questions, answer option sets, weights, ids, source constants |
| `src/cogtest/surveyScoring.ts` | `surveyTotal`, `surveyZone`, `previousSurvey`, `seniorGames`, `isSeniorAge` |
| `src/cogtest/types.ts` | `Survey`, `SurveyQuestionId`, `SurveyAnswer`; `Store.surveys` |
| `src/cogtest/storage.ts` | schema for surveys (optional on load), `emptyStore` |
| `src/cogtest/reducer.ts` | actions `startSurvey`, `answerSurvey`; `deleteDog` cascade; `unfinishedSurvey`, `latestFinishedSurvey` |
| `src/cogtest/useCogStore.ts` | `startSurvey(dogId)` |
| `src/components/cogtest/StartSurveyButton.tsx` | Start/continue with the 60-day warning |
| `src/components/cogtest/SurveyCard.tsx` | Survey block on the dog profile page (description, tag, source, history) |
| `src/components/cogtest/TrendChart.tsx` | optional `min` and `bands` props for coloured zones |
| `src/pages/profile/SurveyRunPage.tsx` | Intro + one question per screen |
| `src/pages/profile/SurveyResultPage.tsx` | Result screen |
| `src/App.tsx`, `src/index.css` | Routes and styles |

---

### Task 1: Questions and scoring

**Files:**
- Create: `src/cogtest/surveyQuestions.ts`, `src/cogtest/surveyScoring.ts`
- Modify: `src/cogtest/types.ts`
- Test: `src/cogtest/surveyScoring.test.ts`

**Interfaces:**
- Produces:
  - `type SurveyQuestionId = 'pacing' | 'staring' | 'stuck' | 'recognition' | 'walls' | 'petting' | 'food' | 'pacingChange' | 'staringChange' | 'soilingChange' | 'foodChange' | 'recognitionChange' | 'activityChange'`
  - `type SurveyAnswer = 1 | 2 | 3 | 4 | 5`
  - `interface Survey { id: string; dogId: string; version: number; startedAt: string; finishedAt?: string; answers: Partial<Record<SurveyQuestionId, SurveyAnswer>> }` (in `types.ts`)
  - `interface SurveyQuestion { id: SurveyQuestionId; text: string; hint?: string; options: readonly [string, string, string, string, string]; weight: 1 | 2 | 3 }`; `SURVEY_QUESTIONS: SurveyQuestion[]` (spec order 1–13); `SURVEY_VERSION = 1`; `CHANGE_INTRO = 'Дальше сравните с тем, что было полгода назад'` (shown before question 8); `SURVEY_SOURCE = { title: 'Salvin et al., 2011 — шкала CCDR', url: 'https://doi.org/10.1016/j.tvjl.2010.05.014' }`; `TRANSLATION_NOTE` (spec text).
  - `type SurveyZone = 'normal' | 'risk' | 'signs'`; `ZONES: Record<SurveyZone, { title: string; advice: string }>`; `VET_NOTE` (spec text).
  - `surveyTotal(answers): number | null` (null unless all 13 answered); `surveyZone(total: number): SurveyZone`; `previousSurvey(surveys: Survey[], current: Survey): Survey | undefined` (latest finished, same dog and version, `startedAt` earlier); `seniorGames(games: Game[], count = 3): Game[]` (games with `adaptations.senior`, scent-first then by `types[0]` order of `GAME_TYPES`, then difficulty, then title `'ru'`); `ageYears(birthMonth: string | undefined, now: Date): number | undefined` in `src/cogtest/format.ts` (reuse `ageText`'s month math); `isSeniorAge(years) → years >= 8`.

- [ ] **Step 1: Write failing tests** in `src/cogtest/surveyScoring.test.ts`:
  - all answers 1 → `16`; all answers 5 → `80`; all 3 → `48`.
  - weights: only `foodChange` = 5, others 1 → `16 - 2 + 10 = 24`; only `recognitionChange` = 5, others 1 → `16 - 3 + 15 = 28`.
  - 12 answers → `null`.
  - zones: 39 → normal, 40 → risk, 49 → risk, 50 → signs.
  - `SURVEY_QUESTIONS` has 13 unique ids in spec order; weights are 2 for `foodChange`, 3 for `recognitionChange`, 1 elsewhere; question 1 text equals the spec text «Как часто собака ходит взад-вперёд, кругами или бесцельно бродит?»; `activityChange` options start with «Гораздо больше».
  - `previousSurvey` ignores unfinished, other dogs, other versions and later surveys.
  - `seniorGames(games)` on the real catalog → 3 games, each with `adaptations.senior`, first is scent.
  - `ageYears('2017-01', new Date('2026-10-04'))` → 9; unknown → undefined.
- [ ] **Step 2: Run** `npx vitest run src/cogtest/surveyScoring.test.ts` — Expected: FAIL (module missing).
- [ ] **Step 3: Implement** the modules (copy question and option texts verbatim from the spec).
- [ ] **Step 4: Run** `npx vitest run src/cogtest` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(survey): questions and scoring`

---

### Task 2: Storage and reducer

**Files:**
- Modify: `src/cogtest/types.ts` (`Store.surveys: Survey[]`), `src/cogtest/storage.ts`, `src/cogtest/reducer.ts`, `src/cogtest/useCogStore.ts`
- Test: `src/cogtest/storage.test.ts`, `src/cogtest/reducer.test.ts`

**Interfaces:**
- Consumes: Task 1 types and `SURVEY_QUESTIONS`, `SURVEY_VERSION`.
- Produces:
  - schema: `surveys` optional on input, defaults to `[]`; survey `strictObject` with ids from `SURVEY_QUESTIONS`, answers 1–5 integers, `finishedAt` allowed only with all 13 answers, `dogId` must reference a dog. `emptyStore()` includes `surveys: []`. `exportStore` writes `surveys`.
  - actions: `{ type: 'startSurvey'; dogId; now; surveyId }` (no-op if the dog has an unfinished survey or does not exist), `{ type: 'answerSurvey'; surveyId; questionId; value: SurveyAnswer; now }` (ignored for a finished or unknown survey; sets `finishedAt = now` when the 13th distinct answer arrives). `deleteDog` also removes the dog's surveys.
  - helpers: `unfinishedSurvey(store, dogId)`, `latestFinishedSurvey(store, dogId)` (sorted by `startedAt`).
  - hook: `startSurvey(dogId): string` with the same pending-id guard as `startTest`.
- [ ] **Step 1: Write failing tests**: old store JSON without `surveys` loads `ok` with `surveys: []`; `parseImport` of an old backup succeeds; survey with `finishedAt` and 12 answers → invalid; unknown question id → invalid; answer 6 → invalid; reducer: start, answer, overwrite an answer, auto-finish on the 13th, ignore answers after finish, second start while unfinished is a no-op, `deleteDog` removes surveys, and `storeSchema.safeParse` succeeds after a realistic sequence.
- [ ] **Step 2: Run** `npx vitest run src/cogtest` — Expected: FAIL.
- [ ] **Step 3: Implement.** Keep `satisfies` type-checking of the schema against `Store` (use the zod input/output types as needed for the default).
- [ ] **Step 4: Run** `npx vitest run && npx tsc -b && npm run lint` — Expected: clean.
- [ ] **Step 5: Commit** `feat(survey): store surveys with schema, reducer and hook support`

---

### Task 3: Survey card on the dog profile page

**Files:**
- Create: `src/components/cogtest/StartSurveyButton.tsx`, `src/components/cogtest/SurveyCard.tsx`
- Modify: `src/components/cogtest/TrendChart.tsx` (optional `min?: number` default 0 and `bands?: { from: number; to: number; color: string }[]` drawn behind the line), `src/pages/profile/DogProfilePage.tsx` (render `SurveyCard` after the test blocks), `src/index.css`

Behaviour (spec «В профиле собаки», approved mockup):
- Card title «Анкета о поведении в старшем возрасте», description of what/why/who (Russian, short), «Займёт около 5 минут. Это не диагноз.», tag «<Имя> <ageText> — рекомендуем» when `ageYears >= 8`, `StartSurveyButton`, source link (`SURVEY_SOURCE`).
- `StartSurveyButton({ dogId })`: «Заполнить анкету» / «Продолжить анкету»; inline 60-day warning with the spec text and «Всё равно заполнить» / «Отмена»; navigates to `/profile/survey/<id>`.
- «Результаты анкеты» when there are finished surveys: `TrendChart` with `min=16`, `max=80`, bands 16–39 / 40–49 / 50–80 (green, yellow, red tokens); list newest first — date, total, zone title, arrow vs previous (↑ red = worse, ↓ green = better, `=`), each linking to `/profile/survey-result/<id>`; unfinished survey shown on top with «Продолжить»; hint «Следующую анкету лучше заполнить после <date>» (latest finished `startedAt` + 6 months) while that date is in the future.
- [ ] **Step 1: Implement** the components, chart props and styles; existing `TrendChart` callers unchanged.
- [ ] **Step 2: Run** `npm run lint && npx tsc -b && npx vitest run && npm run build:single` — Expected: clean.
- [ ] **Step 3: Verify in WebKit** (Playwright, iPhone 13 and iPhone SE emulation, file:// single build): dog with birth month 2017-01 shows the tag, dog without birth month does not; seeded store with three finished surveys shows the banded chart, list with arrows and the next-survey hint; no horizontal scroll at 360 px.
- [ ] **Step 4: Commit** `feat(survey): survey card with history on the dog profile`

---

### Task 4: Survey run page

**Files:**
- Create: `src/pages/profile/SurveyRunPage.tsx`
- Modify: `src/App.tsx` (route `/profile/survey/:surveyId`), `src/index.css`

Behaviour (spec «Прохождение», mockup screen 2):
- Unknown id → «Анкета не найдена» + link to `#/profile`; finished → `<Navigate replace>` to `/profile/survey-result/<id>`.
- Intro screen when no answers yet: what the survey is, answer about recent behaviour, «Это не диагноз», «Начать».
- Then the first unanswered question (or the one opened via «Назад»): «Анкета для <имя> · вопрос N из 13», progress bar, `CHANGE_INTRO` above question 8, text, hint, five answer buttons with the selected one marked (`aria-pressed`). Tap → dispatch `answerSurvey` (now = `new Date().toISOString()`) → next question; after the 13th → navigate (replace) to the result. Buttons ignore taps for 400 ms after a question appears. «← Назад» from question N > 1 opens N−1.
- [ ] **Step 1: Implement** the page, route and styles.
- [ ] **Step 2: Run** `npm run lint && npx tsc -b && npx vitest run && npm run build:single` — Expected: clean.
- [ ] **Step 3: Verify in WebKit** (iPhone 13 / SE): start from the profile card, answer 5 questions, reload → «Продолжить анкету» resumes at question 6; «Назад» and re-answer changes the stored value; a double tap within 400 ms answers only one question; question 8 shows the change intro; after 13 answers lands on the result route; finished survey run URL redirects; unknown id shows «Анкета не найдена».
- [ ] **Step 4: Commit** `feat(survey): guided survey run`

---

### Task 5: Survey result page

**Files:**
- Create: `src/pages/profile/SurveyResultPage.tsx`
- Modify: `src/App.tsx` (route `/profile/survey-result/:surveyId`), `src/index.css`

Behaviour (spec «Экран результата», mockup screen 3):
- Unknown → «Анкета не найдена»; unfinished → `<Navigate replace>` to the run page.
- Header with dog name and date; «N из 80»; zone bar 16–80 with marks at 40 and 50 and a marker at the total; zone title and advice; comparison with `previousSurvey` (delta with arrow ↑ worse/red, ↓ better/green, text + colour; zone change line when zones differ); vet block `VET_NOTE`; «Что поддержит голову» with `seniorGames` links to `#/games/<id>`; `<details>` «Ответы на вопросы» listing question, chosen option text and points (with weight); `TRANSLATION_NOTE` with the source link; link «Профиль собаки».
- [ ] **Step 1: Implement** the page, route and styles.
- [ ] **Step 2: Run** `npm run lint && npx tsc -b && npx vitest run && npm run build:single` — Expected: clean.
- [ ] **Step 3: Verify in WebKit**: seeded totals 39, 40, 50 show the right zone and advice; second survey shows the arrow and zone-change line; game links open; no horizontal scroll at 360 px.
- [ ] **Step 4: Commit** `feat(survey): survey result screen`

---

### Task 6: End-to-end check, docs and publish

**Files:**
- Modify: `README.md` (section «Анкета о поведении»: what it is, source, not a diagnosis, data with the backup), `docs/superpowers/specs/2026-10-02-neurogames-design.md` (move the CCDR item out of «Отложено», link the new spec)

- [ ] **Step 1: WebKit scenario** (iPhone 13 and SE, 360 px; file:// single build and `vite preview`): dog with birth month → card with tag → full survey with one «Назад» → result → second survey → arrow → profile chart and list → «Сохранить копию» includes surveys → clear storage → «Загрузить копию» restores them → an old backup without surveys imports fine → delete the dog → its surveys are gone. Record a JSON report; every step passes.
- [ ] **Step 2: Run** `npm run lint && npm test && npm run build && npm run build:single` — Expected: clean.
- [ ] **Step 3: Update docs** as listed; commit `docs: behavior survey`.
- [ ] **Step 4: Publish only through the PR flow:** push `feature/behavior-survey`, open a PR against `main`, wait for the Netlify deploy preview, re-run the WebKit scenario against it, and hand the preview link to the user. Merge only when the user says «в main».
