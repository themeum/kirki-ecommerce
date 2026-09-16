## Context

See proposal.md — Why. The constraints that shape the approach, all verified against the code:

- **Settings storage is option blobs.** `AppSettings::set()` does `array_merge($this->to_array(), $value)` — shallow. A nested list is replaced wholesale, never merged element-by-element. `SettingsController` is generic and key-driven; a new group needs a constant, a settings class, a defaults JSON, a `SettingsFactory` case, and validation arms — no new controller or route.
- **Sanitization is subtractive.** `Request::resolve_validation_and_sanitization()` merges only the paths that had a `filters()` entry, and `merge()` is a top-level `array_merge`. A field with a validation rule but no filter rule is **silently dropped before storage**. This single fact drives several decisions below.
- **The plugin owns no auth pages.** `Url::get_login_url()` returns `wp_login_url()`. There is no register route, no `RegisterRequest`, and no hook into `login_form`/`register_form`. `resources/site/scss/pages/_auth.scss` styles `.kecom-auth-*` classes that no markup uses — auth views were planned and never built. Checkout is the only one of the three locations with a form we own.
- **No token engine exists.** The seeded checkout copy contains `[site_name]`, which nothing expands. There is no `Placeholder`/`Token`/shortcode-expansion class; the only `preg_replace_callback` in the plugin rewrites SVG attributes.
- **`OrderCreateRequest` is shared.** Both admin `OrderController::store` and storefront `Api\Site\CheckoutController::store` type-hint it. `prepare_for_validation()` merges `is_manual`, which is `true` for admin-created orders.
- **Two frontends.** Admin is React 19; the storefront is PHP views + Alpine.js 3. They share nothing but the REST API.

## Goals / Non-Goals

**Goals:**

- One place a consent is defined, three places it can be honoured, with the same message rendering identically at each.
- Server-side enforcement that does not depend on the browser having cooperated.
- A merchant-legible message format — a merchant should be able to read a consent message and know what it says without previewing it.
- Silent data loss made structurally impossible, not merely avoided by care.

**Non-Goals:**

- Any audit trail, consent versioning, re-consent prompting, or per-customer export. Enforcement only — see the spec requirement that makes this explicit.
- Replacing or migrating the four dead `checkout.*terms*`/`*privacy*` keys. They stay untouched.
- Building plugin-owned login/registration pages. We attach to WordPress's forms instead.
- Rich text in consent messages. Plain text plus page tokens, deliberately.

## Decisions

### Store consents as an option blob rather than a table

A table is what this codebase gives list entities that need IDs, pagination, bulk actions, and foreign keys (`currencies`, `tax_profiles`, `shipping_boxes`). Consents need none of those — the list is short, unpaginated, and read as a whole on every render. Config-shaped repeatables already live in option blobs here: `tax.tax_regions` nests regions → states → rules, and `shipping.shipping_zones` nests zones → methods → ranges.

*Alternative considered:* a `consents` table. Rejected as premature — it buys ordering columns and FK-ready IDs we don't need, and costs a migration, model, service, controller, resource and route. Worth revisiting only if acceptance recording lands, since records genuinely do need a FK.

**Consequence we design around, not against:** the shallow `array_merge` means every write is a full-array PUT. So IDs are client-generated at creation and stable thereafter, and the admin page holds the list in local state and sends the whole thing. Two admins editing simultaneously will clobber each other — acceptable for a settings screen a single merchant edits occasionally, and no worse than the existing tax and shipping screens.

### Order the sanitizer filters so the array survives

`'data.consents' => Sanitizer::ARRAY` must be the **first** entry in `get_legal_settings_filters()`. `Sanitizer::apply_rule($value, ARRAY)` passes arrays through untouched, seeding the whole subtree; the leaf rules then overwrite individual leaves. A leaf rule placed before the ARRAY rule gets clobbered.

Every consent field gets a filter entry — not as diligence, but because the framework drops unfiltered paths. The guard against a future field being added with a rule and no filter is the round-trip integration test, which is why it is a required task rather than a nice-to-have.

### Escape first, then substitute tokens

`render_message()` runs `nl2br(esc_html($message))` and *then* `preg_replace_callback` over `/\{([a-z0-9_]+)\}/i`. `esc_html()` does not touch `{` or `}`, so tokens survive intact while every other byte is already neutralised before any HTML is spliced in.

