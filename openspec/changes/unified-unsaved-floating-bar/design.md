## Context

See proposal.md — Why.

What already exists and shapes the approach:

- `resources/app/components/unsaved-toast.tsx` already portals a fixed bottom bar into
  `#kirki-ecommerce-root` via `getPortalContainer()` (`libs/portal-container.ts`), already
  slides in by transitioning `transform`/`opacity` between a visible and a hidden style, and
  already replays a shake by remounting its inner `<Flex key={shakeSignal}>`. The mechanics this
  change needs are present; only the props and the visibility rule are wrong.
- `hooks/use-unsaved-navigation-guard.ts` wraps React Router v7's `useBlocker` with an
  `isSavingRef`, a `shakeSignal` counter bumped on every fresh blocker object, and an
  `isBlocked && !isDirty → blocker.reset()` escape. All three are load-bearing and correct.
- `features/settings/hooks/use-settings-page-actions.ts` already lifts each settings page's
  `{ isDirty, isSaving, onSave, onDiscard }` into `settings-layout.tsx` through outlet context.
  Nothing needs inventing on the settings side; the consumer just has to be built.
- The router is a `createHashRouter` data router (`resources/app/routes.tsx`), so `useBlocker`
  is available. Settings sidebar rows navigate imperatively via `useNavigate`, which `useBlocker`
  still intercepts.
- Styling is Emotion via `theme/mixins.ts`. Any raw `css={...}` must pass through `scoped()` or
  WordPress admin's normalize rules win on specificity.

## Goals / Non-Goals

**Goals:**

- One bar component, one navigation guard, one owner of the global unsaved flag.
- The bar knows nothing about products, variants, or settings — it takes children and a label.
- Settings gains a working save path with no change to the 14 pages that already register actions.

**Non-Goals:**

- Redesigning where the bar sits. Position is carried over byte-for-byte from today's toast
  (`left: 45%`, `bottom: theme.spacing[12]`, `maxWidth: 762`, `zIndex: theme.zIndex.toast`).
- Migrating bulk edit's presentation. It adopts the shared guard hook and keeps its badge and
  confirmation dialog.
- Touching `floating-components/unsaved-tracker.tsx`. Its `beforeunload` and `confirmAction` serve
  destructive-action confirmation, a separate concern with five live call sites.
- The `⋯` overflow menu from the design.

## Decisions

**Refactor the existing toast rather than write a second bar.** The alternative — a new
`FloatingBar` beside `UnsavedToast` — would leave two near-identical fixed bottom bars competing
for `theme.zIndex.toast`, and the requirement is explicitly that all three screens share one bar.
The file moves to `components/floating-bar/floating-bar.tsx` so it can carry a co-located test,
matching how `components/data-table/` is organised.

**Children over a variant enum.** The three screens need different button labels ("Create" vs
"Save") and, later, possibly different action sets. Encoding that as props on the bar would grow a
new prop per screen. Free-form children plus a `ReactNode` label plus `cssOverride` — the escape
hatch used by ~40 components already, always merged last through `scopedMerge` — keeps the bar
closed to modification.

**Shake becomes conditional on `shakeSignal > 0`.** Today `styles.content` carries the shake
`animation` unconditionally and gets away with it because the bar only ever mounts on a blocked
navigation. Once the bar is visible on a settings page from its first keystroke, that same style would shake on first
keystroke. Gating the animation style on `shakeSignal > 0` while keeping `key={shakeSignal}` for
the replay preserves the existing trick and fixes the new case.

**Refuse-and-shake instead of a confirmation dialog.** A modal for "you have unsaved changes" is
redundant once a bar saying exactly that is already on screen; the modal also hides the bar behind
its overlay, so a shake underneath it would be wasted. The cost is that leaving without saving now
takes three deliberate steps — Discard, then retry the navigation — rather than one confirm.

**The destructive action is labelled "Discard", not "Cancel".** One click destroys unsaved work
with no confirmation now that the dialog is gone, so the label has to name what is destroyed.
"Cancel" reads as "cancel the navigation" as readily as "cancel my edits" — exactly backwards. This
is the one deliberate deviation from the supplied design, which draws "Cancel".

