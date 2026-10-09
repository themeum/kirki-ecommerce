## Context

See proposal.md for why the field goes. Relevant current state:

- `kirki_ecommerce_products.llm_instructions` is `text NULL`, with no index or foreign key, so dropping it from the create migration needs no other key changes.
- The value travels through the usual product write path: request rule and sanitizer, DTO, `$fillable`, `DuplicateProductAction`, and back out through `ProductResource`. No service, view, shortcode, or front-end component reads it.
- On the front end it is a field in `ProductSeoFormSchema` and in the product payload transform. Its only editor, `aeo.tsx`, has had no importer since the tab was removed from `seo-settings.tsx`.
- The `product-seo-card` spec still describes the AEO and Schema tabs, which `480ff712` removed from the UI.
- Since `squash-migrations-into-create-tables`, pre-release schema changes edit the table's create migration directly (`schema-upgrade-migrations`).

## Goals / Non-Goals

**Goals:**

- No layer creates, accepts, stores, copies, or returns `llm_instructions` after the change.
- `product-seo-card` describes the two-tab card that ships.

**Non-Goals:**

- Changing `schema_id` or schema profiles. The column, the form field, the payload key, and the Settings screen all stay; only the spec text for the removed product-form Schema tab goes.
- Introducing any replacement AI or LLM feature.
- Adding an alter migration or an upgrade path for existing pre-release installs.

## Decisions

**Edit `CreateProductsTable` instead of adding an alter migration.** The pre-release policy forbids alter migrations before the first stable release. Alternative considered: `AlterProductsDropLlmInstructions`. Rejected for the same reason `remove-product-currency-id` rejected its alter migration.

**Remove the request rule and sanitizer, with no deprecation window.** Once the rule is gone, a client that still sends `llm_instructions` has it dropped silently instead of getting an error. That matches how the API already treats unknown keys. Alternative considered: keep accepting the key and ignore it for a release. Rejected: the plugin is pre-1.0 and nothing outside the plugin is known to send it.

**Delete `aeo.tsx` rather than leaving it.** It is already dead code. After this change it would also bind to a form field that no longer exists, which TypeScript would not catch because `TextareaField` takes `name` as a string.

**Rename the tab requirement instead of only modifying it.** The header "Card presents four tabbed sections" would be wrong under the new content, so the delta renames it to "Card presents two tabbed sections" and then modifies it under the new name.

**Update the spec's Purpose by hand during sync.** Delta specs cannot change an existing capability's Purpose. The current line mentions "LLM instructions" and "structured-data schema profiles", so it is edited directly in `openspec/specs/product-seo-card/spec.md` when the delta is synced.

## Risks / Trade-offs

- [An external client reads `llm_instructions` from the product response] → Unavoidable for a removal. Called out as **BREAKING** in the proposal, at pre-1.0.
- [A test fixture or typed object literal still carries the key] → The product form test fixtures do (two places). `npm run typecheck` flags excess keys in typed literals, and the grep in task 1.1 covers the rest.
- [Removing Schema tab requirements hides a real regression, if the tab was removed by mistake] → The user confirmed that `480ff712` removed it on purpose ("remove the schema settings from the product"), and `schema_id` is still saved, so no data is lost.

## Migration Plan

1. Build the schema from scratch and confirm `kirki_ecommerce_products` has no `llm_instructions` column.
2. Run the product create, update, duplicate, and read tests, and confirm none of them sends or receives the key.

Rollback: reinstall the previous build fresh. Stored values are not recovered, and nothing ever read them.
