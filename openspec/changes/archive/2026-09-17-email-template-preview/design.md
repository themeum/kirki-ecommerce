## Context

See proposal.md - Why. Key constraints established during exploration:

- `EmailTemplateFormSchema` (logo, height, position, colors.*) is the only dynamic content this page edits; everything else in the mockup is fixed sample content.
- `view()`/`include_view()` (vendor/libraries/framework's `TemplateEngine::resolve_path()` + `Application::view_path()`) resolve every dot-path against one hardcoded root, default `resources/views/`, with a `realpath()` containment check that rejects anything outside it. There is no namespace/multi-root mechanism, and `vendor/libraries/framework/` may not be modified. New view partials therefore live under `resources/views/emails/`.
- `EditTemplate` is currently a child route of `SettingsLayout` (`resources/app/features/settings/routes.tsx`), inheriting the shell's sidebar, 600px-capped content pane, and floating Save/Discard bar via `useSettingsPageActions`. `openspec/specs/settings-navigation-shell/spec.md` and `openspec/specs/settings-page-actions/spec.md` currently name the email template editor explicitly as a shell-rendered drill-down page — this change's spec deltas carve out a "full-page editor" exception in both.
- No iframe/srcDoc/server-rendered-preview pattern exists anywhere in `resources/app/`. Existing "preview" components (coupon-preview.tsx, shipping-box-preview, SEO previews) are pure client-side React re-renders of form state — not applicable here since the preview must be genuinely emailable, table-based, inline-styled markup.
- `app/Services/EmailService.php::send_html_email()` and `resources/views/emails/email-verification.php` are the only existing email-sending/view precedent. `app/Resources/Order/OrderResource.php` and the `Money` facade (`Money::prepare_amount_from_minor`/`prepare_amount_object_from_minor`) are the existing conventions for formatting order line items and totals.

## Goals / Non-Goals

**Goals:**
- Ship atomic, table-based, inline-styled, responsive email view partials (header, content, order summary, customer note, order details, footer) that any future transactional email template can reuse as-is.
- One backend render path used identically by preview and Send Test Mail — no CSS-variable mode, no preview-only template branching.
- Exactly one preview HTTP request per page load; every subsequent branding edit updates the already-rendered preview via direct DOM mutation.
- Full-page editor with its own header (back, icon, title, Discard, Save) and its own unsaved-changes protection, replacing what it previously inherited from `SettingsLayout`.

**Non-Goals:**
- Wiring the order-confirmation email into real order-lifecycle sending (`SendNotificationEmail`/`OrderShipped` stays a stub). Preview and Send Test Mail only.
- Any change to `EmailTemplateFormSchema`, the existing Logo/Colors form fields, or `useEditTemplate`'s load/save logic beyond removing its dependency on `useSettingsPageActions`.
- A general-purpose multi-template "email template library" UI — only the order-confirmation template is built now; the partials are structured for reuse, but no second template consumes them yet.
- CSS-variable-driven or otherwise dynamically-themed live email HTML that could ever be sent to a real inbox — literal inline styles only.

## Decisions

### 1. Live preview via fetch-once + `data-email-part`-keyed DOM patching, not debouncing or CSS variables

The preview endpoint renders the order-confirmation template once with literal inline styles (identical output shape to what Send Test Mail sends), additionally tagging every branding-controlled element with an inert `data-email-part="<field-path>"` attribute (e.g. `data-email-part="logo"`, `data-email-part="colors.background"`, `data-email-part="colors.button_bg"`). The frontend fetches this exactly once on mount and assigns it to `iframe.srcDoc`. A hook subscribes to `form.watch()` and, on each relevant field change, queries `iframe.contentDocument.querySelectorAll('[data-email-part="..."]')` and mutates `.style.*` / `.src` / alignment directly — no refetch, ever, after the initial load.

**Alternatives considered:**
- *Debounce + react-query cache*: simplest, matches every other data-fetching pattern in this codebase, but still issues a network request per settled edit, not "zero calls" as decided with the user.
- *CSS custom properties, patched via `:root` variables*: would let the preview react to edits without touching individual elements, but real email clients don't reliably support `var()`, so the templates would need a second preview-only render mode diverging from what's actually sent — rejected because it fragments the "one render path" goal and adds untested surface to the atomic partials.
- *Full client-side React reproduction of the email layout* (like `coupon-preview.tsx`): would need to duplicate the PHP partials' markup/spacing decisions in TSX and keep the two in sync by hand — rejected, defeats the point of building reusable server-side atomic partials.

### 2. Preview and Send Test Mail share one controller and one render path

Both endpoints call the same template-rendering code with different data sources: preview reads the merchant's saved `email` settings; Send Test Mail accepts the submitted (possibly unsaved) form payload. Both pass the same hardcoded sample order fixture and produce byte-identical markup shape (`data-email-part` attributes included — they're inert in a real inbox). This avoids maintaining a second "production-safe" rendering variant.

