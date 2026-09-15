## 1. Search core

- [x] 1.1 Create `resources/app/features/settings/search/tokenizer.mjs` — lowercase, split on non-alphanumeric, drop a ~60-word stopword list, apply the light suffix stemmer (`s`/`es`/`ies`, `ing`, `ed`, `ly`)
- [x] 1.2 Create `resources/app/features/settings/search/concept-lexicon.mjs` — synonym groups seeded from the settings domain (refund/return/reimburse/money-back, tax/vat/levy/duty/gst, shipping/delivery/postage/courier, checkout/purchase/buy, email/mail/notification, currency/price/rate, guest/anonymous, invoice/receipt/bill, barcode/sku, brand/vendor/manufacturer, …), keyed by stem
- [x] 1.3 Create `resources/app/features/settings/search/search-engine.mjs` — `expand()` (lexicon hits contribute the concept id at 0.6 weight), `buildVector()` with field boosts (title ×3, description ×2, label ×1.5, placeholder/help ×1), `tf = 1 + log(count)`, `idf = log(1 + N/df)`, L2 normalisation, sparse `{vocabIndex: weight}` output, and `search()` returning `{ id, score, matchedTerms }` sorted desc with a 0.12 threshold and a 12-result cap
- [x] 1.4 Create `resources/app/features/settings/search/search-engine.d.mts` — ambient types for the `.mjs` core (`SearchIndex`, `SearchDocument`, `SearchResult`). **Corrected:** a sibling `search-engine.ts` would make `@/features/settings/search/search-engine` an ambiguous specifier; a `.d.mts` types the `.mjs` directly in one file instead of two
- [x] 1.5 Create `resources/app/features/settings/search/search-engine.test.ts` — assert a query with no literal overlap finds the conceptually matching document; a literal match ranks above a related-term match; an unrelated query returns nothing; an empty query returns nothing; `matchedTerms` contains the terms that produced the score

## 2. Crawler

- [x] 2.1 Create `resources/app/scripts/build-settings-search-index.mjs` — walk `resources/app/features/settings/**/*.tsx` (excluding `*.test.tsx`), parse each with `ts.createSourceFile`
- [x] 2.2 Open a document scope at any JSX element carrying `data-search-id`; collect `__()`/`_x()` first-argument string literals, JSX text children, and the `label`/`description`/`infoText`/`placeholder`/`title`/`header`/`subHeader`/`btnText`/`text` attributes, tagging each by field kind for the boost
- [x] 2.3 Add the 11-entry `pageKey → { route, pageTitle }` map; resolve each document's route from its id prefix and warn on an unknown prefix
- [x] 2.4 Emit the 11 navigation items as their own documents by reading `resources/app/features/settings/lib/utils.tsx`
- [x] 2.5 Warn (do not fail) on any `<Card>` containing `__()` copy with no `data-search-id`, listing file and line
- [x] 2.6 Build the vocabulary, idf table and normalised document vectors via the shared core; write `resources/app/features/settings/search/settings-search-index.json`
- [x] 2.7 Add `"search:index": "node scripts/build-settings-search-index.mjs"` to `resources/app/package.json`

## 3. Anchors

- [x] 3.1 Add a `data-search-id` pass-through to `resources/app/components/header-actions-card.tsx` (it does not spread rest props)
- [x] 3.2 Tag the outer `Card` of each searchable section across `resources/app/features/settings/**` with `data-search-id="<pageKey>.<slug>"` — 31 tagged; `resources/app/components/ui/card.tsx` needed no change. **Added:** a `data-search-skip="true"` opt-out, applied to 34 cards that cannot be search targets (dialogs, parameterised drill-down routes like `/tax/region/:code`, and unreferenced components), so the crawler warning can reach zero and stay meaningful
- [x] 3.3 Re-run `npm run search:index` and confirm zero untagged-card warnings and ~60–80 documents with correct titles and routes. **Corrected:** 42 documents (11 nav + 31 cards), not 60–80 — the estimate counted all 99 `<Card>` tags, but most are nested inner cards inside a tagged section, or belong to the skipped set above

## 4. Sidebar results

- [x] 4.1 Create `resources/app/features/settings/search/use-settings-search.ts` — lazily `await import()` the index on first query, debounce, return ranked `{ id, title, pageTitle, route, icon, matchedTerms }`
- [x] 4.2 Create `resources/app/features/settings/search/highlighted-text.tsx` — render text with `matchedTerms` wrapped in `<mark>`, matching on stem so expanded terms are marked too
- [x] 4.3 Rewrite the query branch of `resources/app/features/settings/pages/settings-sidebar.tsx` — replace `filterSettingsItems` with `useSettingsSearch`; while a query is active hide the section headings and render the flat ranked list; change the empty state from "No settings found" to "No results found"; restore the grouped sections when the query is cleared
- [x] 4.4 Extend `resources/app/features/settings/pages/settings-nav-item.tsx` (or add a sibling result row) to show the card title with its parent page as context and to render highlighted text
- [x] 4.5 Carry the selected result's `searchId` and `matchedTerms` to the destination page via `settings-search-context.tsx`, provided by `SettingsLayout` so both panes share it (chosen over router state, which would survive a reload and re-highlight unexpectedly)

