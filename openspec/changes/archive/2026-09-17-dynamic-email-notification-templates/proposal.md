## Why

The Email settings page lists 15 notification templates (7 customer order events, 7
admin order events, 1 admin low-stock alert, and `reset_password` under both customer
and admin user notifications), but the feature is only half-built: every row's title is
blank (the backend records carry no `name` field) and the per-row Edit button is wired
to a no-op. On the backend, only one of the 15 keys
(`customer_emails.order_notifications.order_confirmation`) has a working `Mailer` class
behind it — the other 14 settings entries carry identical placeholder copy
("Thank you for your order!") copy-pasted across unrelated events, and the
preview/send-test-mail endpoints are hardcoded to that single template. Store owners
currently have no way to view, edit, or test any notification email other than order
confirmation.

## What Changes

- Add a dynamic per-notification template editor, routed at
  `/settings/email/:type/:group/:key`, reachable from each notification row's Edit
  button (replacing today's no-op).
- Define a frontend dictionary of the 15 notification keys with human-readable labels,
  used both for the (currently blank) row titles and for building the edit route.
- Extend `EmailNotificationSchema`/`EmailNotificationGroupSchema` (`schemas/catalog/settings.ts`)
  with real `subject`/`heading`/`message`/`shortcodes` fields — replacing their current
  bare `{ name, is_enabled }` passthrough shape, which predates any editor for those
  fields.
- Add 13 new order-event Mail classes alongside the existing
  `CustomerOrderConfirmationMail` — one per (recipient type × event) pair, following
  this codebase's existing per-notification-class convention:
  `CustomerOrderProcessingMail`, `CustomerOrderOnHoldMail`, `CustomerOrderCompletedMail`,
  `CustomerOrderRefundedMail`, `CustomerOrderCancelledMail`, `CustomerOrderFailedMail`
  under `app/Mails/customers/`, and `AdminOrderConfirmationMail` through
  `AdminOrderFailedMail` (7 classes) under `app/Mails/admins/`.
- Add two new Mailer classes, `ResetPasswordNotificationMail` and
  `LowStockNotificationMail`, with new sample-data fixtures, so every one of the 15
  notification keys has a real preview/send-test path.
- Make `EmailTemplateController`'s preview and send-test-mail endpoints dynamic: new
  `GET/POST /settings/email/{type}/{group}/{key}/preview[...]` routes resolve
  `type/group/key` to the right Mailer class via a new registry, instead of being
  hardcoded to one template. The existing flat `/settings/email/preview` routes are
  unchanged (they back the separate default-template/branding editor).
- Add real-time shortcode preview: as the subject/heading/message fields are edited,
  `{token}` placeholders resolve live in the preview pane via client-side substitution
  against the variables the backend preview already returns — no network round-trip per
  keystroke.
- Fix an existing template bug: the email layout's "Order {number}" eyebrow line renders
  unconditionally, which is meaningless for the new non-order notification types
  (`reset_password`, `low_stock`).

## Capabilities

### New Capabilities

- `email-notification-templates`: dynamic per-notification-key template editing
  (routing, labeling, subject/heading/message editing, live shortcode preview,
  send-test-mail) covering all 15 customer/admin notification keys, plus the backend
  registry-driven preview/send-test-mail API that makes any key previewable and
  testable instead of only `order_confirmation`.

### Modified Capabilities

None — no existing `openspec/specs/*` capability documents this area today (the closest
matches, `settings-navigation-shell` and `account-self-service`, cover unrelated
behavior); this is a new capability rather than a change to an existing one.

## Impact

- **Backend**: `app/Mails/` (13 new order-event classes under `customers/`/`admins/`,
  new `ResetPasswordNotificationMail`, `LowStockNotificationMail`,
  `EmailNotificationRegistry`; `CustomerOrderConfirmationMail` is unchanged),
  `app/Mails/Mailer.php` (content-override support),
  `app/Http/Controllers/Api/EmailTemplateController.php`, new
  `app/Http/Requests/Settings/SendNotificationTestEmailRequest.php`, `routes/api.php`,
  `resources/views/emails/layouts/heading.php`, new sample fixtures under
  `resources/data/sample/`.
- **Frontend**: `resources/app/features/settings/email/**` (new page, context, hook,
  service, layout, preview component/hook, skeleton, schema, `lib/shortcode.ts`), plus
  `resources/app/schemas/catalog/settings.ts`, `resources/app/config/route-config.ts`,
  `resources/app/config/endpoints.ts`, `resources/app/features/settings/routes.tsx`.
- No database schema changes — `resources/data/settings/email.json` defaults are edited
  in place (content only), not restructured.
- `CustomerOrderConfirmationMail` is confirmed (via grep) to be referenced only from
  `EmailTemplateController`, never dispatched on a real order event, so its
  generalization carries no risk to any live send path.
