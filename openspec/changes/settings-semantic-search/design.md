## Context

See `proposal.md` — Why. The constraints that actually shape the approach:

- **The query is embedded in the browser, offline.** Precomputing document
  vectors in a build script is easy; the hard half is that the merchant's typed
  query must be turned into a comparable vector client-side, with no model and no
  API. Any scheme that can only embed documents is unusable.
- **All settings copy is inline JSX.** ~643 `__('…', 'kirki-ecommerce')` call
  sites across 118 `.tsx` files under `resources/app/features/settings/**`. PHP
  holds no settings UI text (`app/Settings/GeneralSettings.php` is 15 lines of
  storage plumbing; `resources/data/settings/*.json` holds values, not labels).
  There is no manifest to read — extraction must parse the source.
- **Three competing heading idioms.** `CardTitle`/`CardDescription` (11 uses),
  `<Text weight="semibold">` + secondary `<Text>` (~20), and `HeaderActionsCard
  header/subHeader` (14). No semantic `<h1>`–`<h6>` anywhere — `CardTitle` renders
  a `<div>`. A purely structural extractor cannot reliably find "the title".
- **No card has an identifier.** 99 `<Card>` tags under settings, none addressable.
- **The corpus is small.** ~60–80 cards plus 11 nav items. Anything that needs a
  large corpus to learn from will not work here.

## Goals / Non-Goals

**Goals:**

- One tokenizer/stemmer/lexicon shared verbatim by the crawler and the browser, so
  document and query vectors can never be built by diverging code.
- Ranking that is inspectable: for any result it must be possible to say which
  terms produced the score, because that same set drives the highlighting.
- Zero new runtime or build dependencies.
- The index loads only when settings search is used, not on admin boot.

**Non-Goals:**

- General-purpose search across products, orders, or customers. Settings only.
- A global ⌘K command palette. (`components/ui/command.tsx` already wraps `cmdk`
  and is unclaimed, but that is a separate change.)
- Typo tolerance / fuzzy matching. Out of scope for this change.
- Translated search. See Risks.

## Decisions

### TF-IDF + a hand-authored concept lexicon, not real embeddings

Cosine similarity over TF-IDF vectors, where both documents and queries are
expanded through a curated synonym/concept map before weighting.

*Alternatives considered:*

- **Pretrained word vectors (GloVe) baked into JSON.** Genuinely generalises to
  synonyms nobody listed, and the query side works offline by averaging vectors.
  Rejected: adds 200KB–1MB of payload and pulls a third-party model file with its
  own licence and provenance into a build that targets the WordPress.org
  directory.
- **LSA/SVD over the TF-IDF matrix.** Looks the most like real embeddings.
  Rejected on corpus size: latent semantics are learned from co-occurrence, and 60–80
  documents of 20–60 words each carry almost no co-occurrence signal. The result
  would feel arbitrary rather than smart — worse than the honest lexicon.
- **Runtime embedding API.** Actually semantic, but needs a key, adds per-keystroke
  latency, sends merchant queries to a third party, and requires external-service
  disclosure for WordPress.org. Disproportionate for a settings search box.

The lexicon is the honest trade: meaning is bounded by what we write down, and
that boundary is visible and editable rather than hidden in a weight matrix.

### Document expansion is weighted below literal terms

A lexicon hit contributes its concept id to the vector at **0.6** of the term's
weight. This is what makes "literal match outranks related-term match" fall out of
the scoring rather than needing a separate tie-break pass.

### Field boosts instead of separate indexes

One vector per document, with per-field multipliers folded in at term-frequency
time: card title ×3, description ×2, field labels ×1.5, placeholder/help ×1.
Simpler than maintaining a vector per field and combining at query time, and the
corpus is far too small for the difference to matter.

### Light suffix stemming, not Porter

Plurals (`s`/`es`/`ies`), `ing`, `ed`, `ly`. Full Porter over-stems aggressively
(`currency` → `currenc`, `shipping` → `ship`), and on a corpus this small each
collision is a meaningful share of the vocabulary.

### The shared core is authored as `.mjs`, typed by a thin `.ts` wrapper

The crawler is a bare Node script; Vite consumes the same code. A `.ts` file will
not load in bare Node without a build step, and adding one for a single script is
disproportionate. So tokenizer/stemmer/lexicon/vectorizer live in `.mjs`, and a
`search-engine.ts` re-export adds the types the app needs. This follows the
existing `resources/app/scripts/migrate-feature.mjs` convention.

