PHP test commands use the Docker runner: `bash kirki-ecommerce-test unit --filter=SslcommerzTest`.
The plugin code must stay compatible with PHP 7.4.

## 1. Plugin skeleton

- [x] 1.1 Create `payments/kirki-sslcommerz/kirki-sslcommerz.php` (`Order: 120`, text domain `kirki-ecommerce-sslcommerz`, `Requires Plugins: kirki-ecommerce`) and `composer.json` with the `Kirki\Ecommerce\Payments\` PSR-4 autoload, modelled on `kirki-bkash`
- [x] 1.2 Add `src/SslcommerzConstant.php` with the two hosts, paths, statuses, return argument values, field limits, the 30-second timeout, and the payment and refund check delays
- [x] 1.3 Add `src/Sslcommerz.php` with the provider id, admin fields (`store_id`, `store_password`, `sandbox`), `validate_settings`, and `sanitize_settings`. `store_password` uses `Sanitizer::TRIM`. State the refund IP rule in the setting description
- [x] 1.4 Add `assets/logo.svg` from the file that the user supplies. If the file is not available, leave this task open and tell the user. Do not draw or copy a substitute
- [x] 1.5 Create `tests/Unit/Payment/SslcommerzTest.php`. Test that the provider reports id `sslcommerz`, is online, declares no currency restriction, and treats a missing `sandbox` value as sandbox
- [x] 1.6 Verify: run `bash kirki-ecommerce-test unit --filter=SslcommerzTest`, then `npm run typecheck && npm test` from `resources/app/`

## 2. API client

- [x] 2.1 Add `src/SslcommerzClient.php` with `create_session`, `validate`, `query_by_tran_id`, `refund`, and `query_refund`, on the framework `Http`
- [x] 2.2 Add `SslcommerzRejectedException` and `SslcommerzUnknownResultException`, and map responses to the outcomes in design Decision 1. Test: JSON success, session `FAILED` at HTTP 200, `APIConnect` other than `DONE`, connection error, 5xx, and non-JSON body
- [x] 2.3 Test that the store password and full URLs do not appear in exception messages or log entries, for each client method
- [x] 2.4 Verify: run `bash kirki-ecommerce-test unit --filter=SslcommerzTest`, then `npm run typecheck && npm test` from `resources/app/`

## 3. Starting a payment

- [x] 3.1 Add `src/SslcommerzTransactionBuilder.php` from design Decision 11. Read `app/Supports/CountryData.php` for the country name lookup
- [x] 3.2 Implement `Sslcommerz::pay()`: check enabled and credentials before any call, generate `tran_id`, create the session, store the fields with `set_payment_metadata`, schedule the first check, and return a `REDIRECT` action. Require `SUCCESS` and an HTTPS page URL
- [x] 3.3 Test: the payload for orders with and without a shipping address, `tran_id` length and format, field cuts, return URLs and `ipn_url` on pretty and plain permalink URLs, the "Store Credential" message, a rejected session, missing credentials, and a disabled gateway
- [x] 3.4 Verify: run `bash kirki-ecommerce-test unit --filter=SslcommerzTest`, then `npm run typecheck && npm test` from `resources/app/`

## 4. Confirmation and settlement

- [x] 4.1 Implement `find_order_for_tran_id()` from design Decision 4. Test: no `-`, a non-numeric ID, an unknown order, a different stored value, and an order from another gateway. None of these makes an HTTP call
- [x] 4.2 Implement `confirm()` and the locked settlement from design Decision 5
- [x] 4.3 Implement the risk transition from design Decision 6
- [x] 4.4 Test settlement: BDT match, USD `currency_amount` match, a different amount, a different currency, the same number in another currency, `INVALID_TRANSACTION`, an API `tran_id` from another order, a repeat with the same `val_id`, a second `val_id` on a settled order, a cancelled order, a refunded order, and metadata that merges and does not replace
- [x] 4.5 Test risk: `0`, `"0"`, `1`, a missing value, and a risky payment from `pending` and from `failed_unfulfilled`. Both end in `on_hold_paid`. Record which paid emails and events fire
- [x] 4.6 Add a case to `tests/Integration/ConcurrencySafetyTest.php`: a return and an IPN settle one payment once
- [x] 4.7 Verify: run `bash kirki-ecommerce-test unit --filter=SslcommerzTest`, the new integration case, then `npm run typecheck && npm test` from `resources/app/`

## 5. Return, IPN, signature, and failures

- [x] 5.1 Implement `webhook()`, `handle_browser_return()`, `handle_ipn()`, and `handle_return()` from design Decision 3. `handle_browser_return()` catches every `Throwable`, and each path gives a 303
- [x] 5.2 Implement the `verify_sign` check from design Decision 9. Test with the official Python vector, a changed value, and a posted value with an apostrophe. A mismatch logs a warning, and the validator still decides
- [x] 5.3 Implement the failure path from design Decision 7
- [x] 5.4 Test the return: success, fail, cancel, an unknown `tran_id` with no HTTP call, a validator with no result, a forged failure on a paid order, a query that reports success, and a query with no result
- [x] 5.5 Test the IPN: success, a repeat, a forged `tran_id` gives a client error, and a non-success status does not change the order until the query confirms it
- [x] 5.6 Verify: run `bash kirki-ecommerce-test unit --filter=SslcommerzTest`, then `npm run typecheck && npm test` from `resources/app/`

## 6. Payment check job

- [x] 6.1 Add `src/SslcommerzPaymentCheckJob.php` and `Sslcommerz::run_payment_check` from design Decision 8
- [x] 6.2 Test: a settled order makes no query, a late success after the return is lost, a success in the second element, a late success on a failed order, an older `tran_id` logs and does not change the order, the five delays, the last check, and a queue error that does not stop `pay()`
- [x] 6.3 Verify: run `bash kirki-ecommerce-test unit --filter=SslcommerzTest`, then `npm run typecheck && npm test` from `resources/app/`

## 7. Refunds

- [x] 7.1 Implement `Sslcommerz::refund()` from design Decision 10. Confirm that a write to the refund row inside the core transaction is kept
- [x] 7.2 Add `src/SslcommerzRefundCheckJob.php` and `Sslcommerz::run_refund_check`, using `OrderManager::update_refund`
- [x] 7.3 Test the refund: `success` stores the reference and stays pending, a partial amount, `processing`, `failed` with `errorReason`, no clear result, a missing transaction ID, and the same `refund_trans_id` on a repeat
- [x] 7.4 Test the check: `refunded`, `cancelled`, `processing`, no result, a missing row, a row that is not pending, and the last check
- [x] 7.5 Verify: run `bash kirki-ecommerce-test unit --filter=SslcommerzTest`, then `npm run typecheck && npm test` from `resources/app/`

## 8. Docs and standards

- [x] 8.1 Write `docs/sslcommerz.md` in the structure of `docs/emails.md`: table of contents, numbered sections, quick start first, settings, payment flow, risk, refunds, troubleshooting, and "Where this differs from the official SSLCommerz plugin". State the IP registration rule, the firewall IPs, the non-BDT refund gap, the partial refund gap, the unknown refund result, and the features that this plugin does not have
- [x] 8.2 Add `SSLCommerz.yml` to `docs/ecommerce/online-payments/Install/`, `Edit/`, and `Set Enabled/`, modelled on the bKash files, with placeholder sandbox values
- [x] 8.3 Confirm that the "Other gateways: No declaration" row in `docs/payments.md` covers SSLCommerz. Change the table only if it does not (It covers SSLCommerz, so the table has no change)
- [x] 8.4 Run phpcs on the new PHP files with the Docker command and a temporary copy of the config with no `payments/*` exclude. Fix all findings
- [x] 8.5 Run `openspec validate add-sslcommerz-payment-gateway --strict`
- [x] 8.6 Verify: run the full `bash kirki-ecommerce-test unit`, then `npm run typecheck && npm test` from `resources/app/`

## 9. Sandbox and go-live checks (manual, with SSLCommerz credentials)

- [ ] 9.1 In a private sandbox store, run success, success with risk, failure, and a cancel in a browser. Confirm that a cancel return arrives as expected. Record each difference as a "Correction during implementation" note in `design.md`
- [ ] 9.2 Capture one real IPN through a tunnel, with its `verify_sign` result
- [ ] 9.3 Run a BDT and a USD validation, and a query for an unknown `tran_id`. Change the failure rule if the response is not as designed
- [ ] 9.4 Run full and partial refunds in BDT and USD, and confirm `refund_trans_id` and the refund amount currency. Correct `docs/sslcommerz.md`
- [ ] 9.5 Run one small live payment and refund, including a customer with no phone number
- [ ] 9.6 Ask `integration@sslcommerz.com` these open questions: IPN retries, URL precedence, the hash change, partial refund rules, `refund_trans_id` deduplication, and the meaning of `cancelled`. Record the answers in `design.md`
- [ ] 9.7 Verify: after any code change from 9.1 to 9.6, run `bash kirki-ecommerce-test unit --filter=SslcommerzTest`, then `npm run typecheck && npm test` from `resources/app/`