### 3. Full-page editor is a router-level exception, not a shell feature flag

`EditTemplate`'s route entry moves out of `SettingsLayout`'s `children` array to a top-level route sibling of `/settings`, keeping the same URL path (`/settings/email/edit-template`). It no longer calls `useSettingsPageActions`; its own header owns Save/Discard directly from the form's `formState`. This was chosen over moving the page to a URL outside `/settings` (rejected: would change merchant-facing URLs/bookmarks and the breadcrumb back-link target for no functional benefit) and over adding a shell "full-page mode" flag to `SettingsLayout` itself (rejected: `SettingsLayout`'s sidebar/content-pane/floating-bar composition has no partial-opt-out today, and inventing one for a single page is more machinery than just routing the page outside it).

### 4. Full-page editor reimplements its own unsaved-changes guard

Since the page no longer publishes to `SettingsLayout`'s shared floating-bar mechanism (which currently backs the in-app-navigation block and reload/tab-close warning), it needs its own equivalent: a `beforeunload` handler plus an in-app navigation blocker (React Router's blocker API), gated on the form's dirty state, mirroring the existing shell behavior described in `settings-page-actions`'s "Unsaved changes block in-app navigation" / "warn on reload and tab close" requirements. This was a user decision (keep the protection) rather than accepting the regression.

### 5. Sample order data is a hardcoded PHP fixture, not a real queried order

The preview and test-mail endpoints pass a fixed sample order array (matching the mockup: Order #10483, sample line items, addresses, totals) shaped consistently with `OrderResource`'s output conventions (so a future change wiring in a real order can swap the data source without touching the partials), but it is never loaded from the database. This keeps the settings page independent of any specific store order and avoids needing order-read authorization logic in a settings-only screen.

## Risks / Trade-offs

- **[Risk]** Email-client HTML rendering is notoriously inconsistent (Outlook's Word engine, Gmail's CSS stripping, mobile client quirks) → **Mitigation**: partials use table-based layout and inline styles exclusively, matching the one existing precedent (`email-verification.php`); manual test-mail sends to at least Gmail and Outlook should be part of verification, not just the in-app preview.
- **[Risk]** `data-email-part` attributes are a new, undocumented convention with no prior art in this codebase → **Mitigation**: keep the attribute vocabulary small and directly mirrored to `EmailTemplateFormSchema`'s field paths so it's self-describing; document it inline in the preview-patching hook.
- **[Risk]** Reimplementing unsaved-changes protection outside the shared shell mechanism risks subtly diverging behavior (e.g. shake animation, exact block conditions) → **Mitigation**: the added spec requirement mirrors the existing shell scenarios' wording closely; reuse the shell's existing blocker/`beforeunload` logic as a shared hook if it is already factored that way, rather than reimplementing from scratch (check `useSettingsPageActions`'s internals before writing new code).
- **[Trade-off]** Building genuinely reusable atomic partials for a single consuming template (order-confirmation) is more upfront work than a one-off template, in exchange for no rework when the next transactional email (shipped, refunded, etc.) is built later.

## Open Questions

- Exact DOM structure/selector granularity for `data-email-part` on multi-element concerns (e.g. does `colors.text` tag every text-colored element individually, or a single wrapping container relying on inheritance?) — can be resolved during implementation without affecting the spec or task breakdown.
