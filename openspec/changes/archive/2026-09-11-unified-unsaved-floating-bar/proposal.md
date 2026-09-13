## Why

The settings panel has no way to save. Every settings page already publishes
`{ isDirty, isSaving, onSave, onDiscard }` to the shell via `useSettingsPageActions`,
and `settings-layout.tsx` stores them — but the header that was meant to render Save and
Discard is commented out, so those handlers are registered and never invoked. A merchant can
edit Store Name and has no affordance to persist it.

Separately, three screens already solve "you have unsaved work" three different ways: the
product and variant forms show a bottom toast, bulk edit shows a badge plus a confirmation
dialog, and settings shows a confirmation dialog with no save button at all. Four overlapping
navigation guards back them. Unifying on one floating bar fixes settings and collapses that
duplication in the same stroke.

## What Changes

- Generalize the existing product/variant unsaved toast into a shared floating bar that
  accepts its actions as children, takes its label as a string or rich node, and can be
  tweaked per-screen via `cssOverride`.
- **BREAKING** (merchant-visible): on settings the bar appears as soon as a page is dirty. Settings
  had no save affordance at all before, so the bar is the whole of its save path and must be
  visible without prompting.
- The product and variant forms keep their page-header Cancel/Save pair and keep showing the
  bar only when an attempt to leave a dirty form is refused. Their merchant-visible behaviour
  is unchanged; they change only by adopting the shared component and the shared guard.
- **BREAKING** (merchant-visible): a blocked navigation no longer opens a confirmation dialog
  on settings. The navigation is refused and the bar shakes to draw attention. The merchant
  leaves by choosing Save or Discard.
- The bar's destructive action is labelled **Discard**, not Cancel: it reverts the form and
  keeps the merchant on the screen, abandoning the navigation that was blocked rather than
  completing it. "Cancel" was rejected as ambiguous — it
  reads as "cancel the navigation" as readily as "cancel my edits" — and one unconfirmed
  click now destroys unsaved work.
- Settings gains the bar, wired to the already-registered page actions. Settings pages with no
  save flow (Payments, Advanced, Essentials, the variation library) register nothing and so
  show no bar, with no per-page work.
- Collapse four navigation guards into one hook, which also becomes the single owner of the
  global unsaved-data flag.
- Fix a leak: settings pages set the global unsaved flag but never clear it on unmount, so
  leaving a dirty settings page leaves the flag set application-wide and the browser's native
  reload prompt then fires on unrelated pages.

Not in scope: the `⋯` overflow menu drawn in the design. Nothing concrete sits behind it yet,
and the bar takes free-form children, so it can be added later without touching the bar.

## Capabilities

### New Capabilities

- `unsaved-changes-floating-bar`: the shared bottom floating bar — when it is visible, how it
  animates in, when it shakes, what it delegates to the screen that renders it, and the single
  navigation-guard behaviour that drives it across every screen that has unsaved work.

### Modified Capabilities

- `product-form-unsaved-toast`: superseded wholesale by `unsaved-changes-floating-bar`. Its
  requirements are removed — the toast no longer waits for a blocked navigation, its Cancel no
  longer merely dismisses, and visibility became a per-screen choice.
- `settings-page-actions`: Save and Discard move out of the shared settings header and into the
  floating bar; blocked navigation shakes the bar instead of presenting a confirmation dialog.
- `product-form`: the in-app unsaved warning is restated in terms of the floating bar, which is
  now present on first edit — but only on screens with no header Save, which is why the product
  and variant forms keep the blocked-navigation trigger.

`bulk-edit-form` is deliberately absent: bulk edit swaps its private guard hook for the shared
one but keeps its own badge and confirmation dialog, so no requirement changes.

## Impact

- `resources/app/components/unsaved-toast.tsx` → `components/floating-bar/floating-bar.tsx`,
  rewritten to take children; new co-located Vitest file.
- `resources/app/hooks/use-unsaved-navigation-guard.ts` — the one guard; also owns the global
  unsaved flag.
- `resources/app/features/bulk-edit/hooks/use-bulk-edit-navigation-guard.ts` — deleted.
- `resources/app/features/settings/pages/settings-layout.tsx` — dialog and dead header removed,
  bar mounted.
- `resources/app/features/settings/hooks/use-settings-page-actions.ts` plus ~14 settings pages —
  the scattered global-flag effect is centralized.
- `resources/app/features/products/components/product-form/product-form.tsx`,
  `features/products/hooks/use-product-form.ts`,
  `features/inventory/pages/edit-inventory.tsx` — bar adopted, header actions untouched.
- No backend, REST, or database change. No new dependency.
