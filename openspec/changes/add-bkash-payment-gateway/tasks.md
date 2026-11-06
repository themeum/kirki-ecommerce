PHP test commands use the Docker runner: `bash kirki-ecommerce-test unit --filter=BkashTest`.
The plugin code must stay compatible with PHP 7.4.

## 1. Plugin skeleton

- [x] 1.1 Create `payments/kirki-bkash/kirki-bkash.php` (`Order: 110`, text domain `kirki-ecommerce-bkash`, `Requires Plugins: kirki-ecommerce`) and `composer.json` with the `Kirki\Ecommerce\Payments\` PSR-4 autoload, modelled on `kirki-paystack`
- [x] 1.2 Add `src/BkashConstant.php` with the v2 sandbox and live base URLs, endpoint paths, the 30-second timeout, status values, and the already-complete codes `2062`, `2068`, `2117`
- [x] 1.3 Add `src/Bkash.php` with the provider id, admin fields (`app_key`, `app_secret`, `username`, `password`, `sandbox`), `validate_settings`, and `sanitize_settings`
- [x] 1.4 Add `assets/logo.svg` from the official icon-only SVG that the user supplies, sized 20×20. If the file is not available yet, leave this task open and tell the user. Do not draw or copy a substitute (the user supplied the file)
- [x] 1.5 Add a test that the provider reports id `bkash`, is online, and treats a missing `sandbox` value as sandbox
- [x] 1.6 Verify: run `bash kirki-ecommerce-test unit --filter=BkashTest`, then `npm run typecheck && npm test` from `resources/app/`

## 2. API client and tokens

- [x] 2.1 Add `src/BkashClient.php` with `create_payment`, `execute_payment`, `query_payment`, `refund`, and `refund_status`, on the framework `Http`, with `X-App-Key` and the bare `id_token` in `authorization`
- [x] 2.2 Add `BkashRejectedException` and `BkashUnknownResultException`, and map responses to the three outcomes in design Decision 1. Test each outcome: JSON success, `externalCode` at HTTP 200 and 4xx, connection error, 5xx, and non-JSON body
- [x] 2.3 Implement token storage and renewal from design Decision 3, using `Cache` and `Cache::lock`. Test: reuse below 50 minutes, one Refresh above it, Grant when no refresh token exists or Refresh is rejected, lock busy with a valid token, lock busy with no token, and separate keys per environment and App Key
- [x] 2.4 Test that tokens and credentials do not appear in exception messages or log entries
- [x] 2.5 Verify: run `bash kirki-ecommerce-test unit --filter=BkashTest`, then `npm run typecheck && npm test` from `resources/app/`

## 3. Starting a payment

- [x] 3.1 Add `src/BkashTransactionBuilder.php`: intent `sale`, currency `BDT`, two-decimal amount through `format_amount`, order UUID as `merchantInvoiceNumber` and `payerReference`, and `webhook_url()` as `callbackURL`
- [x] 3.2 Implement `Bkash::pay()`: check enabled, BDT and credentials before any call, then create the payment, store `paymentId` with `set_payment_metadata`, and return a `REDIRECT` action with the `bkashURL`
- [x] 3.3 Test: successful start and its payload, non-BDT rejection with no HTTP call, missing credentials, disabled gateway, and a rejected or failed Create Payment
- [x] 3.4 Verify: run `bash kirki-ecommerce-test unit --filter=BkashTest`, then `npm run typecheck && npm test` from `resources/app/`

## 4. Customer return

- [x] 4.1 Implement `Bkash::handle_return()` with the flow in design Decision 4
- [x] 4.2 Implement `settle`: compare amount and currency, then apply the paid path in one DB transaction, or the on-hold path with a log entry. Exclude `payerAccount` from stored metadata
- [x] 4.3 Test the paid paths: Execute `Completed`, repeated return on a paid order, Query already `Completed`, already-complete rejection then Query, and Unknown Execute then Query `Completed`
- [x] 4.4 Test the protection paths: stale `paymentId` does not call Execute, unknown `paymentId`, missing `paymentID`, forged `status=success` with a not-`Completed` result, forged `status=failure`, and a POST to the webhook URL changes nothing
- [x] 4.5 Test the failure paths: cancel and failure leave the order unpaid, rejected Execute marks failed, amount and currency mismatch puts the order on hold, and Unknown Execute with Unknown Query leaves it unpaid, logs at critical level, and redirects to the success page
- [x] 4.6 Verify: run `bash kirki-ecommerce-test unit --filter=BkashTest`, then `npm run typecheck && npm test` from `resources/app/`

## 5. Refunds

- [x] 5.1 Implement `Bkash::refund()` with the flow in design Decision 8: `sku` is the order UUID, `reason` is the refund reason limited to 255 characters or a default, and every non-success path throws
- [x] 5.2 Test: `Completed` full and partial refunds, rejected refund, missing `paymentId`, Unknown then new status entry, Unknown with only an earlier refund of the same amount, and Unknown with Unknown status, where the error tells the admin to check the bKash panel
- [x] 5.3 Verify: run `bash kirki-ecommerce-test unit --filter=BkashTest`, then `npm run typecheck && npm test` from `resources/app/`

## 6. Docs and standards

- [x] 6.1 Write `docs/bkash.md` in the structure of `docs/emails.md`: table of contents, numbered sections, quick start first, settings, payment flow, refunds and limits, troubleshooting, and "Where this differs from the official bKash plugin". State that BDT is required, that pretty permalinks are required, what case C means and what the admin must do, and that the signature, IPN and provider fees are not used
- [x] 6.2 Add `Bkash.yml` to `docs/ecommerce/online-payments/Edit/` and `Set Enabled/`, modelled on `Eway.yml`. Add one to `Install/` if `Install/Eway.yml` is still in use
- [x] 6.3 Run phpcs on the new PHP files with the Docker command, and fix all findings (`phpcs-wporg.xml.dist` excludes `payments/*`, so this ran with a temporary copy of the config without that exclude)
- [x] 6.4 Run `openspec validate add-bkash-payment-gateway --strict`
- [x] 6.5 Verify: run the full `bash kirki-ecommerce-test unit`, then `npm run typecheck && npm test` from `resources/app/`

## 7. Go-live checks (manual, with bKash credentials)

- [ ] 7.1 Run in the bKash sandbox: success, cancel, failure, wrong PIN, repeated return, partial refund, and full refund. Confirm the `authorization` format, the Query field names, and the Refund Status `trxId` meaning. Record any difference as a "Correction during implementation" note in `design.md`
- [ ] 7.2 Ask bKash to confirm the live base URL, and update `BkashConstant` if it differs
- [ ] 7.3 Confirm that the merchant's credentials are valid for API v2
- [ ] 7.4 Verify: after any code change from 7.1 to 7.7, run `bash kirki-ecommerce-test unit --filter=BkashTest`, then `npm run typecheck && npm test` from `resources/app/`
- [ ] 7.5 Ask bKash: is the customer balance debited or held before Execute, and for how long? Record the answer in `design.md`, and correct `docs/bkash.md` if needed
- [ ] 7.6 Ask bKash: what Query rate is allowed, is a scheduled Query for unresolved payments acceptable, and what does Query return after 24 hours? Change the schedule if the answer requires it
- [ ] 7.7 In the bKash sandbox, abandon a payment after approval, and confirm that the checks log it, leave the order unpaid, and call no Execute

Run group 7 last, after groups 8 to 11.

## 8. Settle under a lock

Start this group after `gateway-currency-restrictions` is merged and this branch has it.

- [x] 8.1 Add tests: a paid order stays paid after a rejected Execute, a repeated settle records one activity, a cancelled order is not marked paid and logs at critical level, a different stored payment ID holds the order, and a repeated hold adds no second activity
- [x] 8.2 Implement design Decision 12 in `payments/kirki-bkash/src/Bkash.php`, and keep the customer return behaviour. Add a race case to `tests/Integration/ConcurrencySafetyTest.php` (The new test uses the real database with sequential calls and a stale order object. It does not run two processes at the same time, so it does not prove the row lock itself)
- [x] 8.3 Test that metadata always includes the payment ID, and that a settled order can use the refund path
- [x] 8.4 Verify: run `bash kirki-ecommerce-test unit --filter=BkashTest` and `bash kirki-ecommerce-test integration --filter=ConcurrencySafetyTest`, then `npm run typecheck && npm test` from `resources/app/`

## 9. Scheduled job

- [x] 9.1 Add tests: `pay()` dispatches one job with the first delay, a paid order causes no Query, `Completed` settles, a not-`Completed` status schedules the next check and marks nothing, Query Unknown and Rejected schedule the next check, a settle error schedules the next check, the last check logs and schedules nothing, and no path calls Execute
- [x] 9.2 Add `payments/kirki-bkash/src/BkashPaymentCheckJob.php` and the intervals in `BkashConstant`. Follow `app/Jobs/PublishScheduledProductJob.php`
- [x] 9.3 Dispatch the job in `pay()`, after `set_payment_metadata`. A dispatch error must not stop the payment
- [x] 9.4 Test a queued check when the plugin is inactive, and record the result as a "Correction during implementation" note in `design.md` (Result: the job class is missing, `Payload::restore` raises `QueueException`, and `Worker::process` fails the job with no fatal error. The test covers `Payload::restore`, and the `Worker` step was read in the code. Later checks for that payment do not run)
- [x] 9.5 Verify: run `bash kirki-ecommerce-test unit --filter=BkashTest`, then `npm run typecheck && npm test` from `resources/app/`

## 10. BDT declaration

- [x] 10.1 Override `supported_currencies()` in `Bkash` with `BkashConstant::CURRENCY`, keep the `pay()` check, and test that a USD order gets 422 and creates no order
- [x] 10.2 Verify: run `bash kirki-ecommerce-test unit --filter=BkashTest`, then `npm run typecheck && npm test` from `resources/app/`

## 11. Docs and standards

- [x] 11.1 Correct `docs/bkash.md:83-84` and `:134` with design Decision 14
- [x] 11.2 Update `docs/bkash.md`: remove "No background retry", describe the check schedule and what the admin sees, state what stays unrepaired for a closed browser, and state that checkout hides bKash for another currency
- [x] 11.3 Run phpcs on the changed PHP files with a temporary config copy, because `phpcs-wporg.xml.dist` excludes `payments/*`. Fix all findings (Result: no findings)
- [x] 11.4 Run `openspec validate add-bkash-payment-gateway --strict`
- [x] 11.5 Verify: run the full `bash kirki-ecommerce-test unit` and `bash kirki-ecommerce-test integration`, then `npm run typecheck && npm test` from `resources/app/` (Result: unit 734 pass, integration 1493 of 1494 pass, app 2201 pass. The failure is `EscapedOutputTest::test_icon_render_keeps_the_bundled_svg`, which also fails on clean `dev`)
