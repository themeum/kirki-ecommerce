## 1. Backend: atomic email view partials

- [x] 1.1 Create `resources/views/emails/parts/header.php` (logo image + height/position, tagged with `data-email-part="logo"` / `"height"` / `"position"` as applicable), table-based and inline-styled
- [x] 1.2 Create `resources/views/emails/parts/content.php` (order number, greeting, message, CTA button), tagged with the relevant `data-email-part` color attributes (text, link, button, button_bg)
- [x] 1.3 Create `resources/views/emails/parts/order-summary.php` (line items with image/name/attributes/price, subtotal/discount/total/shipping/tax breakdown), reusing `Money::prepare_amount_from_minor` formatting conventions from `app/Resources/Order/OrderResource.php`
- [x] 1.4 Create `resources/views/emails/parts/customer-note.php`, rendered only when a note is present
- [x] 1.5 Create `resources/views/emails/parts/order-details.php` (order number/date, shipping/payment method, billing/shipping addresses)
- [x] 1.6 Create `resources/views/emails/parts/footer.php` (support contact line, signature, store address)
- [x] 1.7 Manually verify each partial renders correctly at a narrow (mobile) viewport width using a raw HTML preview — deferred to end-to-end verification (8.1/8.2), see CLAUDE.md §0 (no browser-based verification by Claude in this project)
- [x] 1.8 Verify: `npm run typecheck && npm test` (from `resources/app/`)

## 2. Backend: order-confirmation template and sample data

