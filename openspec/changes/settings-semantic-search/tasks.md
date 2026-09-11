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
- [ ] 7.2 Run `npm run make:package` and confirm the zip's bundle carries the freshly generated index. **BLOCKED — pre-existing, not caused by this change:** `npm run build` exits 2 because `components/ui/skeleton.tsx:38` indexes a radius map lacking an `xxl` key, so `make:package` cannot complete on this branch. Verified as far as possible instead: `bash -n bin/make-package.sh` passes, `npm run --if-present search:index` runs in `resources/app` and no-ops in `resources/site`, and `npx vite build` emits the index as its own chunk (`js/pages/settings-search-index-*.chunk.js`, 25.17 kB / 7.59 kB gzipped)
- [x] 7.3 Write `docs/settings-search.md` per `CLAUDE.md` §6 — table of contents, numbered sections, quick start first, how to add a searchable card, how to extend the lexicon, and an honest section on the known limits (lexicon-bounded meaning, index drift, English-only, transient marks)
- [ ] 7.4 Hand off for manual check: "money back" (semantic, no literal overlap), "guest" (literal, single card), "tax" (page plus its cards), "zzzz" (no results) — confirm marks in both panes and that a result scrolls to the right card
- [x] 7.5 Add `features/settings/search/highlighted-text.test.tsx` — mark rendering, related-term marks, text preservation, and that a substring match ("Taxonomy" for "tax") is not marked. Added because `CLAUDE.md` §0 rules out browser verification for this project

## 8. Post-review follow-ups

- [x] 8.1 Make the sidebar result rows match the native nav item — one 28px line, icon-only page identity, ellipsised title, same hover/focus treatment
- [x] 8.2 Stop committing the generated index: gitignore `settings-search-index.json`, `git rm --cached` it, and add `predev`/`prebuild` hooks so a fresh clone regenerates it before Vite reads it
- [x] 8.3 Fix broken card layout when marking: replace each marked text node with a single `<span data-settings-search-mark-group>` instead of splicing the marks in directly, so a bare text child of a flex row stays one flex item. Regression covered by `features/settings/search/use-search-highlight.test.tsx`
- [x] 8.4 Persist the query as `?q=` and read it back on mount, so a reload restores the results; `SearchResultRow` navigates with `{ pathname, search }` to carry it across pages. Covered by `features/settings/pages/settings-sidebar.test.tsx`
- [x] 8.5 Pin case-insensitivity end to end — the engine already lowercases in `tokenizer.mjs` and both highlighters stem the lowercased surface word, so no code change was needed; added regression tests to `search-engine.test.ts`, `highlighted-text.test.tsx` and `use-search-highlight.test.tsx`
- [x] 8.6 Call out the chosen card on arrival — `use-search-highlight.ts` lifts it with an inline `transform` under a large drop shadow (350ms rise), holds 5s, then settles it back over 1.2s and removes `transform`/`box-shadow`/`transition`; cleared on unmount, route change or a new target
