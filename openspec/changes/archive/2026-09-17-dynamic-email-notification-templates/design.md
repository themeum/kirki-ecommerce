## Context

See `proposal.md` - Why for motivation. Relevant current-state facts that shape this
design:

- Of the 15 notification keys in `resources/data/settings/email.json`
  (`customer_emails`/`admin_emails` × `order_notifications`/`user_notifications`/`inventory_notifications`),
  only `customer_emails.order_notifications.order_confirmation` has a working `Mailer`
  class (`app/Mails/customers/CustomerOrderConfirmationMail.php`). It is only ever
  referenced from `EmailTemplateController` (confirmed by grep) — never dispatched on a
  real order event.
- `app/Mails/Mailer.php` already resolves `subject`/`heading`/`message` from settings
  via an abstract `option_key()` (a dot path like
  `customer_emails.order_notifications.order_confirmation`) and already supports
  overriding *branding* (`with_template_overrides()`, merged into `default_template`)
  for the separate default-template editor. It has no equivalent override for content
  fields yet.
- `resources/app/features/settings/email/pages/email-settings.tsx` already renders all
  15 rows and already has a working enable/disable toggle
  (`handleToggleOrder`/`buildTogglePayload`); only the Edit action and row labels are
  unfinished.
- `resources/app/schemas/catalog/settings.ts`'s `EmailNotificationSchema` /
  `EmailNotificationGroupSchema` are a deliberate `{ name, is_enabled }.passthrough()`
  record — documented in `openspec/changes/zod-first-type-declarations` as correct
  *because* nothing edited subject/heading/message at the time. This change is what
  makes those fields non-dynamic.
- The existing default-template preview (`edit-template.tsx`) never re-hits the server
  per edit: it fetches rendered HTML once, then live-patches DOM nodes tagged
  `data-email-part="<field path>"` in an iframe as the form changes
  (`use-email-template-preview-sync.ts`). This change reuses that architecture rather
  than introducing a second preview mechanism.
- The shared email layout (`resources/views/emails/layouts/heading.php`) unconditionally
  prints an "Order {order_number}" eyebrow line above the heading — fine for the 14
  order-event keys, broken for the two non-order keys this change adds
  (`reset_password`, `low_stock`).

## Goals / Non-Goals

**Goals:**
- Every one of the 15 notification keys is individually editable, previewable, and
  test-sendable.
- Every notification key has its own explicit, discoverable Mail class, matching this
  codebase's existing per-notification-class convention
  (`app/Mails/customers/CustomerOrderConfirmationMail.php`) rather than introducing a
  new generalized/parameterized pattern.
- The live preview has zero added network latency per keystroke.

**Non-Goals:**
- No changes to the default-template (branding: logo/colors/footer) editor or its
  existing flat `/settings/email/preview` endpoints — those stay as they are.
- No real password-reset or low-stock *send* flow is being built. `ResetPasswordNotificationMail`
  and `LowStockNotificationMail` exist solely so those two keys are previewable/testable
  from the settings UI, using fabricated sample data — the same "never persisted,
  preview-only" spirit as the existing `build_sample_order()`. Wiring these mailers into
  a real trigger (an actual password-reset flow, an actual low-stock check) is separate
  future work.
- No change to how `is_enabled` toggling works on the list page — that's already
  functional and out of scope.
- Not rewriting `resources/data/settings/email.json`'s placeholder copy for the 14
  currently-generic entries into finished marketing copy — that's a content decision for
  the store owner to make in the new editor, not something this change hardcodes.

## Decisions

**One dedicated Mail class per (recipient type × event) order-notification pair,
matching the existing convention.** `app/Mails/customers/CustomerOrderConfirmationMail.php`
already establishes this codebase's pattern: one small, single-purpose class per
notification, named and foldered by recipient type (`customers/`/`admins/`). Rather
than collapsing that into a single class parameterized by `option_key()`, this change
keeps the one-class-per-notification convention and adds the other 13 order-event
classes — 6 more under `customers/` (`CustomerOrderProcessingMail`, `CustomerOrderOnHoldMail`,
`CustomerOrderCompletedMail`, `CustomerOrderRefundedMail`, `CustomerOrderCancelledMail`,
`CustomerOrderFailedMail`) and 7 under `admins/` (`AdminOrderConfirmationMail` through
`AdminOrderFailedMail`), each hardcoding its own `option_key()` exactly as
`CustomerOrderConfirmationMail` does today. Every class's `with()` body is identical
(order summary, tracking, customer note, etc.) — only `option_key()` differs — so each
new class is a small, mechanical copy of the existing one. Alternative considered (and
rejected on user direction): a single `OrderNotificationMail` parameterized by
`option_key`, which would remove the duplication but break from this codebase's
established per-notification-class pattern.