*Alternative rejected:* duplicating the tokenizer in TS and in the crawler. The
two would drift, and drift here is silent — queries simply stop matching.

### Extraction keys off an authored `data-search-id`, not source structure

The crawler opens a document scope at any JSX element carrying `data-search-id`
and collects text until that element closes. This sidesteps the three-heading-idiom
problem entirely: the developer declares what a searchable unit is, rather than
the crawler guessing from `<Card>` nesting.

`resources/app/components/ui/card.tsx` needs **no change** — TypeScript does not
type-check hyphenated JSX attributes, and `Card` already spreads `...rest` onto
its div. `HeaderActionsCard` does not spread rest props, so it needs a one-line
pass-through.

*Alternative rejected:* deriving ids from file path + JSX position and locating the
card at runtime by matching its title text in the DOM. Zero source edits, but
breaks silently on duplicate titles, on conditionally rendered titles, and the
moment admin translations land and the DOM text stops matching the indexed
English.

### Route resolution by id prefix

`data-search-id` is `<pageKey>.<slug>`. The crawler owns an 11-entry
`pageKey → { route, pageTitle }` map and resolves the route from the prefix,
warning on an unknown one. The alternative — following the import graph from each
route's page component to find which file a card lives in — is considerably more
machinery for a mapping that is 11 lines and changes almost never.

### Index loaded by dynamic import

`await import()` inside the search hook, so Vite emits it as its own chunk fetched
when the merchant first types, rather than adding ~100KB to the main admin bundle.
The index lives under `resources/app/features/settings/search/` rather than
`resources/data/` — `resources/data/` ships as loose files in the zip and is read
by PHP, and this artifact is neither.

### Highlighting by DOM text-node wrapping, scoped to the matched card

After navigation, find `[data-search-id]`, scroll it into view, then wrap matching
text nodes inside that element only. Cleanup replaces the wrappers with text nodes
and calls `normalize()`.

*Alternative considered:* the CSS Custom Highlight API — no DOM mutation at all,
so no possibility of fighting React. Rejected as a single implementation because
Firefox only gained support in 140, which would leave a share of wp-admin users
with no marks; and shipping both paths doubles the surface for one visual effect.

`settings-layout.tsx` keys its content pane by `pathname`, so the pane remounts on
navigation — that is the hook point for scroll-and-mark.

## Risks / Trade-offs

- **Meaning is bounded by the lexicon** → Seed it from the settings domain
  (refund/return/reimburse, tax/vat/levy/duty, shipping/delivery/courier,
  guest/anonymous, invoice/receipt/bill, …) and treat it as a maintained artifact
  documented in `docs/settings-search.md`. Unit tests pin the behaviour of the
  entries that matter most.
- **Index drift** → Accepted deliberately: freshness is enforced only by the
  developer running `npm run search:index` and by `make:package`. No CI gate. The
  failure mode is visible rather than silent — a stale entry returns a result that
  highlights nothing, because the terms it was indexed on are no longer on screen.
  Mitigated for releases by the packaging requirement.
- **English-only index** → The admin bundle currently has no
  `wp_set_script_translations()` and the repo has no `.pot`, so the admin UI is
  English today and this costs nothing. It becomes a real gap the moment admin
  translations land: the index would describe English while the UI renders
  translated text. Called out in `docs/settings-search.md` as a known follow-up.
- **New cards are silently unsearchable** → The crawler warns on any `<Card>`
  containing `__()` copy with no `data-search-id`. A warning, not a failure, per
  the freshness decision above.
- **Marks are lost on re-render** → If a tagged card re-renders (the merchant types
  in one of its fields) its `<mark>` wrappers go. Accepted: the marks are a
  transient orienting aid, not state.
- **Short documents distort TF-IDF** → A two-word card matching a two-word query
  can score near 1.0 by coincidence. Mitigated by indexing whole cards (which pulls
  in field labels and help text, so documents are rarely tiny) rather than
  individual fields, and by the score threshold.

## Migration Plan

No data migration, no schema change, no backend change. The change is additive
except for the sidebar's search behaviour, which is replaced in place. Rollback is
reverting the commit; the generated index is a gitignored build artifact with no
consumers outside the settings sidebar.