*Alternative considered:* substitute first, then escape the non-token segments. Rejected — it requires tracking which chunks are merchant text and which are generated markup, and a missed chunk is an XSS hole. Escaping the whole string up front makes that class of bug unreachable.

The service returns a string and never echoes, so `WordPress.Security.EscapeOutput` never fires inside it; views echo through `wp_kses_post()`, which is on the sniff's recognised-escaper list and whose allowlist covers `<a href target rel>` and `<br>`.

### Slug-based tokens, resolved at render

`{privacy_policy}` ↔ slug `privacy-policy`. Readable in the textarea, which matters because the merchant is writing legal copy and needs to see what it says.

*Alternative considered:* `{page:123}`, which survives renames. Rejected on legibility — a message reading "you agree to our {page:123}" cannot be reviewed without previewing. *Also considered:* slug shown, ID persisted underneath. Rejected as disproportionate — it needs a token↔id reconciliation layer on every save and read.

The accepted cost is that renaming a page's permalink breaks its token. Mitigated by degrading to humanised text (`Privacy Policy`) rather than a broken link or a leaked `{token}`, and by documenting it.

**Lockstep constraint:** the picker offers only published pages and the resolver matches only published pages. If either side changes, both change — otherwise the picker offers tokens that render as plain text.

**Batching:** collect every token across every consent for the location in one `preg_match_all` pass, then resolve all slugs in a single query. Per-token lookups would make three consents with two tokens each into six queries on every checkout render.

### Immediate persistence, no floating save bar

Every action commits on the spot. The mixed alternative — dialog persists, row actions stage — is how merchants lose edits, and staging everything would force the dialog's "Save changes" button to be relabelled because it wouldn't save anything. Immediate persistence also matches the list-shaped settings sections that already exist (shipping boxes, tax profiles, currencies).

**The commit function must take an updater and read previous state from a ref, not close over the rendered value.** The delete flow's `onSuccess` fires up to five seconds after the toast appears, inside the undo window. A commit closing over the `consents` value would write back a stale array and resurrect anything toggled in between. `shipping-box.tsx` escapes this only because its source of truth is the server query rather than local state; ours is local, so the ref is mandatory.

### A closure rule, not `required_if`, for checkout enforcement

Only a non-wildcard closure rule is evaluated when the key is absent from the payload — `Validator::validate_rules()` applies every rule after a `deep_get`, and only nullable/sometimes rules short-circuit. A wildcard rule would not fire at all on an empty branch, which is the trap the existing shipping rules already carry a comment about. The closure means an older cached storefront bundle that doesn't send `consents` is still rejected rather than waved through.

The closure opens with `if (!empty($data['is_manual'])) { return true; }`. That guard is the only thing keeping admin order creation working, and it gets its own regression test.

### Hook WordPress's own auth forms

`register_form` + `registration_errors` and `login_form` + `authenticate`. No new pages, works today, and the alternative — building the auth views `_auth.scss` was written for — is a whole feature that belongs in its own change.

**`authenticate` needs priority 30 and three guards.** It is one of the most over-fired filters in WordPress. At the default priority 10 it would run before `wp_authenticate_username_password` (priority 20), so a shopper with a wrong password who also missed the checkbox would be told to accept the terms. And without bailing on `is_wp_error($user) || !($user instanceof WP_User)` and on the absence of a posted `log` field, the filter would fire on REST application passwords, XML-RPC, and `wp_signon()` after registration — locking people out of the API. The `log` check is what confines it to the login form.

`wp_enqueue_scripts` does not fire on wp-login.php, so the render hooks emit a small inline `<style>` rather than depending on the site bundle.

### Three boolean fields in the form, one array on the wire

`CheckboxField` binds a boolean and there is no multi-checkbox field component in the design system. So the form models `show_on_signup` / `show_on_login` / `show_on_checkout`, a `.superRefine` enforces at least one, and the `.transform()` flattens to `locations[]`. `getShape` in `libs/zod.ts` recurses `ZodEffects`, so `prepareFormSchema(...).superRefine(...).transform(...)` still yields correct defaults.

*Alternative considered:* build a reusable `CheckboxGroupField`. Rejected for this change — a single-use abstraction, and the flattening transform is the part worth testing anyway.