**Key→Mailer resolution via a small registry, not per-route hardcoding.**
A new `EmailNotificationRegistry::resolve(type, group, key)` maps every one of the 15
`type/group/key` combinations directly to its Mailer class (each order-event
combination resolves 1:1 to its own dedicated `Customer*Mail`/`Admin*Mail` class; both
`reset_password` combinations resolve to the shared `ResetPasswordNotificationMail`;
`admin/inventory/low_stock` resolves to `LowStockNotificationMail`), plus the
sample-data builder each needs, and validates the combination so the controller has one
place to extend when a new notification key is added. Alternative considered: a
`switch` inline in the controller — rejected as it mixes HTTP concerns with domain
resolution and gets harder to extend.

**Content overrides on `Mailer`, mirroring the existing branding-override pattern.**
`with_content_overrides()` / `get_option_value()` parallel the existing
`with_template_overrides()` / `get_default_template()` exactly, so Send Test Mail can
preview unsaved subject/heading/message the same way the default-template editor
already previews unsaved branding. Alternative considered: a one-off code path specific
to content — rejected for introducing a second override mechanism where one pattern
already works.

**Client-side shortcode substitution for live preview, not a debounced server
round-trip.** The preview endpoint already returns the full `variables` map
(`get_variables()`) alongside the rendered HTML. A small client-side function mirroring
`ShortcodeParser`'s regex (`/\{([a-zA-Z0-9_]+)\}/`) can substitute those variables into
the *draft* heading/message text and patch the already-rendered iframe DOM, exactly as
the default-template editor already does for branding fields. This gives zero-latency
preview and reuses the existing `data-email-part` DOM-patching architecture instead of
adding a second one. Trade-off: the client-side regex must be kept in sync with the
backend's `ShortcodeParser` pattern — acceptable since both are a single, simple regex
and the pattern is stable. Alternative considered: debounce and POST the draft to the
preview endpoint on every change — rejected for added latency and continuous server load
while typing, for no behavioral benefit over the client-side approach.

**Extend the existing `EmailNotificationSchema` rather than adding a parallel schema.**
Per the project's zod-first-type-declarations convention (`openspec/project.md`), the
catalog schema is the source of truth that form schemas derive from
(`EmailTemplateFormSchema` already derives from `EmailTemplateShape` this way). Adding
`subject`/`heading`/`message`/`shortcodes` to `EmailNotificationSchema` (keeping
`.passthrough()`) lets the new form schema `.pick()` those fields instead of
redeclaring them, and lets the list page's row types derive from the same schema
instead of a hand-rolled, duplicated interface.

**URL segments use underscores, matching existing settings-key spelling.**
`option_key()` paths, `EMAIL_CONFIG` prefixes, and the settings JSON all use
`order_confirmation`-style underscores already. Introducing a kebab-case URL
(`order-confirmation`) would require a translation layer for no benefit — the route
segments are internal identifiers, not user-facing slugs.

## Risks / Trade-offs

- **[Risk]** The shared email layout's "Order {number}" eyebrow line is order-specific
  and would misrender for `reset_password`/`low_stock` previews.
  → **Mitigation**: guard that block on `!empty($data['order_number'])` in
  `heading.php`, so it simply doesn't render for non-order notifications.
- **[Risk]** `order-view-button.php`'s "View Your Order" copy/link is customer-facing
  wording; each new `Admin*OrderMail` class will also render it for admin-facing order
  notifications.
  → **Mitigation**: acceptable as placeholder copy for this change (the button text is
  itself editable content in the broader sense — it's a static view partial, not a
  per-notification field); flagged as a known follow-up rather than blocking this change.
- **[Risk]** Client-side shortcode substitution can drift from the backend's
  `ShortcodeParser` if either regex changes independently.
  → **Mitigation**: both are a single-line regex (`/\{([a-zA-Z0-9_]+)\}/`); keep them
  literally identical and call this out in code comments on both sides.
- **[Trade-off]** `ResetPasswordNotificationMail`/`LowStockNotificationMail` are
  preview-only (no real trigger wired up), which could read as a half-finished feature.
  → Accepted as explicitly scoped in Non-Goals — it matches the existing
  `build_sample_order()` precedent, and wiring a real trigger is separate work with its
  own design questions (e.g. an actual password-reset flow doesn't exist in this
  codebase yet).

## Migration Plan

- No data migration: `resources/data/settings/email.json`'s existing 15 entries already
  have `subject`/`heading`/`message`/`shortcodes` keys (currently placeholder copy) —
  this change only adds the schema/editor to read and write them meaningfully.
- `CustomerOrderConfirmationMail` is unchanged and needs no migration; the 13 new
  order-event classes are purely additive, with no existing callers to update.
- Existing flat `/settings/email/preview` routes and the default-template editor are
  untouched; the new `/settings/email/{type}/{group}/{key}/preview` routes are additive.
- Rollback: revert the change set; no persisted data format changes to unwind.

## Open Questions

None — all decisions above were resolved during proposal review rather than deferred.
