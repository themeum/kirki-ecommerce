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
- [9. Keeping relevance honest](#9-keeping-relevance-honest)
- [10. When nothing matches by meaning](#10-when-nothing-matches-by-meaning)
- [11. Writing card copy that searches well](#11-writing-card-copy-that-searches-well)
- [12. Limits you should know about](#12-limits-you-should-know-about)

---

## 1. Quick start

Regenerate the index after changing any settings copy:

```bash
cd resources/app && npm run search:index
```

The command reports what it built and what it could not reach:

```
settings search index: 42 documents, 391 terms, 0 warnings
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
3. **Recover.** A typed word that is in no document is not given up on. The
   **last** word is retried as a prefix, in both directions — `varia` reaches
   `variation`, and `shipp` reaches the stem `ship` — because the merchant is
   usually still typing it. Any word, last or not, that still matches nothing
   falls back to an edit-distance search over the vocabulary, so `curency` finds
   `currency`. The vocabulary is 391 terms, so scanning all of it per keystroke
   costs nothing. A word shorter than five letters is never retried by edit
   distance — one edit rewrites a quarter of a four-letter word, which is how
   "back" used to reach "bank".
4. **Weight.** `tf = weight` below 1 and `1 + log(weight)` above it,
   `idf = log(1 + N/df)`, with field boosts: title ×3, declared keywords ×2.5,
   description ×2, label ×1.5, placeholder and help text ×1.
5. **Compare.** Both vectors are L2-normalised, so cosine similarity is a plain
   dot product. The top 12 above the threshold are kept.
6. **Require full coverage.** If any surviving card matched *every* word the
   merchant typed, the cards that matched only some of them are dropped.

Expansion is weighted below a literal term, so a card containing the typed word
outranks a card that matches only through a related word.

Step 6 is what keeps a multi-word query honest. Cosine similarity scores a card
that matched one word out of two, and a partial match can easily clear the
threshold on the strength of a single rare word. "Digital wallet" used to return
Payment Gateways *and* Tax Profiles, because Tax Profiles says "food, books or
digital goods" — one accidental word, none of the intent. Coverage counts, per
typed word, whether the card carries that word literally (or the prefix/typo
term it was recovered to in step 3); concept siblings deliberately do not count,
since they are the loose half of the match.

The rule only fires when some card covers the **whole** query — otherwise every
candidate is partial and there is nothing to prefer. That is what leaves "money
back" (no card contains either word) and "without an account" free to be
answered entirely by concepts, while "cash on delivery" now reaches Manual
Payment Methods instead of three shipping cards, because it is the only card
carrying both *cash* and *delivery*.

But a *rank* is not enough on its own: when nothing in the query appears in the
corpus at all, every candidate is a synonym and the discount has nothing to rank
them against. So each term also carries a **confidence** — how directly it came
from what the merchant typed:

| how the term was reached | confidence |
|---|---|
| typed literally | 1.0 |
| completed from a prefix | 0.9 |
| recovered from a typo | 0.8 |
| a concept the word belongs to, and that concept's other words | `0.6 / concepts the word belongs to` |

A document must clear `score × confidence ≥ 0.12`, where the confidence is that
of the strongest term it actually matched on. A literal hit therefore keeps the
old 0.12 bar, while a match reached only through a word in four concept groups
has to score six times higher to survive.

Dividing by the number of concepts a word belongs to is what stops **hub words**
dominating. `money` sits in `~currency`, `~price`, `~payment` and `~refund`; it
says four times less about intent than a word in one group, and now expands four
times more weakly. Without this, "money back" returned Shipping Box, because that
card is the only one in the corpus containing the rare word *cost*.

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

### Declaring keywords

Two more attributes go on the same element, and both are read only by the
crawler:

```tsx
<Card
  data-search-id="shipping.boxes"
  data-search-keywords="parcel, package, dimensions, carton, packaging"
>
```

`data-search-keywords` is a comma-separated list of words that should find this
card even though they appear nowhere in its visible copy. They are indexed at
**×2.5** — above a word that merely occurs in a description, below the card's own
name, so a card actually *named* for a thing still outranks a card that only
lists it.

They are a plain string, not `__()`, because nothing renders them. They are not
user-facing text, and 31 comma-separated lists would be a burden on translators
for no visible result.

Keep them honest. A keyword is a claim that this card answers to that word — if
the Legal Information card lists `refund policy`, then searching "refund" lands a
merchant on a card that has no refund setting on it, which is worse than finding
nothing. Prefer words a merchant would type that the copy genuinely does not
contain: `parcel` and `postage` for shipping boxes, `vat` and `gst` for tax,
`stripe` and `paypal` for payment gateways.

### Declaring a title

`data-search-title` names a card whose heading the crawler cannot see — because
it has no heading at all, or because its heading is a runtime value such as
`<Text weight="semibold">{selectedAPI}</Text>`:

```tsx
<Card
  data-search-id="currency.api-status"
  data-search-title={__('Exchange Rate API Status', 'kirki-ecommerce')}
>
```

Without it the result row falls back to the slug, and a merchant sees
`api-status`. Unlike keywords this **is** rendered — it is the text of the result
row — so it takes `__()`.

Use it rather than adding a visible `<CardTitle>` when the card is not supposed
to have one. It changes what search shows without changing what the page looks
like.

`npm run search:index` warns about any document with no readable title, so a card
cannot quietly end up showing merchants an internal id.

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

Group membership is not free. A word's expansion strength is divided by the
number of groups it appears in, so adding a common word to a fifth group weakens
it everywhere, including in the four groups where it already worked. Prefer a new
narrow group over widening an existing one, and add a case to the golden set in
section 9 when you do.

## 6. The index file

`features/settings/search/settings-search-index.json` is generated, not committed —
it is gitignored, and `npm run dev` and `npm run build` regenerate it first, so a
fresh clone builds one before Vite ever reads it. Vite code-splits it, so it is
fetched when a merchant first types in the search box rather than at admin boot —
about 53 kB, 10.3 kB gzipped.

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
    "words": { "store": 3, "contact": 3, "details": 3, "information": 2, ... },
    "vector": { "12": 0.41, "87": 0.22 }
  }]
}
```

Terms prefixed with `~` are concept ids, not words. Vector keys are indexes into
`vocabulary`.

`words` maps each *surface* word — unstemmed, lowercased, stopwords dropped — to
the highest field boost it appeared under in that card. Only the literal fallback
in section 10 reads it; the vector carries everything the meaning-based search
needs. About 25 kB, 7.6 kB gzipped before keywords; 53 kB and 10.3 kB after.

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
which of several similar cards the result meant. It rises under a large drop
shadow, holds, then settles back. `focusCard` writes `transform`, `box-shadow`
and `transition` inline on the card element and removes all three once it has
landed, so nothing is left behind; the travel and the three durations are the
`FOCUS_*` constants at the top of `use-search-highlight.ts`. Choosing the same
result again re-triggers the lift.

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
"vat" and the word `tax` is marked.

A result from the literal fallback carries `matchedPrefixes` instead of
`matchedTerms`, and both highlighters also mark any word *beginning* with one of
them — so typing "va" bolds **Va**riation but leaves Ad**va**nced alone.

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

## 9. Keeping relevance honest

Every knob in section 2 moves *all* scores. Retuning one by hand and eyeballing a
couple of queries is how you fix one search and silently break four, so the
tuning is pinned by a golden set: `search-relevance.test.ts` runs ~50 real
merchant queries against the **generated index itself**, not a fixture, and
asserts the right card is in the top 3.

```ts
['without an account', ['checkout.guest-checkout']],
['curency',            ['currency.preferences', 'nav.currency', 'currency.format']],
['varia',              ['essentials.variation-library']],
```

It is grouped by what each query exercises — named literally, meant
semantically, misspelled, half-typed, found only through a declared keyword,
found only by the literal fallback — plus a set that must return **nothing**:

```ts
const absent = ['money back', 'refund', 'loyalty points program', 'wishlist', ...];
```

Those negatives matter as much as the positives. `money back` is in there because
this store has no refund settings, so the only honest answer is an empty list —
and the confidence rule in section 2 exists to make that answer come out.

`npm test` regenerates the index first (a `pretest` hook), so the golden set
always runs against the index the current source produces. Change a boost, a
lexicon group or a threshold, run the suite, and you can see what you traded.
Add a case whenever a merchant reports a search that should have worked.

## 10. When nothing matches by meaning

Everything in sections 2 and 9 is built to return **nothing** rather than a weak
guess. That is right for "money back" on a store with no refund settings. It is
wrong for "va" — a merchant halfway through typing a word, whose fragment means
nothing at all but plainly begins several real ones.

So when the meaning-based pass returns an empty list, and only then, `search()`
runs a second pass:

```
"va"     →  Variation Library, Tax Regions, Tax Profiles, ...
"c"      →  Currency, Checkout, Checkout Configuration, ...
"va zo"  →  Tax Regions
"zzzz"   →  nothing
```

The rules are deliberately narrow:

- **Word prefix, not substring.** A card qualifies when it holds a word
  *beginning* with what was typed. "va" reaches **Va**t and **Va**riations, not
  ad**va**nced or pri**va**cy. A two-character substring would otherwise return an
  arbitrary third of the corpus.
- **Every typed word must be found.** "va zo" needs a word starting with `va`
  *and* a word starting with `zo` in the same card, so typing more narrows the
  list rather than growing it.
- **Ranked by field.** Each matched word scores the strongest boost it was found
  under — so a hit in a card's name sorts above one in its body text. The same
  ×3 / ×2.5 / ×2 / ×1.5 / ×1 table as everywhere else.
- **Case-insensitive**, like the rest of search.
- **Only on an empty result set.** This is the important one. Appending literal
  matches to every query would undo section 9 at a stroke — every honest "no
  results" would grow a tail of loose matches. Gating on emptiness means the
  fallback can only ever turn *nothing* into *something*, never weaken a result
  the merchant would otherwise have seen.

Stopwords are dropped first, so "the and of" still returns nothing — and so does
"a", which is one of them. A single letter that is not a stopword is a legitimate
prefix, though: "c" lists every card holding a word that begins with it, ranked by
field like any other fallback match and capped at the same top 12. The meaning
pass ignores a lone letter — it has no stem and no concept — so a one-character
query always arrives here.

## 11. Writing card copy that searches well

The crawler sees string literals it can reach lexically inside one file's JSX
subtree, and every word scores `field boost × idf`. Everything below follows from
those two facts.

**Copy inside a child component is invisible to the parent card.** Each `.tsx`
file is parsed on its own, so `<CurrencyFormatSettings />` is an empty tag to the
crawler — none of that component's strings land in the enclosing document. If you
extract a section into its own file, give that file's root card its own
`data-search-id`. Nested tagged cards also *take* their copy out of the enclosing
document, which is usually what you want, but be deliberate about it.

Likewise invisible: template literals with `${}`, and runtime values like
`{item.name}`. Only `__()` / `_x()` first arguments that are plain string
literals, JSX text, and the recognised attributes are collected.

**Spend the description on merchant nouns, not UI verbs.** The description is the
×2 field. Compare:

```
"Configure box sizes for accurate shipping cost calculations."
"Set parcel dimensions and package weight used to rate shipments."
```

The first contributes `configur` (idf 2.71), `box`, `cost`, `calculat`. That word
`cost` was the corpus's only occurrence, so it carried idf 3.76 — and in a
13-word card it dominated the vector badly enough that "money back" returned
Shipping Box. The second spends the same sentence on words a merchant types, and
is the copy that card carries today.

**Distinctive beats generic.** Measured across the 42 documents:

```
product 1.50   add 1.73   store 1.83   edit 1.83   customer 1.83   create 1.95
appear 2.08    price 2.08   set 2.24   enter 2.24   currency 2.24   configure 2.71
```

against 237 words that appear in exactly one document, at 3.76. "Configure your
store settings" is very nearly free of information.

**Aim for roughly 15–40 words per card.** The current spread runs from 13 words
(`currency.preferences`) to 41 (`essentials.barcode-generation`), and both ends
hurt: a five-dimension vector lets one accidental word own a third of it, while a
60-word document dilutes everything in it.

**Don't restate the page name in every card on that page.** Repeating "Shipping"
across the shipping cards drives that word's idf down for all of them and helps
none.

**Avoid hub words.** A word in *N* concept groups expands at `0.6 / N`. `money`
sits in four (`~currency`, `~price`, `~payment`, `~refund`); `email`, `order`,
`purchase`, `transaction`, `bill`, `billing`, `tariff`, `login`, `account`,
`market`, `territory`, `availability` and `swatch` sit in two.

Finally: say the word, or declare it. If a merchant would type "parcel" and no
card says it, no keyword lists it, and no concept group contains it, nothing can
match. Run `npm run search:index`, read the warnings, and add a golden query in
section 9 for anything you care about.

## 12. Limits you should know about

Be honest about these rather than discovering them later.

- **Meaning is bounded by the lexicon.** Synonyms nobody wrote into
  `concept-lexicon.mjs` do not match. This is a maintained artifact, not a trained
  model — it generalises exactly as far as you have extended it.
- **A query with no literal foothold rarely survives.** By design: the confidence
  rule in section 2 makes a purely associative match clear a much higher bar. The
  cost is that a genuine setting whose copy shares no word with how the merchant
  phrased it can be filtered out along with the noise. The cure is a lexicon
  entry or better card copy, not a lower threshold.
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
- **Typo recovery is one or two edits, no more.** "curency" finds currency;
  "kurrensy" does not. It only runs for a word that matched nothing exactly, so a
  typo that happens to spell another indexed word ("form" for "from") silently
  searches the wrong term — and never for a word under five letters, where a
  single edit rewrites too much of it to trust.
- **Keywords are a claim, and nothing checks them.** `data-search-keywords` makes
  a card findable by a word that is nowhere on it. Nothing verifies the card can
  actually do the thing the keyword names, so a careless list sends merchants to
  a card that cannot help them. Section 3 has the rule; the golden set in section
  9 is where you pin the ones that matter.
- **Drill-down pages are not searchable.** Anything behind a parameterised route
  (a tax region, a shipping zone) is opted out, because a result cannot build the
  URL.
