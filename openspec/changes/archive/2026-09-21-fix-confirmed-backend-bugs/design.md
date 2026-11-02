## Context

See proposal.md for why. Requirements are in the seven delta specs under `specs/`. Facts that shape the fixes:

- The PayPal webhook route (`POST /payment/webhook/{provider_id}`) is deliberately public, as PayPal must reach it. `PayPal::webhook()` decodes the body and acts on it with no check. A `Webhook ID` admin field already exists, is marked required, and is not used anywhere.
- `DTO::from_array()` copies only properties that exist on the DTO class. A filter object of the wrong type therefore drops fields silently instead of failing. `ListFilterDTO` has no `country` or `city`.
- `Model::update()` fills and saves the same instance, so after an update the model already holds the new values.
- The admin currency page saves the whole list in one `PUT`, sending the new base as `is_base: true` and every other row as `false`. 
- Five other places use `DB::rollback()`; only two use the non-existent `DB::roll_back()`.
- The frontend `npm run typecheck && npm test` step in this repo's task rules does not apply: no frontend code changes. PHP equivalents replace it, as in the docblock change.

## Goals / Non-Goals

**Goals:**
- Fix the six confirmed defects with the smallest change each, with a test for each.
- Keep the six fixes independent so they can be built in parallel.

**Non-Goals:**
- The `/test` route and the failed-payment redirect to the success page.
- The other items in the archived `findings.md`.
- Any frontend change, migration, or new setting.
- Making PayPal verification work without a Webhook ID.
- Deleting or deactivating the base currency; those paths are not touched.
- Refreshing exchange rates when the base changes (dropped for now; see decision 3).
- Fixing `VariantService::bulk_update` throwing for a missing `id` while a transaction is open (the connection closing at request end rolls it back; noted, not changed).

## Decisions

**1. PayPal webhook: verify through PayPal's `verify-webhook-signature` API, fail closed.** Inside `PayPal::webhook()`, before the event switch, read the five `PAYPAL-*` transmission headers with `Superglobals::server()`, then call `POST {base}/v1/notifications/verify-webhook-signature` with the headers, the configured `webhook_id` and the event, using the existing access-token flow. The event is embedded as the raw request body, not a decoded copy: re-encoding can change what PayPal signed (an empty object becomes an empty array, number formatting can shift), so the body is first checked to be valid JSON and then inserted verbatim. Anything other than `verification_status: SUCCESS`, a missing header, an empty Webhook ID, or a failed call returns `false`, which the controller already turns into a 400. The event handlers stay untouched.
  Alternatives: verifying the certificate and RSA signature locally (rejected, much more code and cert caching for no benefit); re-fetching the capture from PayPal by ID (needs no Webhook ID, but only covers some events, kept as possible defense-in-depth later); leaving the route open (rejected, it is the bug).
  Consequence: stores must fill in the Webhook ID they were already asked for.

**2. Customer delete-all: use `CustomerListFilterDTO`.** One-line change in `CustomerController`, matching what `index` already does. Alternative of type-hinting `CustomerService::delete_all` so a wrong DTO fails loudly was left out to keep the change to what was asked; the test covers the regression.

**3. Base currency: the server enforces one base; the rate sync is dropped for now.**
  *Enforcing one base.* In `CurrencyService::update()`, read `$was_base = $currency->is_base` before saving. When the request sets `is_base` true and the currency was not base, demote every other currency and save the new base in one transaction, so a failed save never leaves zero bases. When the request sets `is_base` false on the current base, ignore that flag and keep it as base; a later row in the same batch that sets another currency as base then demotes it. The outcome therefore no longer depends on row order, and the frontend's whole-list request keeps working unchanged. `create()` gets the same demotion when a new currency is created as base.
  *Sync removed.* The `if ($data->is_base && !$currency->is_base) { CurrencyExchange::sync(); }` block never fired, because `Model::update()` had already changed the model. It has been deleted (already done in the working tree), leaving the now-unused `CurrencyExchange` import to remove. Rates are refreshed by the existing "Sync now", as the multi-currency spec describes.
  *If a sync is wanted later,* do it once after the whole list is saved, not inside `update()`: the frontend resends every row with its old `exchange_rate`, so a mid-batch sync is overwritten by rows saved after it. A service method that compares the base before and after, skips when no provider is configured and ignores failures, called once from `CurrencyController::update`, would do it.
  *Alternatives for one base:* a database unique constraint on the flag (rejected, MySQL cannot express "only one true" portably); routing changes through the existing `set_base()` (rejected, it is not transactional and only onboarding uses it).

**4. Rollback: rename the two calls to `DB::rollback()`, and give the bulk-update failure a 404.** The rename alone made the failure roll back correctly, but the response was still HTTP 500, because `VariantService::bulk_update` threw `NotFoundException` with no status code and the exception handler maps code 0 to 500. The spec requires a client error, so the throw now passes `Response::NOT_FOUND`, as the sibling `update()` method already does.

**5. Currency settings response: add the missing `break` in `SettingResource::to_array()`.**

**6. Guest-order merge: use `$user->get_last_name()`.** One line in `OrderService::merge_guest_orders`.

**7. Product list price: pick the variant with the lowest effective price.** Add a small protected method in `ProductListResource` that returns that variant, and read regular price, sale price and "on sale" from it, using the storefront's rule (`sale > 0 && sale < regular`). This replaces the two independent `min()` calls, which return `null` whenever any variant lacks a sale price (`min(null, 5)` is `null` in PHP). Alternatives: filter nulls before `min()` (rejected: it can show a sale price higher than the regular one). Behavior for a product with no variants is left as it is today.

**8. Orchestration.** The six fixes touch disjoint files, so apply can run them as parallel sub-agents, one per task group, with a serial gate at the end.

**9. Tests.** Unit tests where the class runs in the lightweight container (the product-list variant choice, using the `CartResourceCouponFormattingTest` style). Integration tests (WordPress test environment) for the API-level behavior: customer delete-all filters, bulk variant failure, settings response, currency base enforcement, guest-order merge, and webhook rejection. New or changed methods get docblocks that pass `composer phpcs:docblocks`.

## Risks / Trade-offs

- [Stores with PayPal enabled but an empty or wrong Webhook ID stop capturing and marking orders paid] → PayPal has no buyer-return capture: the only capture (`CHECKOUT.ORDER.APPROVED`) and the only paid marking (`PAYMENT.CAPTURE.COMPLETED`) come from webhooks. A working store already has a webhook created in PayPal, so it has an ID, but it may not have typed it into the field. Confirm the field is filled on every store with PayPal enabled before release, and say so in the release note.
- [Stored exchange rates stay relative to the old base after a base change until someone syncs] → accepted for now; the existing "Sync now" and "Last synced" indicator remain.
- [A request that clears the only base flag is silently ignored, not rejected] → intended, so the frontend's whole-list request works in any row order; the response shows the base still flagged.
- [Integration tests need the WordPress test environment and may not run locally] → say so plainly if they were not run; unit tests and phpcs always run.
- [Verification call adds latency to each webhook] → acceptable; PayPal retries on failure.

## Migration Plan

No data migration. Before release, make sure each store with PayPal enabled has its Webhook ID filled in. Rollback is `git revert`.

## Open Questions

None. The earlier question (does capture survive a rejected webhook?) is answered by task 1.4: it does not, because capture only happens through webhooks; genuine webhooks pass verification, so nothing genuine is lost, but a missing Webhook ID now blocks capture entirely (see Risks).
