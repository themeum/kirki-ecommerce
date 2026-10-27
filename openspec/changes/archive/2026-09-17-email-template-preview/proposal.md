## Why

The "Edit Email Template" page (`/settings/email/edit-template`) has a working left-hand form (logo, colors) but its right-hand "Template Preview" panel is an empty stub — merchants have no way to see what their branding actually looks like on a real transactional email before saving. There is also no backend infrastructure yet for rendering a transactional email as reusable, email-client-safe HTML at all; the only existing email view (`emails/email-verification.php`) is a one-off, non-componentized template. This change completes the page to match the provided design and builds the underlying atomic email-rendering system it depends on.

## What Changes

- Complete `edit-template.tsx`: replace the empty preview stub with a live order-confirmation email preview, add a full-page header (back arrow, title, Discard, Save) matching the design, and add a "Send Test Mail" action.
- **BREAKING** (scoped, intentional): move the edit-template route out of `SettingsLayout`'s shared shell so it renders as a full page with no sidebar and no shared floating Save/Discard bar, while keeping its existing URL (`/settings/email/edit-template`).
- Add a new `resources/views/emails/` template set: an `order-confirmation` email composed from reusable, table-based, responsive atomic partials (header/logo, greeting content, order summary with line items and totals, customer note, order details with addresses, footer), built to be reused by future transactional email templates.
- Add a preview-rendering API that renders the order-confirmation template once (using saved email-template settings + a hardcoded sample order) and returns HTML annotated with inert `data-email-part` attributes, so the frontend can live-patch colors/logo/height/position via direct DOM mutation with zero additional API calls after the initial load.
- Add a send-test-mail API that renders the same template with the merchant's current (possibly unsaved) form values and sends it to their own address via the existing `EmailService::send_html_email()`.

## Capabilities

### New Capabilities
- `email-template-live-preview`: the frontend full-page email template editor — its own header/Save/Discard, the live preview iframe, the fetch-once-then-DOM-patch mechanism keyed by `data-email-part` attributes, and the Send Test Mail action.
- `transactional-email-templates`: the backend atomic, reusable, email-client-responsive PHP view partials for transactional emails, plus the preview-HTML and send-test-mail rendering endpoints that both consume them through one literal-inline-style render path.

### Modified Capabilities
- `settings-navigation-shell`: carve out an exception to "every route under `/settings` SHALL render inside a shared settings shell, including drill-down pages" for designated full-page editor routes (specifically the email template editor), which render standalone with no sidebar.
- `settings-page-actions`: carve out an exception to "an individual settings page SHALL NOT render its own top-level header or its own Save/Discard buttons" for the same designated full-page editor routes, which publish no actions to the shared floating bar and instead own their header's Save/Discard directly.

## Impact

- Frontend: `resources/app/features/settings/email/pages/edit-template.tsx`, `resources/app/features/settings/email/hooks/use-edit-template.ts`, `resources/app/features/settings/routes.tsx` (route moved out of the `SettingsLayout` children array), a new preview iframe/DOM-patching hook, a new service for the preview/test-mail endpoints. No changes to `EmailTemplateFormSchema` or the existing Logo/Colors form fields.
- Backend: new `resources/views/emails/order-confirmation.php` plus atomic partials under `resources/views/emails/parts/` (naming TBD in design), a new controller (e.g. `EmailTemplateController`) and two new routes under `routes/api.php`'s existing `AuthMiddleware` settings group, a hardcoded sample-order fixture for preview/test-mail data. Reuses `Money::prepare_amount_from_minor`/`prepare_amount_object_from_minor` formatting conventions and `EmailService::send_html_email()`. No changes to `SendNotificationEmail`/`OrderShipped` — real order-lifecycle sending stays out of scope.