**Discard reverts and stays; it does not complete the blocked navigation.** The alternative —
revert, then `blocker.proceed()` — meant a merchant who clicked a settings nav item, thought better
of it, and clicked Discard still landed on the page they had abandoned. Discard answers "what
happens to my edits", not "where do I go", so it calls `cancelNavigation()` and leaves the merchant
where they were. Retrying the navigation then succeeds, because the screen is clean. This also
removes the reset-then-proceed ordering hazard: the guard's `isBlocked && !isDirty → blocker.reset()`
effect now agrees with the handler instead of racing it.

**The guard hook owns the global unsaved flag.** `setUnsavedDataStatus(isDirty)` with an unmount
cleanup moves out of `use-product-form.ts` and out of ~14 settings pages into the one hook every
guarded screen already calls. That is what actually fixes the leak: settings pages set the flag and
never cleared it, so an abandoned dirty settings page left the application-wide flag set and the
root `beforeunload` then fired on unrelated pages. Centralising also lets bulk edit drop its private
`beforeunload` listener, since the root controller's single listener reads the same flag.

**Settings drives the bar from the registered actions, not from a form.** `settings-layout.tsx` has
no form of its own; `actions?.isDirty` is its dirty signal. Pages that register nothing leave
`actions` null, so `isDirty` is false and the bar stays hidden — Payments, Advanced, Essentials and
the variation library need no per-page work. The layout must also call the guard's `markSaving`
around `actions.onSave()`, or a post-save navigation would be blocked by the still-dirty form.

**The WordPress admin menu is handed to the router rather than blocked in place.** The plugin's
menu entries are hash links on the current document (`admin.php?page=kirki-ecommerce#/orders`), and
`app.tsx` navigated them by assigning `window.location.href`. React Router 7's history listens to
`popstate` only — it registers no `hashchange` listener — so a hash assignment produces a history
update with no delta, and the router skips its blocker branch entirely. Its source says so outright:
"You are trying to use a blocker on a POP navigation to a location that was not created by
@remix-run/router. This will fail silently in production." The alternative was to refuse the click
in `app.tsx` and push a separate refusal signal through `unsaved-store` into the guard, giving every
consumer a second "blocked" flag to combine — and leaving bulk edit's Confirm button with no
navigation to proceed with. Converting the click into `router.navigate(path)` instead means the
existing blocker, shake, bar visibility, Discard-and-retry, and bulk edit's dialog all keep working
untouched; the only new code is deciding whether an href points back into the application.

## Risks / Trade-offs

- **Two visibility modes are two behaviours to keep straight.** A merchant moving between settings
  and the product form meets the same bar under different rules. → Accepted: the rules follow from
  what else is on screen. Settings has no header Save, so the bar must announce itself; the product
  form has one, so an always-present bar would just duplicate it and cover the page.
- **The menu handler now depends on the href shape WordPress renders.** `getInAppPath` treats an
  href as in-app only when its path and query match the current document exactly. An extra query
  parameter on the current URL makes the comparison fail. → Accepted: the failure mode is the old
  behaviour (a full page load, guarded by the native prompt), not a lost guard.
- **One unconfirmed click discards unsaved work.** → Mitigated by the "Discard" label rather than a
  confirmation step; the word states the consequence.
- **Removing the header Save changes muscle memory** for anyone already using the product form. →
  Accepted deliberately; it is the point of unifying on one affordance.
- **`typecheck` is the main safety net.** There is no browser verification in this project
  (CLAUDE.md §0), and the bar's positioning and animation are not covered by Vitest. Visual
  confirmation has to be done by hand.
- **`openspec/changes/variant-edit-page/` carries an unarchived delta that ADDs a requirement to
  `product-form-unsaved-toast`**, the capability this change removes wholesale. Whichever archives
  second will conflict. → Resolve before archiving either: if `variant-edit-page` lands first, its
  added requirement needs folding into `unsaved-changes-floating-bar`'s label requirement, which
  already covers the same ground (the guarded screen supplies the wording).
