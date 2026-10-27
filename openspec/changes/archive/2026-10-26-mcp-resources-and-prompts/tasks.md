## 1. Shared code

- [x] 1.1 Move `validate_arguments()`, `reject()` and `one_of_message()` from `StoreReadTool` into a new trait `app/Mcp/Concerns/ValidatesArguments.php`, and move `money_value()` into a new trait `app/Mcp/Concerns/FormatsMoney.php`. `StoreReadTool` uses both traits. Pure move, no behaviour change (design §1)
- [x] 1.2 Create `app/Mcp/Resources/StoreResource.php` (abstract, extends the scoped `Resource`): `$mime_type = 'application/json'`, `permission()` checks `manage_options`, uses `FormatsMoney` (design §1; spec mcp-store-resources "Only administrators can read a store resource")
- [x] 1.3 Create `app/Mcp/Prompts/StorePrompt.php` (abstract, extends the scoped `Prompt`): `permission()` checks `manage_options`, uses `ValidatesArguments`, and has a helper that builds the read-only rule line and a JSON tool-call line from a tool name and an argument array (design §1, §7)
- [x] 1.4 Verify: `bash kirki-ecommerce-test integration --filter='Mcp'` passes with no test change, `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/` (the 9 failures in `list-page-empty-state.test.tsx` were there before this change)

## 2. Store context resources

- [x] 2.1 Create `StoreProfileResource` (`kecom://store/profile`, audience `assistant`, priority 1) with the allow-listed fields of the spec requirement "Store profile" (design §2)
- [x] 2.2 Read `app/Listeners/Order/*` and confirm the action-to-email map of design §4. Record any difference as a "Correction during implementation" note in design.md
- [x] 2.3 Create `OrderLifecycleResource` (`kecom://store/order-lifecycle`): the matrix statuses with their actions and transitions, the action-to-email map with each template's enabled flag from `EmailSettings`, and the notes on refund statuses and `mark-as-hold` (design §4)
- [x] 2.4 Create `AnalyticsDefinitionsResource` (`kecom://store/analytics-definitions`, audience `assistant`, priority 1): the counting rules as text, and the presets, comparisons, default preset, granularity rule and `MAX_LIMIT` from the constants (design §5)
- [x] 2.5 Create `CheckoutAndPaymentsResource` (`kecom://store/checkout-and-payments`): checkout settings, the providers from `PaymentManager` with id, name, enabled and `is_offline` only, and the legal consents with text (tags removed), method, locations and enabled state (design §2)
- [x] 2.6 Create `TaxAndShippingResource` (`kecom://store/tax-and-shipping`): the tax flags, tax regions with rates, and shipping zones with regions, enabled state and methods; method amounts as money values (design §2)
- [x] 2.7 Create `CurrenciesResource` (`kecom://store/currencies`): base currency, active currencies, automatic update flag, provider name, sync times in ISO 8601 and the last sync error. No `api_configs` and no `usage` (design §2)
- [x] 2.8 Add `tests/Integration/McpStoreResourcesTest.php`: an editor is rejected and an administrator is accepted for each resource; profile reflects a changed store name; empty address gives `null` fields; lifecycle `pending` actions and a disabled "Order shipped" template; definitions presets equal `AnalyticsRangeResolver::PRESETS`; a disabled payment method is listed as disabled; a stored provider config and a stored currency API key never appear in the JSON; a store with no shipping zones; never-synced rates give `null`
- [x] 2.9 Verify: `bash kirki-ecommerce-test integration --filter='Mcp'`, `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/`

## 3. Catalog structure resource

- [x] 3.1 Create `CatalogStructureResource` (`kecom://catalog/structure`): categories with `parent_id` and product count, brands, collections and tags with product count, attributes with value names. Each list sorted by product count then name (attributes by name), cut at `LIST_LIMIT = 200`, with the shape `{items, total, is_truncated}` (design §6)
- [x] 3.2 Add tests to `McpStoreResourcesTest`: counts per category and tag; a store with more than 200 tags gives 200 items, the full total and `is_truncated` true, and keeps the tags with the most products
- [x] 3.3 Verify: `bash kirki-ecommerce-test integration --filter='Mcp'`, `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/`

## 4. Prompts

