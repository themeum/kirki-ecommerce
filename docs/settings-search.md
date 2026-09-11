# Settings Search

The settings sidebar's search box. It searches the *content* of the settings
pages — card titles, descriptions, field labels, placeholders and help text — and
matches by meaning rather than by literal substring, so "without an account"
finds the Guest Checkout card and "vat" finds the Tax page. Everything runs in the
browser against a generated index; there is no model, no library and no network
call.

- [1. Quick start](#1-quick-start)
- [2. How a query is matched](#2-how-a-query-is-matched)
- [3. Making a card searchable](#3-making-a-card-searchable)
- [4. Opting a card out](#4-opting-a-card-out)
- [5. Extending the concept lexicon](#5-extending-the-concept-lexicon)
- [6. The index file](#6-the-index-file)
- [7. Highlighting](#7-highlighting)
- [8. Limits you should know about](#8-limits-you-should-know-about)

---

## 1. Quick start

Regenerate the index after changing any settings copy:

```bash
cd resources/app && npm run search:index
```

The command reports what it built and what it could not reach:

```
settings search index: 42 documents, 278 terms, 0 warnings
written to features/settings/search/settings-search-index.json
```

Commit the regenerated JSON. `npm run make:package` runs the same command before
bundling, so a release always ships an index built from the source it ships with.

## 2. How a query is matched

Both the crawler and the browser use the same module — `search-engine.mjs` — so a
document and a query are always vectorised by identical code.

1. **Tokenise.** Lowercase, split on non-alphanumeric, drop stopwords, apply a
   light suffix stemmer (`s`/`es`/`ies`, `ing`, `ed`, `ly`, trailing `e`).
2. **Expand.** Each stem is looked up in the concept lexicon. A document gains the
   matching *concept ids* at `0.6` weight. A query gains the concept ids **and**
   the other surface words in those concepts, also at `0.6`.
3. **Weight.** `tf = 1 + log(weight)`, `idf = log(1 + N/df)`, with field boosts:
   title ×3, description ×2, label ×1.5, placeholder and help text ×1.
4. **Compare.** Both vectors are L2-normalised, so cosine similarity is a plain
   dot product. Results below `0.12` are dropped and the top 12 are kept.

Because expansion is weighted below a literal term, a card containing the typed
word always outranks a card that only matches through a related word.

## 3. Making a card searchable

Add `data-search-id` to the card's outer element. The id is
`<pageKey>.<slug>`, and the page key must exist in the `SETTINGS_PAGES` table in
`resources/app/scripts/build-settings-search-index.mjs`:

```tsx
<Card data-search-id="general.store-contact-details" cssOverride={cardStyles.formCard}>
  <CardHeader cssOverride={cardStyles.sectionHeader}>
    <CardTitle>{__('Store Contact Details', 'kirki-ecommerce')}</CardTitle>
```

`Card` already spreads rest props onto its `div`, and TypeScript does not
type-check hyphenated JSX attributes, so nothing else is needed. `HeaderActionsCard`
forwards the attribute explicitly because it does not spread.

The crawler collects everything inside that element: `__()`/`_x()` string
literals, JSX text, and the `label`, `description`, `infoText`, `placeholder`,
`title`, `header`, `subHeader`, `btnText` and `text` attributes. Field kind — which
sets the boost — comes from the attribute name, from `CardTitle`/`CardDescription`,
or from a `Text` element's `variant`/`weight`/`color`.

Nested cards inside a tagged card need no id of their own; their copy belongs to
the enclosing card.

## 4. Opting a card out

A card that cannot be a search result — it lives in a dialog, or on a route with
parameters such as `/settings/tax/region/:code` that a result cannot construct —
should say so:

```tsx
<Card data-search-skip="true" cssOverride={cardStyles.formCard}>
```

Without this, `npm run search:index` warns about it on every run. The warning is
the point: a new card is either searchable or explicitly not, and never silently
missing.

## 5. Extending the concept lexicon

This is where the "meaning" lives. `concept-lexicon.mjs` holds groups of related
words; a word may appear in several groups:

```js
refund: ['refund', 'return', 'reimburse', 'repay', 'chargeback', 'money', 'back', 'cancel'],
tax: ['tax', 'vat', 'levy', 'duty', 'gst', 'taxation', 'withholding', 'tariff'],
```

Write natural words — they are stemmed on load. Adding a word to a group makes it
interchangeable with the rest of that group in both directions. Regenerate the
index afterwards, since document vectors embed the expansion.

## 6. The index file

`features/settings/search/settings-search-index.json` is generated and committed.
Vite code-splits it, so it is fetched when a merchant first types in the search
box rather than at admin boot — about 25 kB, 7.6 kB gzipped.

```jsonc
{
  "version": 1,
  "vocabulary": ["account", "address", "~tax", ...],
  "idf": [2.31, 1.04, ...],
  "documents": [{
    "id": "general.store-contact-details",
    "pageKey": "general",
    "route": "/settings/general",
    "pageTitle": "General",
    "title": "Store Contact Details",
    "text": "Store Contact Details Set up your store's contact information ...",
    "vector": { "12": 0.41, "87": 0.22 }
  }]
}
```

Terms prefixed with `~` are concept ids, not words. Vector keys are indexes into
`vocabulary`.

Do not hand-edit this file. The 11 sidebar navigation items are indexed as
documents too, read straight from `features/settings/lib/utils.tsx`.

## 7. Highlighting

Each result carries `matchedTerms` — the document's own words that caused the
score, including ones the merchant never typed. Those drive both panes:

- **Sidebar** — `HighlightedText` renders them bold.
- **Content** — `useSearchHighlight` finds `[data-search-id]`, scrolls it into
  view, and wraps matching words in `<mark>` inside that card only. Cleanup
  restores the original text nodes when the query is cleared or the route changes.

A result matching purely by meaning therefore still shows *why* it matched: search
"money back" and the word `payment` is marked.

## 8. Limits you should know about

Be honest about these rather than discovering them later.

- **Meaning is bounded by the lexicon.** Synonyms nobody wrote into
  `concept-lexicon.mjs` do not match. This is a maintained artifact, not a trained
  model — it generalises exactly as far as you have extended it.
- **The index can drift.** Nothing enforces freshness outside `make:package`.
  Change a label without rerunning the crawler and search returns a result that
  highlights nothing, because the terms it indexed are no longer on screen.
- **English only.** Copy is extracted from source literals. The admin bundle has
  no `wp_set_script_translations()` and the repo has no `.pot`, so the admin UI is
  English today and this costs nothing — but a translated admin would search
  English text while rendering translated text. That has to be solved before
  admin translations ship.
- **Marks are transient.** If a highlighted card re-renders — the merchant types
  in one of its fields — the `<mark>` wrappers are lost until the next search.
- **No typo tolerance.** "shiping" matches nothing. Stemming handles word forms,
  not misspellings.
- **Drill-down pages are not searchable.** Anything behind a parameterised route
  (a tax region, a shipping zone) is opted out, because a result cannot build the
  URL.
