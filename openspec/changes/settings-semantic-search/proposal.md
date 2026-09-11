## Why

The settings sidebar's search box only substring-filters the 11 navigation items
by their label and descriptive text. The ~643 translated strings that make up the
actual settings copy — card titles, descriptions, field labels, placeholders, help
text — are invisible to it. A merchant who wants to turn off guest checkout, or
find where refunds are configured, has to already know which of the 11 pages owns
that setting, which is exactly the knowledge search is supposed to replace.

## What Changes

- **BREAKING** (behavioral, not API): the sidebar search stops filtering nav items
  and instead searches settings *content*. While a query is active the sidebar's
  section headings are hidden and replaced by a flat list of results ranked by
  relevance. The empty-state copy changes from "No settings found" to
  "No results found".
- Search matches by **meaning, not substring**. A build-time crawler extracts each
  settings card's copy from the TSX source, converts it to a TF-IDF vector expanded
  through a hand-authored concept lexicon, and stores the result as a committed
  JSON index. At runtime the typed query is converted to a vector by the same code
  and compared with cosine similarity. No external search library, no model, and no
  network call — the whole thing runs client-side and offline.
- Each result points at a **card**, not just a page. Selecting one navigates to the
  settings page, scrolls its card into view, and marks the matched terms inside it.
- Matched terms are marked in both panes, including terms the merchant did *not*
  type — the lexicon-expanded terms that actually drove the score — so a purely
  semantic hit visibly explains itself.
- Searchable cards gain an authored `data-search-id` anchor at their call site.
- A new `npm run search:index` script regenerates the index; `npm run make:package`
  runs it automatically before bundling.

## Capabilities

### New Capabilities

- `settings-search`: how the settings panel is searched — what content is indexed,
  how a query is matched by meaning rather than substring, how results are ranked
  and presented, how a result navigates to and highlights its card, and how the
  index stays tied to the source it was built from.

### Modified Capabilities

- `settings-navigation-shell`: the requirement "Sidebar navigation items are
  single-line and searchable" is superseded. Search scope widens from nav-item
  label/description to all settings content; results become a flat ranked list
  rather than a filtered view of the grouped sections; the empty-state copy
  changes. The single-line rendering of nav items when *not* searching is retained.
- `plugin-packaging`: packaging gains a requirement that the shipped bundle carries
  a search index regenerated from the current source, so a release can never ship
  an index that disagrees with the UI.

## Impact

- **New**: `resources/app/features/settings/search/` (search core, concept lexicon,
  generated index, hooks, highlight rendering);
  `resources/app/scripts/build-settings-search-index.mjs`; `docs/settings-search.md`.
- **Modified**: `resources/app/features/settings/pages/settings-sidebar.tsx`,
  `settings-nav-item.tsx`, `settings-layout.tsx`; `resources/app/package.json`
  (new `search:index` script); `bin/make-package.sh` (crawler step before the
  frontend build); `resources/app/components/header-actions-card.tsx` (anchor
  pass-through).
- **Mechanical**: a `data-search-id` attribute added to the outer `Card` of each
  searchable section across ~59 files under `resources/app/features/settings/**`.
  `resources/app/components/ui/card.tsx` needs no change — it already spreads rest
  props onto its div, and TypeScript does not type-check hyphenated JSX attributes.
- **Dependencies**: none added. The crawler uses `typescript@^5.7`, already a
  devDependency of `resources/app`.
- **Not affected**: no PHP, no REST endpoint, no database, no build-time or runtime
  third-party service. PHP holds no settings UI text, so the backend is untouched.