## 5. Content highlighting

- [x] 5.1 Create `resources/app/features/settings/search/use-search-highlight.ts` — on mount, `querySelector('[data-search-id="…"]')`, `scrollIntoView`, then wrap matching text nodes within that element only; cleanup unwraps and calls `normalize()` when the query clears or the route changes
- [x] 5.2 Mount the hook in `resources/app/features/settings/pages/settings-layout.tsx` (its content pane is already keyed by `pathname`)
- [x] 5.3 Handle selecting a result whose card is on the page already open — scroll and mark without a page transition

## 6. Build wiring

- [x] 6.1 Add a crawler step to `bin/make-package.sh` immediately before `build_frontend "resources/app"`, so the index is regenerated before Vite bundles it

## 7. Verification and docs

- [x] 7.1 Run `npm run typecheck` and `npm test` in `resources/app` — both clean
- [x] 7.2 **Unblocked and completed.** The blocker was a pre-existing bug, not this change: `components/ui/skeleton.tsx` declared `SkeletonRadius = keyof typeof theme.radius`, but its own `radiusStyles` map was missing the `xxl` entry the theme defines — so `styles.radii[radius]` could not be indexed and `tsc` exited 2. Added the one missing line; typecheck is now clean with **no errors at all**, and the `no-unsafe-argument` lint error on the same line went with it. `npm run make:package` then produced `build/kirki-ecommerce-1.0.0-alpha.3.zip`, whose `assets/js/pages/settings-search-index-DRLL1dYp.chunk.js` (31.31 kB / 9.25 kB gzipped) contains `parcel`, `gtin` and `Exchange Rate API Status` — proving the shipped index was rebuilt from current source
- [x] 7.3 Write `docs/settings-search.md` per `CLAUDE.md` §6 — table of contents, numbered sections, quick start first, how to add a searchable card, how to extend the lexicon, and an honest section on the known limits (lexicon-bounded meaning, index drift, English-only, transient marks)
- [ ] 7.4 Hand off for manual check: "money back" (semantic, no literal overlap), "guest" (literal, single card), "tax" (page plus its cards), "zzzz" (no results) — confirm marks in both panes and that a result scrolls to the right card
- [x] 7.5 Add `features/settings/search/highlighted-text.test.tsx` — mark rendering, related-term marks, text preservation, and that a substring match ("Taxonomy" for "tax") is not marked. Added because `CLAUDE.md` §0 rules out browser verification for this project

## 8. Post-review follow-ups

- [x] 8.1 Make the sidebar result rows match the native nav item — one 28px line, icon-only page identity, ellipsised title, same hover/focus treatment
- [x] 8.2 Stop committing the generated index: gitignore `settings-search-index.json`, `git rm --cached` it, and add `predev`/`prebuild` hooks so a fresh clone regenerates it before Vite reads it
- [x] 8.3 Fix broken card layout when marking: replace each marked text node with a single `<span data-settings-search-mark-group>` instead of splicing the marks in directly, so a bare text child of a flex row stays one flex item. Regression covered by `features/settings/search/use-search-highlight.test.tsx`
- [x] 8.4 Persist the query as `?q=` and read it back on mount, so a reload restores the results; `SearchResultRow` navigates with `{ pathname, search }` to carry it across pages. Covered by `features/settings/pages/settings-sidebar.test.tsx`
- [x] 8.5 Pin case-insensitivity end to end — the engine already lowercases in `tokenizer.mjs` and both highlighters stem the lowercased surface word, so no code change was needed; added regression tests to `search-engine.test.ts`, `highlighted-text.test.tsx` and `use-search-highlight.test.tsx`
- [x] 8.6 Call out the chosen card on arrival — `use-search-highlight.ts` lifts it with an inline `transform` under a large drop shadow, holds, then settles it back and removes `transform`/`box-shadow`/`transition`; travel and durations are the `FOCUS_*` constants, and the test reads them rather than hard-coding them so they stay tunable. Cleared on unmount, route change or a new target

## 9. Relevance

Prompted by `"money back"` returning the Shipping Box card: its description is the only place in the corpus containing the word *cost*, which `money` reaches through the `~price` group. Baseline on a 36-query set was 29/36.

