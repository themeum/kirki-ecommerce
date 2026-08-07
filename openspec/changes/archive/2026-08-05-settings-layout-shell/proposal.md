## Why

Settings is currently a **landing page**: `/settings` renders a searchable card of nav rows, and clicking one navigates away to a flat sibling route. The merchant loses the nav the moment they enter a settings page, and every one of the ~17 settings routes re-implements the same chrome (its own sticky "Settings" `PageHeading` with Save/Cancel, its own `Container size="sm"`, its own `PageNavbar` back-arrow, its own `handleBackButton`).

The design has changed: the nav becomes a **persistent left sidebar** and the selected page renders beside it. Making that work also forces three latent defects to be fixed, because the new layout cannot behave correctly around them — a cross-page unsaved-state leak, unguarded nav clicks, and a route-keyed remount that would destroy the sidebar on every click.

## What Changes

- **BREAKING (internal routing)**: the flat `/settings/*` sibling routes become children of a new `/settings` layout route. `/settings` itself becomes an index redirect to `/settings/general` — it no longer renders a page of its own.
- New settings layout: sticky "Settings" header spanning both columns at `Container size="lg"` (900px), then a 276px sidebar + 24px gap + a content column whose width is set by the page itself, floored at 600px so it never narrows below that regardless of content (e.g. a loading placeholder). Pages keep their existing `Container size="sm"` (600px), so the standard case is 900px total; a page needing more room — the two-pane email template editor — can render wider without the shell clamping it. Sidebar is sticky, offset below the sticky header.
- Sidebar nav rows become single-line (icon + label); the `subHeader` copy stays in config solely to feed the existing search filter. `pages/settings/settings.tsx` and `pages/settings/settings-item.tsx` are deleted.
- Save/Cancel move out of the individual pages and into the layout's header. Each page **registers** `{ isDirty, isSaving, onSave, onDiscard }` through the settings outlet context; registration clears on unmount. Pages with no form (Payments, Essentials) register nothing and show no buttons, as today.
- New shared `SettingsPageHeader` (icon + title, optional back) replaces the `PageNavbar` each settings page renders today.
- Unsaved-changes guard becomes a single `useBlocker` in the layout, covering sidebar clicks, browser back/forward, and leaving settings — not just the page's own back arrow. `beforeunload` continues to cover reload/tab-close.
- All 7 drill-down routes (shipping zone, delivery method ×2, tax region ×2, email template, variation color/list) nest inside the layout so the sidebar stays visible. `/settings/essential/...` is renamed to `/settings/essentials/...` so the existing parent prefix match highlights correctly.
- `Advanced` and `License` get real routes and placeholder pages (mock content) instead of being permanently disabled rows; the already-built `/settings/checkout` page gains the sidebar entry it never had.
- `components/animated-page/animated-page.tsx` now keys its wrapper on `/settings` (constant) for any settings route instead of the full pathname, so the settings shell — sidebar included — mounts once and survives navigation between settings pages; every other route keys on the full pathname exactly as before, unchanged. `SettingsLayout` animates only its own content pane per navigation, matching the shared component's existing enter transition.

## Capabilities

### New Capabilities

- `settings-navigation-shell`: The settings layout structure — persistent sidebar, index redirect, active-item highlighting including drill-downs, search filtering, sidebar/content dimensions, and which routes live inside the shell.
- `settings-page-actions`: How a settings page publishes its save/discard affordances to the layout header, and how unsaved changes block navigation and reload.

### Modified Capabilities

(none — no existing main spec in `openspec/specs/` covers settings behavior)

## Impact

- **New**: `resources/app/pages/settings/settings-layout/` (`settings-layout.tsx`, `settings-sidebar.tsx`, `settings-nav-item.tsx`, `use-settings-page-actions.ts`), `resources/app/pages/settings/settings-page-header.tsx`, placeholder pages for Advanced and License
- **Deleted**: `resources/app/pages/settings/settings.tsx`, `resources/app/pages/settings/settings-item.tsx`
- **Routing**: `resources/app/routes.tsx` — flat settings routes become a nested tree; two paths renamed
- **All settings pages** (~17 files under `resources/app/pages/settings/`): drop their own `PageHeading`, swap `PageNavbar` → `SettingsPageHeader`, register save actions — each page **keeps** its own `Container`
- **Shared component**: `resources/app/components/animated-page/animated-page.tsx` — settings-scoped key change only; no route outside settings changes behavior
- **Unchanged**: `resources/app/libs/unsaved-store.ts` and `resources/app/floating-components/unsaved-tracker.tsx` keep owning `beforeunload`; the root `confirmAction` outlet context stays available to the 16 existing consumers
- **Out of scope**: the visual design of the settings forms themselves (broken today, stays broken), backend/PHP, real content for the Advanced and License pages
