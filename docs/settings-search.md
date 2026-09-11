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
- [8. The query in the address](#8-the-query-in-the-address)
- [9. Limits you should know about](#9-limits-you-should-know-about)

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

The JSON is gitignored, so there is nothing to commit. `npm run dev`, `npm run build`
and `npm run make:package` each rebuild it first, so a release always ships an index
built from the source it ships with.

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

Case never matters. Step 1 lowercases, so "VAT", "Vat" and "vat" produce the same
query vector, and both highlighters stem the lowercased surface word before
comparing it to a matched term — so a lowercase query still marks a capitalised
word in a card title.

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

`features/settings/search/settings-search-index.json` is generated, not committed —
it is gitignored, and `npm run dev` and `npm run build` regenerate it first, so a
fresh clone builds one before Vite ever reads it. Vite code-splits it, so it is
fetched when a merchant first types in the search box rather than at admin boot —
about 25 kB, 7.6 kB gzipped.

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

The chosen card also lifts off the page the moment it is found, so it is obvious
which of several similar cards the result meant. It rises 10px over 350ms under a
large drop shadow, floats there for 5 seconds, then settles back over 1.2s.
`focusCard` writes `transform`, `box-shadow` and `transition` inline on the card
element and removes all three once it has landed, so nothing is left behind.
Choosing the same result again re-triggers the lift.

The lift is a `transform`, which paints the card above its static siblings without
any z-index bookkeeping, and — because it is a transform rather than a margin — it
moves nothing else on the page.

Each marked text node is replaced by a **single** `<span data-settings-search-mark-group>`
holding the marks, never by the marks themselves. This matters: settings copy is
often a bare text child of a flex row — `<Flex justify="space-between">Variation
Library<AddButton /></Flex>` — where one text node is one anonymous flex item.
Splicing two `<mark>` elements in there would create two flex items and drop the
whitespace between them, so `space-between` would fling the words to opposite ends
of the row. The wrapper keeps it one item. `use-search-highlight.test.tsx` pins
this.

A result matching purely by meaning therefore still shows *why* it matched: search
"money back" and the word `payment` is marked.

## 8. The query in the address

The active query lives in the address as `?q=`, written by the sidebar 300 ms after
the last keystroke (the search box debounces) and read back on mount:

```
#/settings/essentials?q=variant
```

So reloading mid-search restores the results rather than an empty box, and a link
to a search can be shared. Choosing a result carries the query over to the
destination page, which is why `SearchResultRow` navigates with
`{ pathname, search }` rather than a bare path. Clearing the box removes the
parameter. Every write uses `replace: true`, so typing a query does not fill the
back button with one entry per keystroke.

What is *not* in the address is which result was chosen — so a reload restores the
list, but the marks in the right-hand pane come back only when a result is clicked
again. Say the word if that should persist too.

## 9. Limits you should know about

Be honest about these rather than discovering them later.

- **Meaning is bounded by the lexicon.** Synonyms nobody wrote into
  `concept-lexicon.mjs` do not match. This is a maintained artifact, not a trained
  model — it generalises exactly as far as you have extended it.
- **The index can drift within a session.** `npm run dev`, `npm run build` and
  `make:package` each regenerate it, but nothing watches the source afterwards.
  Change a label mid-session without rerunning the crawler and search returns a
  result that highlights nothing, because the terms it indexed are no longer on
  screen.
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
