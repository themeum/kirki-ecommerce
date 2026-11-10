## Purpose

Defines how a store takes and refunds SSLCommerz payments through the hosted payment page, so
that an order becomes paid only when the SSLCommerz Order Validation API confirms the
transaction and the transaction matches the order.

## ADDED Requirements

### Requirement: Merchant configures SSLCommerz credentials and environment

The system SHALL provide an online payment provider with the id `sslcommerz`. Its settings
SHALL be the Store ID, the Store Password, and a Sandbox Mode flag. Sandbox Mode SHALL select
the SSLCommerz sandbox host, and the system SHALL treat a missing value as enabled, so that no
live call occurs before the merchant turns it off. The system SHALL store the Store Password
with every character unchanged.

#### Scenario: Provider is registered

- **WHEN** the SSLCommerz plugin is active
- **THEN** the store's provider registry resolves the id `sslcommerz`
- **AND** the provider reports `is_offline` as `false`

#### Scenario: Credentials are missing

- **WHEN** a customer starts a payment and a credential setting is empty
- **THEN** the payment does not start
- **AND** the customer sees an error, and no call goes to SSLCommerz

#### Scenario: Sandbox Mode has no saved value

- **WHEN** a client call occurs and the Sandbox Mode setting has no saved value
- **THEN** the call goes to the SSLCommerz sandbox host

### Requirement: Credentials do not reach logs or errors

The system SHALL NOT write the Store Password, or a URL or request body that holds it, to a
log entry, an order note, or an error message.

#### Scenario: A validation call fails

- **WHEN** a call that has the Store Password in its URL fails
- **THEN** the log entry and the error message do not hold the Store Password or the full URL

### Requirement: Starting a payment redirects the customer to SSLCommerz

The system SHALL create an SSLCommerz session for an order with the order total in two decimal
places, the order currency, and all fields that the SSLCommerz docs mark as mandatory. Each
session SHALL use a new transaction ID of at most 30 characters that holds the order ID and a
random part. The system SHALL store the transaction ID, the session key, the amount, and the
currency on the order, and SHALL send the customer to the page URL that SSLCommerz returns.

#### Scenario: Payment starts

- **WHEN** a customer pays for an order of 500.00 BDT with SSLCommerz
- **THEN** SSLCommerz receives a session request for `500.00` `BDT` with a transaction ID of at
  most 30 characters
- **AND** the order stores the transaction ID, the session key, the amount, and the currency
- **AND** the customer is redirected to the returned page URL

#### Scenario: Order has a shipping address

- **WHEN** a session request is built for an order with a shipping address
- **THEN** the request has `shipping_method` set to `YES` and the shipping address fields

#### Scenario: Order has no shipping address

- **WHEN** a session request is built for an order with no shipping address
- **THEN** the request has `shipping_method` set to `NO`
- **AND** `product_profile` is `non-physical-goods`

#### Scenario: SSLCommerz rejects the session

- **WHEN** the session response has a status other than `SUCCESS`, or has no HTTPS page URL
- **THEN** the customer sees a payment error that holds the SSLCommerz reason
- **AND** the order is not marked as paid

### Requirement: Currency support has no restriction

The provider SHALL declare no currency restriction. A currency that SSLCommerz rejects SHALL
fail at the session request, with the error from the previous requirement.

#### Scenario: SSLCommerz rejects a currency

- **WHEN** a customer pays in a currency that SSLCommerz does not accept
- **THEN** the customer sees the SSLCommerz reason
- **AND** the order is not marked as paid

### Requirement: A browser return ends with a redirect to a store page

The system SHALL accept a cross-site browser POST to each return URL, with no nonce, session,
or cookie. It SHALL process the request, then answer with an HTTP 303 redirect to a store page.
The customer SHALL NOT see a JSON response. The system SHALL identify a browser return by a
query argument in the return URL.

#### Scenario: Successful return

- **WHEN** a browser return has a transaction ID that matches the order, and the validation
  checks pass
- **THEN** the customer receives a 303 redirect to the checkout success page

#### Scenario: Unknown transaction on return

- **WHEN** a browser return has a transaction ID that matches no order
- **THEN** no call goes to SSLCommerz
- **AND** the customer receives a 303 redirect to the home page

#### Scenario: Validation has no clear result on return

- **WHEN** a browser return has a matching transaction ID, and the Order Validation API has no
  clear result
- **THEN** the order does not change
- **AND** a log entry records the event at critical level
- **AND** the customer receives a 303 redirect to the checkout success page, which offers no
  new payment

### Requirement: The IPN listener answers without a redirect