### A bespoke message field, forced into a specific folder

`components/form/textarea-field.tsx` exposes no ref, no children, and no adornment slot, so the "+" inserter needs its own field component. Its location is not a preference: `eslint.config.js` bans importing `Controller` outside `components/form/**` and `features/**/components/fields/**`, and this field carries feature knowledge (its own pages query), so it belongs under `features/settings/legal/components/fields/`.

**Selection is snapshotted on every caret move, not read at insert time.** Radix moves focus when the popover opens. Browsers do preserve `selectionStart` on a blurred textarea, but depending on that across browsers is the kind of thing that works until it doesn't. A `selectionRef` starting at `null` also gives the "no cursor → append at end" behaviour for free.

The pure insertion logic lives in `lib/token-insert.ts` so it can be tested without a DOM. It clamps offsets to the value's length — a stored selection can outlive a `form.reset()` that shortened the message, and an unclamped `slice` silently mangles the string.

### `array_values()` the consents in the resource

A PHP associative array serialises to a JSON object, and the client's `z.array()` would reject it. The response also carries `is_registration_enabled`, which is the only way `users_can_register` reaches the admin without inventing an endpoint for it.

## Risks / Trade-offs

- **`authenticate` over-fires → breaks non-shopper authentication.** Highest blast radius here. → Priority 30, plus the `is_wp_error`/`WP_User` and posted-`log` guards. Covered by a spec scenario.
- **A field with a rule but no filter is silently dropped.** → Filter entries for every field, `ARRAY` first; a round-trip integration test as the standing guard.
- **`OrderCreateRequest` is shared with admin order creation.** → `is_manual` guard, with its own regression test.
- **Stale closure resurrects a deleted consent.** The 5s undo window plus local state makes this reachable, not theoretical. → Updater-form `commit` reading from a ref.
- **Concurrent admin edits clobber each other.** Inherent to the shallow `array_merge`. → Accepted; matches existing settings screens. Revisit if it bites.
- **A renamed page permalink breaks its token.** → Degrade to humanised text; document it. The merchant can see the token and fix it, which is why the readable form was chosen.
- **`pageKeys.lists()` ignores query params.** A second caller with different params would serve the wrong cached list. → Call `usePagesQuery({ status: 'publish' })` with exactly those params, with a comment at the call site.
- **`import/no-cycle` is an error.** `schemas/catalog/settings.ts` will import the legal catalog schema. → Keep that import one-directional.
- **Radix focus management fights caret restoration.** → Prevent `onCloseAutoFocus`, call `field.onChange` before `setSelectionRange`, restore in a `requestAnimationFrame`.
- **Coverage gap on registration.** `registration_errors` fires only from `register_new_user()` — multisite `wp-signup.php`, programmatic `wp_insert_user()`, and third-party registration forms bypass it entirely. → Not fixable from here; documented as a limitation.
- **"Optional checkbox" does nothing observable.** Given enforce-only scope, an optional consent renders and is discarded. A merchant may reasonably expect the marketing opt-in to go somewhere. → Stated plainly in the docs; the natural follow-up change is acceptance recording.

## Migration Plan

Additive throughout; no data migration and no rollback step. `AppSettings::refresh()` falls back to `resources/data/settings/legal.json`, so an install that has never saved Legal settings reads an empty consent list. With no consents configured, every storefront surface renders exactly as it does today — the feature is inert until a merchant creates something.

Build order is load-bearing: `useSettingsQuery('legal')` returns a 500 until `SettingsFactory` has its case, so the backend group lands before the admin page. Within the backend: constant → defaults JSON → settings class → factory case → validation arms → resource. Within the frontend: catalog schema → `SettingsSchemaMap` → barrel export → `SettingsPayloadMap` → route config → routes → nav link → search index. Storefront and wp-login hooks can proceed in parallel once `LegalConsentService` exists.

Reverting means removing the files and the registrations; a stored `kirki_ecommerce_legal` option row would be left orphaned and harmless.

## Open Questions

None blocking. One deferred decision, recorded so it is not mistaken for an oversight: whether this capability supersedes the four dead `checkout.*terms*`/`*privacy*` settings keys. They are untouched here, and answering it does not change these specs, this approach, or the task breakdown.
