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
- [ ] 7.4 Verify: after any code change from 7.1 to 7.3, run `bash kirki-ecommerce-test unit --filter=BkashTest`, then `npm run typecheck && npm test` from `resources/app/`