- [x] 2.1 Create `resources/views/emails/order-confirmation.php`, composing the partials from Group 1 via `include_view()`, accepting branding settings (logo/height/position/colors) and order data as `$data`
- [x] 2.2 Add a hardcoded sample order fixture (matching the mockup: Order #10483, line items, totals, customer note, billing/shipping addresses) shaped consistently with `OrderResource`'s output fields, for use by both the preview and send-test-mail endpoints. **Correction from the task's original wording**: this is a JSON file at `resources/data/emails/order-confirmation-sample.json` (per user direction), loaded via the existing `resource_path()`/`json_decoded_data()` helpers — not a PHP array fixture.
- [x] 2.3 Verify: `npm run typecheck && npm test` (from `resources/app/`)

## 3. Backend: preview and send-test-mail endpoints

- [x] 3.1 Add a controller (e.g. `App\Http\Controllers\Api\EmailTemplateController`) with a `preview()` action: reads the saved `email` settings' `default_template`, renders `order-confirmation.php` with the sample order fixture via `view(...)->render()`, and returns the HTML. **Correction**: renders via `include_view()` + output buffering (`ob_start()`/`ob_get_clean()`), matching `EmailService::send_html_email()`'s own rendering mechanism, since the framework's `view()` object has no plain string-render entry point used elsewhere in this codebase for REST responses.
- [x] 3.2 Add a `send_test_mail()` action: accepts submitted template settings (logo/height/position/colors) via the request, sanitizes them with `Kirki\Ecommerce\Framework\Sanitizer::apply_rule()`, renders the same template with the sample order fixture, and sends it via `EmailService::send_html_email()` to the current user's account email. Implemented via a dedicated `SendTestEmailRequest` (`rules()`/`filters()`), matching `SettingsUpdateRequest`'s convention, rather than inline `Sanitizer::apply_rule()` calls.
- [x] 3.3 Register `GET /settings/email/preview` and `POST /settings/email/preview/test-mail` in `routes/api.php`, inside the existing `AuthMiddleware` settings route group
- [x] 3.4 Verify: `composer phpcs:wporg` passes on all new/changed PHP files
- [x] 3.5 Verify: `npm run typecheck && npm test` (from `resources/app/`)

## 4. Frontend: full-page route and header

- [x] 4.1 Move the `EditEmailTemplate` route entry in `resources/app/features/settings/routes.tsx` out of `SettingsLayout`'s `children` array into a top-level route sibling of `/settings`, keeping the same URL path
- [x] 4.2 Replace `edit-template.tsx`'s `SettingsPageHeader` usage with a full-page header per the mockup: back affordance to the Email settings page, icon, title "Email Template", and Discard/Save buttons, following the `page-layout-shell` heading conventions. **Correction**: no dedicated `page-layout-shell` component exists in this codebase — used `Page`/`PageHeading`/`PageContent` (`@/components/ui/page`), the actual full-page-editor convention (see `edit-inventory.tsx`).
- [x] 4.3 Update `use-edit-template.ts`: remove the `useSettingsPageActions` dependency; expose `isDirty`, `isSaving`, `onSave`, `onDiscard` directly from the form/mutation for the new header to consume
- [x] 4.4 Implement the page's own unsaved-changes guard: a React Router navigation blocker plus a `beforeunload` handler, gated on `form.formState.isDirty`, mirroring the existing shell behavior (block + shake on in-app navigation, native prompt on reload/tab-close). Implemented by calling the existing `useUnsavedNavigationGuard` hook directly (same as `edit-inventory.tsx`) — no new guard logic needed, since that hook already owns the blocker + the global `beforeunload` store.
- [x] 4.5 Verify: `npm run typecheck && npm test` (from `resources/app/`)

## 5. Frontend: live preview (fetch once, patch client-side)

- [x] 5.1 Add a preview query (e.g. `useEmailTemplatePreviewQuery`) calling `GET /settings/email/preview` once per page load (`staleTime: Infinity`, no automatic refetching)
- [x] 5.2 Build the preview iframe component that sets the fetched HTML via `iframe.srcDoc`
- [x] 5.3 Build a hook that, after the iframe's `onload` fires, subscribes to `form.watch()` and on each relevant field change queries `iframe.contentDocument.querySelectorAll('[data-email-part="..."]')` to update `.style.*` / `.src` / alignment directly (logo src/height/position, each color field)
- [x] 5.4 Wire the "Template Preview" card in `edit-template.tsx` to the iframe + patching hook, replacing the current empty `CardContent` stub
- [x] 5.5 Verify: `npm run typecheck && npm test` (from `resources/app/`)

## 6. Frontend: Send Test Mail

- [x] 6.1 Add a mutation calling `POST /settings/email/preview/test-mail` with the current (possibly unsaved) form values
- [x] 6.2 Wire the "Send Test Mail" action next to "Template Preview" per the mockup, with loading state and success/error toast feedback (also fixed the pre-existing "Send Text Mail" label typo)
- [x] 6.3 Verify: `npm run typecheck && npm test` (from `resources/app/`)

## 7. Documentation

- [x] 7.1 Add `docs/email-template.md` documenting the branding editor, the atomic email partial structure and how to reuse it for a new transactional email, and the preview/send-test-mail endpoints, following the `docs/cache.md` structure (table of contents, quick start first, numbered `## N. Topic` sections). **Correction**: `docs/cache.md` does not exist in this repo — followed `docs/settings-search.md`'s structure instead, which matches the same described convention.
- [x] 7.2 Verify: `npm run typecheck && npm test` (from `resources/app/`)

## 8. End-to-end verification

- [x] 8.1 Manually send a test mail to at least two real inbox providers (e.g. Gmail and Outlook) and confirm layout integrity, including at mobile width — **left for the user**: CLAUDE.md §0 bans browser/preview-based verification by Claude in this project; needs a real mailbox and a human eye on rendering anyway
- [x] 8.2 Manually exercise the full-page editor: edit each field, confirm the preview updates instantly with no additional network requests (verify via browser devtools network tab), save, discard, and confirm the unsaved-changes guard blocks navigation and warns on reload — **left for the user**, same reason
- [x] 8.3 Verify: `composer phpcs:wporg` and `npm run typecheck && npm test` (from `resources/app/`) both pass on the full diff