The system SHALL accept a POST to the webhook URL with no return query argument as an IPN. The
IPN SHALL use the same confirmation and failure rules as a browser return. The system SHALL
answer a processed IPN with a success response, and SHALL answer a failed or unmatched IPN with
a client error.

#### Scenario: IPN confirms a payment

- **WHEN** an IPN has a matching transaction ID, and the validation checks pass
- **THEN** the order is marked as paid
- **AND** the response is a success response, not a redirect

#### Scenario: Forged IPN

- **WHEN** a POST names a transaction ID that matches no order
- **THEN** no call goes to SSLCommerz, and no order changes
- **AND** the response is a client error

### Requirement: Only the Order Validation API can confirm a payment

The system SHALL mark an order paid only when all of these conditions are true. The transaction
ID in the request matches the transaction ID on the order. The Order Validation API reports
`VALID` or `VALIDATED`. The transaction ID in the API response matches the order. The
`currency_type` and `currency_amount` in the API response equal the order currency and total.
The system SHALL NOT use amount, currency, or status values from the inbound request for this
decision. The system SHALL store the validation ID and the bank transaction ID on the order, and
SHALL use the bank transaction ID as the order transaction ID.

#### Scenario: BDT payment matches

- **WHEN** the API reports `VALID` with `currency_amount` `500.00` and `currency_type` `BDT` for
  an order of 500.00 BDT
- **THEN** the order is marked as paid

#### Scenario: Payment converted from another currency matches

- **WHEN** the API reports `amount` `8318.50`, `currency` `BDT`, `currency_amount` `100.00`, and
  `currency_type` `USD` for an order of 100.00 USD
- **THEN** the order is marked as paid

#### Scenario: Validation ID from another order

- **WHEN** a request names the transaction ID of one order and a validation ID from a payment of
  another order with the same amount
- **THEN** the API response has a different transaction ID
- **AND** the order does not change

#### Scenario: Amount or currency does not match

- **WHEN** the API reports the matching transaction ID, but a different amount or currency
- **THEN** the order is not marked as paid
- **AND** the order is put on hold
- **AND** a log entry records the event at critical level

#### Scenario: Request says success and the API does not

- **WHEN** a request has `status=VALID`, and the API reports `INVALID_TRANSACTION`
- **THEN** the order does not change

### Requirement: Settlement occurs once

The system SHALL apply a confirmed payment under the order lock, and SHALL read the order state
again after it gets the lock. The customer return, the IPN, and the scheduled check SHALL apply
one payment to an order only once. A `VALIDATED` status SHALL NOT count as proof that the store
already applied the payment.

#### Scenario: Return and IPN arrive together

- **WHEN** a browser return and an IPN confirm the same payment at the same time
- **THEN** the order is paid once, and its payment activity is recorded once

#### Scenario: Repeated IPN

- **WHEN** an IPN arrives again for an order that has the same validation ID
- **THEN** the order does not change, and the response is a success response

#### Scenario: Second successful payment

- **WHEN** a settled order receives a confirmed payment with a different validation ID
- **THEN** the order does not change
- **AND** a log entry at critical level tells the merchant to check for a double payment

#### Scenario: Order is cancelled

- **WHEN** a payment is confirmed for a cancelled order
- **THEN** the order is not marked as paid
- **AND** a log entry at critical level tells the merchant to refund the payment

### Requirement: A risky payment is paid and on hold

The system SHALL treat only a `risk_level` of exactly `0` in the validation response as low risk.
For any other value, including a missing value, the system SHALL record the payment, SHALL put
the order in the paid and on-hold state, SHALL store the risk fields, and SHALL write a warning
log entry. The merchant SHALL use the existing resume and cancel actions to continue.

#### Scenario: Low-risk payment

- **WHEN** a confirmed payment has `risk_level` `0`
- **THEN** the order is paid and not on hold

#### Scenario: Risky payment

- **WHEN** a confirmed payment has `risk_level` `1`
- **THEN** the order status is `on_hold_paid`
- **AND** the order stores `risk_level` and `risk_title`

#### Scenario: Risk level is missing

- **WHEN** a confirmed payment has no `risk_level`
- **THEN** the order status is `on_hold_paid`

#### Scenario: Risky payment on a failed order

- **WHEN** a confirmed risky payment arrives for an order with a failed payment
- **THEN** the order status is `on_hold_paid`

### Requirement: The signature check does not decide order state

The system SHALL calculate `verify_sign` from the raw posted values, with a timing-safe
comparison. On a mismatch, it SHALL write a warning log entry and continue. No order state SHALL
depend on the result.

#### Scenario: Signature does not match

- **WHEN** a request has a wrong `verify_sign`, and the Order Validation API confirms the payment
- **THEN** a warning log entry records the mismatch
- **AND** the order is marked as paid