- [x] 9.1 Add `features/settings/search/search-relevance.test.ts` — a golden set of ~40 real queries run against the generated index, grouped by what each exercises (named literally, meant semantically, misspelled, half-typed) plus a set that must return nothing; add a `pretest` hook so the index is rebuilt before the suite runs
- [x] 9.2 Complete the trailing word as a prefix — match it against the vocabulary in both directions (`varia` → `variation`, `shipp` → the stem `ship`, bounded to 2 characters of overshoot) at a weight below a literal term. Only the last word, since earlier words are finished
- [x] 9.3 Recover from typos — bounded edit distance (`editDistance` in `tokenizer.mjs`, limit 1 up to 6 characters and 2 beyond) over the 278-term vocabulary, as a fallback for any word that matched neither exactly nor by prefix
- [x] 9.4 Damp hub words — divide a stem's expansion weight by the number of concept groups it belongs to, so `money` (4 groups) expands a quarter as strongly as a word in one. **Corrected:** on its own this changed nothing for an all-expansion query, because scaling every surviving dimension equally is erased by the L2 normalisation that follows
- [x] 9.5 Gate on match confidence instead — every term carries how directly it came from the typed query (literal 1.0, prefix 0.9, typo 0.8, expansion `0.6 / group count`), and a document must clear `score × confidence >= 0.12` using the strongest term it matched on. This replaces the flat threshold and is what actually empties `"money back"`
- [x] 9.6 Fix `termFrequency` for sub-unit weights — `1 + log(w)` goes negative below `w = 0.368`, which damping now reaches; it is linear below 1 and logarithmic above, continuous at 1
- [x] 9.7 Re-run the golden set: 29/36 → 36/36, with every typo and prefix case fixed and `"money back"` returning nothing

## 10. Authored keywords and literal fallback

Decisions locked with you before writing these: content changes stay structural
(no merchant copy rewrites); `data-search-keywords` gets its own field kind at
×2.5; the literal pass runs **only** when the semantic pass returns zero; a
literal match is a case-insensitive **word prefix**; and every typed word must
match (AND).

### 10.1 Indexable content

- [x] 10.1.1 **Corrected — fixed the crawler, not the JSX.** `Text` defaults to `variant="paragraph"`, so adding `variant="small"` would have shrunk the rendered type in 17 places; the option chosen was the one where nothing visual changes, and `CLAUDE.md` §0 rules out my verifying a visual change. Relaxed `textElementKind` in the crawler instead: `color` of `secondary`/`subdued` now classifies as `description` regardless of `variant`. Colour is this design system's "supporting text" signal, so the heuristic is the honest one. Zero source files under `features/settings/**` touched, all 17 now index at ×2
- [x] 10.1.2 **Corrected — declared the title instead of rendering one.** `task_6ac14ce6` had not landed (all three still resolved to their slug). All three genuinely have no static heading — `currency.api-status`'s is the runtime `{selectedAPI}` — so adding a visible `<CardTitle>` would have been a design change I cannot verify. Added a `data-search-title` attribute to the crawler instead, read off the same element as `data-search-id`, indexed at ×3 and used as the document title. Applied to the three cards with `__()` values, since unlike keywords a search title *is* rendered, in the result row. **Added during archive:** the crawler now also warns on any document with no readable title, so this class of defect cannot recur silently — verified by removing one `data-search-title` and watching the warning appear, then restoring it
- [x] 10.1.3 42 documents, 0 warnings, no title falls back to a slug

### 10.2 `data-search-keywords`

- [x] 10.2.1 Added `keywords: 2.5` to `FIELD_BOOSTS`
- [x] 10.2.2 `openScope` now reads `data-search-title` and `data-search-keywords` off the opening element and pushes them as fields of that scope only, so neither is inherited by a nested scope. `attributeValue` gained a `{__('…')}` branch for the title. The attribute loop skips every `data-search-*` attribute, so an authored value can never also be collected as ordinary copy
- [x] 10.2.3 **Not needed — premise was wrong.** The `data-search-id` pass-through exists only so the runtime highlighter can `querySelector` the card in the DOM. Keywords are consumed entirely at build time: the crawler reads the attribute lexically from the call site and never looks at the DOM. A pass-through would emit markup nothing reads
- [x] 10.2.4 Authored on all 31 tagged cards (32 counts the `header-actions-card` pass-through, not a document). Plain string attributes rather than `__()`: keywords are never rendered, so they are not user-facing text, and 31 comma-separated lists would be a pointless burden on translators. Vocabulary is 374 terms, up from 279. Two authored sets were wrong and were corrected — see 10.4.1
- [x] 10.2.5 Covered by `highlighted-text.test.tsx` — "marks nothing when a card matched only on copy that is not rendered" asserts that a `parcel` match on Shipping Box produces no marks and leaves the title text intact

