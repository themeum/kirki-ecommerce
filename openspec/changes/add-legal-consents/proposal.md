## Why

The Settings sidebar advertises a **Legal** section, but it is a placeholder — its nav item links to `/settings/advanced`, and no Legal route, page, or backend exists. A merchant who needs shoppers to accept terms before ordering, or to offer a marketing opt-in, has nowhere to configure it.

The nearest existing thing is worse than nothing: four keys in the **checkout** settings group (`is_terms_and_conditions_visible`, `terms_and_conditions_content`, and the privacy pair) are validated, sanitized, seeded, and read by no storefront code. They are write-only settings that look configurable and do nothing. This change builds the real capability — consents that a merchant defines once and that actually render and gate the customer-facing flows.

## What Changes

- **New `legal` settings group.** A `legal` option blob holding `{ consents: [{ id, title, locations[], message, method, is_enabled }] }`, served by the existing generic `GET /settings/{key}` and `PUT /settings` endpoints. No new table, no new controller.
- **New Settings > Legal page.** Lists consents with per-row hover actions (enable/disable, edit, delete), an empty state, and an "Add" dialog for creating and editing. Every action persists immediately — this page has no floating Save/Discard bar.
- **Consent messages carry page tokens.** A merchant writes `{privacy_policy}` in the message and it renders as a link to the WP page with slug `privacy-policy`. The dialog has a page picker that inserts the token at the cursor.
- **Three display locations, three consent methods.** Locations: signup, login, checkout. Methods: mandatory checkbox (blocks submission), optional checkbox (renders, accepted, not persisted), display text only.
- **Storefront rendering and enforcement.** Consents render at checkout and on WordPress's own login and registration forms, with server-side enforcement in both paths.
- **Nav item fix.** The Legal sidebar entry navigates to the Legal page instead of the Advanced page.
- **Documented gap:** no per-customer or per-order record of acceptance is stored. Mandatory consents are enforced as a precondition; nothing is written to an audit trail. This is deliberate scope for this change and must be stated plainly in the docs, because it is what a reader will otherwise assume they have.

Not breaking. The four dead checkout legal keys are left untouched — whether this capability supersedes them is a separate decision.

## Capabilities

### New Capabilities

- `legal-consents`: What a consent is, where it can appear, how its message and page tokens render, how each consent method behaves at the point of submission, and what is and is not recorded when a shopper accepts one.

### Modified Capabilities

- `settings-navigation-shell`: The existing "Every settings section is reachable from the sidebar" requirement is currently violated — the Legal entry navigates, but to the Advanced page, so selecting Legal silently shows unrelated settings. The requirement gains a scenario pinning each sidebar entry to *its own* page, and Legal moves from placeholder to a real page.

## Impact

**Backend (PHP)**

- New: `app/Settings/LegalSettings.php`, `app/Services/LegalConsentService.php`, `app/Constants/ConsentLocations.php`, `app/Constants/ConsentMethods.php`, `resources/data/settings/legal.json`, four hook classes under `app/Hooks/`.
- Modified: `app/Constants/OptionKeys.php`, `app/Settings/SettingsFactory.php`, `app/Http/Requests/Settings/SettingsUpdateRequest.php`, `app/Resources/SettingResource.php`, `app/Http/Requests/Order/OrderCreateRequest.php`, `app/Http/Controllers/Site/SiteController.php`, `app/Hooks/Filters/PageInlineScript.php`, `config/hooks.php`, `app/Services/PageService.php`.

**Storefront**

- New: `resources/views/site/checkout/parts/consents.php`, consent styles in `resources/site/scss/`.
- Modified: `resources/views/site/checkout.php`, `resources/site/ts/components/checkout.ts`, `resources/site/ts/types.ts`.

**Admin (React)**

- New feature folder `resources/app/features/settings/legal/` (page, dialog, bespoke message field, token helper, schemas, skeleton, tests).
- Modified registrations: `config/route-config.ts`, `features/settings/routes.tsx`, `features/settings/lib/utils.tsx`, `features/settings/index.ts`, `schemas/catalog/settings.ts` (`SettingsSchemaMap` 8 → 9), `services/settings.ts` (`SettingsPayloadMap` 7 → 8), `scripts/build-settings-search-index.mjs`.

**Risk concentrated in two places.** The `authenticate` filter on wp-login.php over-fires — wrong priority or missing guards breaks REST application passwords and misreports bad passwords as consent failures. And `OrderCreateRequest` is shared by admin and storefront order creation, so consent enforcement must be bypassed for admin-created orders.

**Cross-cutting:** `wp-org-required-standards` applies to all new PHP (escaping, sanitization, ABSPATH guards, i18n) but gains no new requirement — the existing ones already cover it.

**Docs:** new `docs/legal-consents.md`.