#### Scenario: Signature matches and the API rejects

- **WHEN** a request has a correct `verify_sign`, and the Order Validation API reports
  `INVALID_TRANSACTION`
- **THEN** the order does not change

### Requirement: A failure message is confirmed before the order changes

When a fail return, a cancel return, or an IPN with a non-success status arrives, the system
SHALL query SSLCommerz by transaction ID. If an element reports success, the system SHALL send it
through the validation path. If the query is clear and no element reports success or pending, the
system SHALL mark the payment failed under the order lock. If the query has no clear result, or an
element is pending, the order SHALL NOT change. A browser return SHALL go to the checkout failed
page, unless the order is settled.

#### Scenario: Forged failure on a paid order

- **WHEN** a failure message arrives for a paid order
- **THEN** the order does not change
- **AND** the customer goes to the checkout success page

#### Scenario: Failure is confirmed

- **WHEN** a fail return arrives, and the query reports only `FAILED` elements
- **THEN** the order payment is marked as failed
- **AND** the customer goes to the checkout failed page

#### Scenario: Failure message and query success disagree

- **WHEN** a failure message arrives, and the query reports a `VALID` element
- **THEN** the system runs the validation path for that element

#### Scenario: Query has no result

- **WHEN** a failure message arrives, and the query fails or has an `APIConnect` value other than
  `DONE`
- **THEN** the order does not change

### Requirement: A scheduled check finds missed payments

Starting a payment SHALL schedule checks at 5 minutes, 15 minutes, 1 hour, 6 hours, and 24 hours.
Each check SHALL query by transaction ID, SHALL read every element, and SHALL send each success
through the validation path. A check SHALL stop on a settled order without a query. After the last
check, the order SHALL NOT change, and a log entry SHALL record the event. A check SHALL NOT change
an order when the transaction ID of the check differs from the transaction ID on the order, and it
SHALL log a confirmed success on that older transaction at critical level.

#### Scenario: Customer closes the browser and the IPN is blocked

- **WHEN** a payment succeeds, no return or IPN arrives, and a check runs
- **THEN** the check confirms the payment, and the order is marked as paid

#### Scenario: Query reports several elements

- **WHEN** the query reports `FAILED` as the first element and `VALIDATED` as the second element
- **THEN** the check runs the validation path for the second element

#### Scenario: Late success on a failed order

- **WHEN** a check confirms a success for an order with a failed payment
- **THEN** the order is marked as paid

#### Scenario: No success after the last check

- **WHEN** the last check finds no success
- **THEN** the order does not change
- **AND** a log entry records the event, and no further check is scheduled

### Requirement: Refunds go to SSLCommerz and finish from a scheduled check

An admin refund SHALL send the amount that the merchant entered, the stored bank transaction ID,
and a refund transaction ID to SSLCommerz. The refund transaction ID SHALL be the same when an
admin repeats a refund of the same amount for the same order after a refund with no clear result.
An accepted refund SHALL store the SSLCommerz reference as the refund ID, SHALL stay pending, and
SHALL schedule checks. A check SHALL mark the refund completed on `refunded`, and SHALL mark it
cancelled with a log entry on `cancelled`. Any other outcome of the refund request SHALL stop the
local refund with an error, with no automatic retry.

#### Scenario: Refund is accepted

- **WHEN** SSLCommerz answers a refund request with `success` and a reference
- **THEN** the refund row stays pending and stores the reference
- **AND** a check is scheduled

#### Scenario: Partial refund

- **WHEN** an admin refunds 100.00 of an order of 500.00
- **THEN** SSLCommerz receives a refund amount of `100.00`

#### Scenario: Refund completes

- **WHEN** a check receives `refunded`
- **THEN** the refund is completed through the core refund path

#### Scenario: Refund is cancelled at SSLCommerz

- **WHEN** a check receives `cancelled`
- **THEN** the refund is cancelled
- **AND** a log entry records the event

#### Scenario: Refund is already started

- **WHEN** SSLCommerz answers a refund request with `processing`
- **THEN** the admin sees an error, and no local refund stays

#### Scenario: SSLCommerz rejects the refund

- **WHEN** SSLCommerz answers a refund request with `failed`
- **THEN** the admin sees the SSLCommerz error reason, and no local refund stays

#### Scenario: Refund has no clear result

- **WHEN** a refund request has no clear result
- **THEN** the admin sees an error that says to check the SSLCommerz panel before another try
- **AND** no local refund stays, and the system does not retry

#### Scenario: Checks end with no result

- **WHEN** the last refund check receives `processing` or has no result
- **THEN** the refund stays pending
- **AND** a log entry tells the merchant to check the SSLCommerz panel