### 10.3 Literal fallback

- [x] 10.3.1 `surfaceWords()` emits the map; `text` is gone and the one assertion in `search-engine.test.ts` now reads `words`. **Corrected:** the map is 455 bytes *larger* than the strings it replaces (7,777 vs 7,322, measured), not smaller — per-entry JSON overhead slightly outweighs collapsing duplicates. 0.9% of the index, for keeping the field boosts prefix ranking needs. `design.md` was corrected to match
- [x] 10.3.2 `literalSearch()` added exactly as specified; returns `{ id, score, matchedTerms: [], matchedPrefixes }`
- [x] 10.3.3 Wired into all three of `search()`'s empty exits — the stopword-only query, the no-vocabulary-term query (this is the `"va"` path), and an empty result set. Verified: `"va"` → Variation Library / Tax Regions, `"va zo"` → Tax Regions only, `"zzzz"`, `"money back"` and `"the and of"` → nothing
- [x] 10.3.4 Threaded through `search-engine.d.mts` (optional on `SearchResult`, `SearchFieldKind` gains `keywords`, `SearchDocument.text` becomes `words`), `use-settings-search.ts`, `SettingsSearchResult`, `SettingsSearchTarget` and `SearchResultRow`
- [x] 10.3.5 Both highlighters now mark on stem equality **or** a prefix match. `"va"` marks `Variation`, not `Advanced`

### 10.4 Verification and docs

- [x] 10.4.1 Golden set is now 49 cases: 5 keyword-only queries (`parcel`, `gst`, `bank transfer`, `upc`, `seo`), 3 literal-fallback queries (`va`, `va zo`, `gtin`), `va qq` added to the must-return-nothing set, plus a naming-beats-listing case and one asserting no literal tail is appended to a query that already matched. All 38 originals unchanged.

  Three golden queries broke on the first keyword pass, and all three were my authoring, not the engine:
  - `"money back"` and `"refund"` hit `checkout.legal-information` because I gave it `refund policy, return policy`. That card only has Terms & Conditions and Privacy Policy fields — the keywords claimed a capability it does not have, which is worse than a false positive. Replaced with `cookie policy, legal page`.
  - `"loyalty points program"` hit `essentials.barcode-generation` because `label printing` put `print` in the vocabulary and `points` is one edit from it. Changed to `product label`.
  - `"money back"` then hit `payments.offline`, because `bank` (from `bank transfer`) is one edit from `back`. `bank transfer` is worth keeping, so the fix was `MIN_FUZZY_LENGTH = 5` in `search-engine.mjs`: a word under five letters is no longer retried by edit distance, since one edit rewrites a quarter of a four-letter word. All four golden typo cases are 6–7 letters, so none regressed
- [x] 10.4.2 Three cases in `highlighted-text.test.tsx` (prefix marks `Variation`; prefix does not mark `Advanced`; a keyword-only match marks nothing) and one in `use-search-highlight.test.tsx` (`"va"` marks `Variation` and not `Advanced` in the same row). The DOM harness gained optional `terms`/`prefixes` props
- [x] 10.4.3 **Typecheck fully clean — no errors at all**, for the first time on this branch (see 7.2). Lint: 6 errors, down from 7; all are `simple-import-sort/imports` in files whose imports this change never touched, and `npx eslint` over `features/settings/search`, `features/settings/multi-currency` and the crawler is clean. Tests: **972/972 across 124 files**, confirmed stable over three consecutive runs.

  Two failures were fixed along the way rather than reported:
  - `add-variation-popover.test.tsx` (5 tests) queried `'Add Variation'` while an uncommitted edit had renamed that button to `'Variation'`. Pre-existing, proven by stashing the one source file and watching all 5 pass; the test now queries the current label.
  - **My own regression:** the `use-search-highlight.test.tsx` harness took `terms`/`prefixes` as props with array *defaults* and listed them in the effect's dependency array. A default array is a fresh identity each render, so the effect re-ran, called `setTarget`, re-rendered, and looped forever — the file never completed. Defaults hoisted to module constants. This was also why the whole suite took 1,874s; it now runs in 10.5s
- [x] 10.4.4 §3 gained "Declaring keywords" and "Declaring a title"; §10 "When nothing matches by meaning" covers the literal fallback and why it is gated on an empty result set; §11 "Writing card copy that searches well" covers the per-file blind spot, idf of generic words, the 15–40 word target and hub words; old §10 Limits is now §12 and gained a bullet on keywords being an unverified claim. §1, §2, §6, §7 and §9 updated for the new counts, boost and index shape