- [x] 4.1 Create `MorningBriefPrompt`: optional `date` (`Y-m-d`, not after today, default yesterday in the site time zone); calls for the sales report against the day 7 days earlier, `find-orders` for each of the 4 list statuses, and `stock-levels` with `attention`; the untrusted-text rule (design §7; spec "Routine contents")
- [x] 4.2 Create `WeeklyReviewPrompt`: optional `range` (presets other than `custom`, default `last_7`) and `compare` (`previous_period` or `previous_year`, default `previous_period`); calls for the sales report, sales trend, product performance by product and by category, and the sales breakdown by coupon and by country
- [x] 4.3 Create `MonthlyClosePrompt`: required `month` (`YYYY-MM`, not after the current month); `from` is the first day, `to` is the last day or today in the current month, with the "month is not complete" line; calls for the sales report with no comparison and the sales breakdown by tax region, payment method and shipping method with `limit` 25
- [x] 4.4 Create `LowStockCheckPrompt` (no arguments): calls for every page of `stock-levels` with `attention`, and product performance by product for `last_30` with `limit` 25; the reorder order rule
- [x] 4.5 Create `InvestigateOrderPrompt`: required `order_number` (string, 1 to 50 characters); calls for `get-order` with `order_number` and `include_activity` true; the draft-reply rule and the untrusted-text rule
- [x] 4.6 Create `SetupGuidePrompt` (no arguments): calls for `setup-status`; lists open steps in order with their admin links, or says setup is complete
- [x] 4.7 Add `tests/Integration/McpStorePromptsTest.php`: an editor is rejected for each prompt; the argument lists; the error cases (month `10/2026`, a future date, a missing order number, `range` `custom`); morning brief for `2026-10-25` names the exact sales report arguments; monthly close for the current month uses today; every message has the read-only rule; and each JSON tool-call block names a tool that `StoreServer` lists and passes that tool's validation rules (design, risk 2)
- [x] 4.8 Verify: `bash kirki-ecommerce-test integration --filter='Mcp'`, `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/`

## 5. Server, docs and final checks

- [x] 5.1 Add the 7 resources to `StoreServer::$resources` and the 6 prompts to `StoreServer::$prompts`, and update the server description (design §8)
- [x] 5.2 Extend `tests/Integration/McpServerTest.php`: the server lists 7 resources with their URIs and `application/json`, and 6 prompts with their arguments (spec mcp-server "Server offers resources and prompts")
- [x] 5.3 Update `docs/mcp.md`: add a "Resources" section (URIs, contents, what is never included) and a "Prompts" section (names, arguments, tools used, read-only rule); add to "Where this differs from the admin screens" that ChatGPT shows neither resources nor prompts and that there is no `get-store-settings` tool yet; update the table of contents
- [x] 5.4 Verify: `bash kirki-ecommerce-test integration`, `composer test:unit`, `composer phpcs:wporg`, `composer phpcs:docblocks`, `openspec validate mcp-resources-and-prompts --strict`, and `npm run typecheck && npm test` in `resources/app/`
- [x] 5.5 Manual check (by the merchant): on a site with the MCP Adapter, list the resources and prompts in a client, read each resource, and run each prompt once

## 6. Free-text prompt arguments

- [x] 6.1 Add to `StorePrompt` the parse helpers for date, month, range preset, comparison and order number, and `fallback_note()` (design §7 "Free-text arguments")
- [x] 6.2 Change `MorningBriefPrompt`, `WeeklyReviewPrompt`, `MonthlyClosePrompt` and `InvestigateOrderPrompt` to use the helpers and never throw for an argument value; make `month` optional with the last complete month as the default; give each argument description an example value; ask the merchant for a missing order number (spec "Prompt arguments accept free text and never fail the request")
- [x] 6.3 Change `tests/Integration/McpStorePromptsTest.php`: remove the error cases; add `10/2026` (fall-back with a note), `September 2026`, a future date (fall-back with a note), `yesterday`, `Last Week` → `last_7`, `last year` → `previous_year`, ` #1001 ` → `1001`, a missing order number, a missing month, and a check that a note holds the typed value only JSON-encoded
- [x] 6.4 Update `docs/mcp.md`: the prompts table (accepted forms and defaults) and the paragraph about a wrong argument
- [x] 6.5 Verify: `bash kirki-ecommerce-test integration --filter='Mcp'`, `composer phpcs:wporg`, `composer phpcs:docblocks`, and `openspec validate mcp-resources-and-prompts --strict`
