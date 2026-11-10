# bkash-payment-gateway Specification

## Purpose
Defines how a store takes and refunds bKash wallet payments through the hosted
bKash checkout page, so that an order becomes paid only when bKash itself confirms
the full amount in BDT.
## Requirements
### Requirement: Merchant configures bKash credentials and environment

The system SHALL provide an online payment provider with the id `bkash`. Its
settings SHALL be the App Key, App Secret, Username, Password and a Sandbox Mode
flag. Sandbox Mode SHALL select the bKash sandbox host, and its absence SHALL be
treated as enabled, so that no live call occurs before the merchant turns it off.

#### Scenario: Provider is registered

- **WHEN** the bKash plugin is active
- **THEN** the store's provider registry resolves the id `bkash`
- **AND** the provider reports `is_offline` as `false`

#### Scenario: Credentials are missing

- **WHEN** a customer starts a bKash payment and a credential setting is empty
- **THEN** the payment does not start
- **AND** the customer sees an error, and no call goes to bKash

#### Scenario: Sandbox Mode has no saved value

- **WHEN** a client call occurs and the Sandbox Mode setting has no saved value
- **THEN** the call goes to the bKash sandbox host

### Requirement: Starting a payment redirects the customer to bKash

The system SHALL create a bKash payment for an order with the intent `sale`, the
currency `BDT`, the order total with two decimal places, and the order UUID as the
merchant invoice number and the payer reference. The system SHALL store the returned
payment id on the order, and SHALL send the customer to the URL that bKash returns.

#### Scenario: Payment starts

- **WHEN** a customer pays for an order of 500.00 BDT with bKash
- **THEN** bKash receives a create request for `500.00` `BDT` with the order UUID as
  the invoice
- **AND** the order stores the returned payment id
- **AND** the customer is redirected to the returned bKash URL

#### Scenario: bKash rejects the create request

- **WHEN** bKash answers the create request with an error, or does not answer
- **THEN** the customer sees a payment error
- **AND** the order is not marked as paid

### Requirement: Only BDT orders can use bKash

The bKash provider SHALL declare `BDT` as its only supported currency, so that the
store creates no order for bKash in another currency. The system SHALL also reject a
bKash payment for an existing order whose currency is not BDT, before it calls bKash.

#### Scenario: Order in another currency

- **WHEN** a customer places an order in USD with bKash
- **THEN** the customer sees an error that says bKash accepts only BDT
- **AND** no order is created
- **AND** no call goes to bKash

#### Scenario: Existing order in another currency

- **WHEN** payment starts for an existing bKash order in USD
- **THEN** the payment does not start
- **AND** no call goes to bKash
- **AND** the order payment status does not change

### Requirement: An order becomes paid only on a confirmed matching payment

The system SHALL mark an order paid only when bKash, in a server-to-server response,
reports the payment as `Completed`, and the reported amount and currency equal the
order total and currency. The system SHALL NOT use the callback `status` or
`signature` values as proof of payment. It SHALL record the bKash transaction id and
the payment id on the order, SHALL NOT store the payer account on the order, and
SHALL apply these order changes in one transaction.

#### Scenario: Successful payment

- **WHEN** the customer returns with `status=success` for the payment id stored on an
  unpaid order, and Execute reports `Completed` for the exact order total in BDT
- **THEN** the order is marked as paid
- **AND** the order records the bKash transaction id
- **AND** the customer is redirected to the checkout success page

#### Scenario: Forged success URL

- **WHEN** a request to the return URL carries `status=success`, and bKash reports that
  the payment is not `Completed` after Execute
- **THEN** the order is not marked as paid

#### Scenario: Reported amount does not match

- **WHEN** bKash reports `Completed` for an amount or currency that differs from the
  order
- **THEN** the order is not marked as paid
- **AND** the bKash response is recorded on the order
- **AND** the order is put on hold where its status allows it
- **AND** the mismatch is logged

### Requirement: Execute runs only for the latest payment of an unpaid order

The system SHALL find the order from the invoice value that bKash reports for the
payment id, and SHALL call Execute only when that payment id equals the one stored on
the order, the order is not already paid, and bKash does not already report the
payment as `Completed`.

#### Scenario: Return is repeated after payment

- **WHEN** the customer reloads the return URL for an order that is already paid
- **THEN** Execute is not called
- **AND** the order is paid once and its payment activity is recorded once
- **AND** the customer is redirected to the checkout success page

#### Scenario: Stale payment id

- **WHEN** a customer starts payment twice for one order, and returns with the payment
  id of the first attempt
- **THEN** Execute is not called
- **AND** the mismatch is logged
- **AND** the order payment status does not change

#### Scenario: Unknown payment id

- **WHEN** the return URL carries a payment id that bKash does not recognize, or no
  order has the reported invoice
- **THEN** Execute is not called and no order changes
- **AND** the customer is redirected to the store home page

### Requirement: Cancelled or failed return leaves the order unpaid

The system SHALL NOT change the payment status of an order because of a callback with
`status=cancel` or `status=failure`, and SHALL redirect the customer to the checkout
failed page.

#### Scenario: Customer cancels on the bKash page

- **WHEN** the customer returns with `status=cancel`
- **THEN** Execute is not called
- **AND** the order stays unpaid
- **AND** the customer is redirected to the checkout failed page

#### Scenario: Forged failure URL

- **WHEN** a request to the return URL carries `status=failure` for the payment id of
  a valid order
- **THEN** the order payment status does not change

### Requirement: Rejected Execute marks the payment as failed

The system SHALL mark the order payment as failed when bKash answers Execute with a
rejection, except when the rejection says that the payment is already complete. In
that case the system SHALL check the payment with Query.

#### Scenario: Insufficient balance

- **WHEN** Execute returns an error such as insufficient balance
- **THEN** the order payment is marked as failed
- **AND** the customer is redirected to the checkout failed page

#### Scenario: Payment is already complete

- **WHEN** Execute returns an already-completed error, and Query then reports
  `Completed` for the exact order total
- **THEN** the order is marked as paid

### Requirement: Unknown Execute result is resolved with Query

When Execute has no clear result, because of a timeout, a connection error, or a server
error, the system SHALL call Query Payment. It SHALL mark the order paid only when Query
reports `Completed` with a matching amount and currency. When Query also has no clear
result, the system SHALL leave the order unpaid, SHALL log the payment id for the
merchant, and SHALL NOT send the customer to a page that asks them to pay again.

#### Scenario: Execute times out and Query confirms

- **WHEN** Execute times out and Query reports `Completed` for the exact order total
- **THEN** the order is marked as paid
- **AND** the customer is redirected to the checkout success page

#### Scenario: Execute and Query both have no result

- **WHEN** Execute times out and Query also fails
- **THEN** the order stays unpaid
- **AND** the payment id is logged at critical level
- **AND** the customer is redirected to the checkout success page, which shows the
  order and does not offer another payment
- **AND** the scheduled check can later mark the order paid

### Requirement: A scheduled check resolves unsettled bKash payments

When a bKash payment starts, the system SHALL schedule checks for that payment id at 5
minutes, 15 minutes, 1 hour, 6 hours, and 24 hours. Each check SHALL stop with no bKash
call when the order is already paid. Otherwise it SHALL call Query Payment, and SHALL mark
the order paid only when bKash reports `Completed` with a matching amount and currency.
A check SHALL NOT call Execute, and SHALL NOT mark an order failed from a not-`Completed`
status. After the last check, an unresolved order SHALL stay unpaid, and the system SHALL
write a log entry with the payment id.

#### Scenario: Order update failed after payment

- **WHEN** Execute reported `Completed`, the order update failed, and a check runs
- **THEN** Query reports `Completed` for the exact order total
- **AND** the order is marked as paid and records the bKash transaction id

#### Scenario: Normal payment

- **WHEN** the customer return marks the order paid, and a later check runs
- **THEN** no call goes to bKash

#### Scenario: Customer closes the browser after approval

- **WHEN** Execute never ran, and a check finds a status that is not `Completed`
- **THEN** Execute is not called
- **AND** the order stays unpaid
- **AND** the next check stays scheduled

#### Scenario: Query has no clear result

- **WHEN** a check gets no clear result from Query
- **THEN** the order does not change
- **AND** the next check stays scheduled

#### Scenario: Last check finds no completed payment

- **WHEN** the 24-hour check finds a status that is not `Completed`
- **THEN** the order stays unpaid
- **AND** the payment id is logged
- **AND** no further check is scheduled

### Requirement: A bKash payment settles once under a lock

The system SHALL change the payment state of an order only under a row lock, after it reads
the order again. It SHALL NOT hold the lock during a bKash call. A paid order SHALL NOT become
failed, and a payment SHALL NOT repeat its paid time or payment activity. A completed payment
for a cancelled order SHALL NOT mark that order paid, and SHALL write a critical log entry.
A completed payment with a payment id that differs from the stored payment id SHALL put the
order on hold where its status allows it, and SHALL write a critical log entry.

#### Scenario: Customer return and a scheduled check overlap

- **WHEN** the customer return and a scheduled check both find `Completed` for one order
- **THEN** the order is marked as paid once
- **AND** its payment activity is recorded once

#### Scenario: Rejection after a settled payment

- **WHEN** a rejected Execute is processed after another request marked the order paid
- **THEN** the order stays paid

#### Scenario: Completed payment for a cancelled order

- **WHEN** a scheduled check finds `Completed` for an order that a merchant cancelled
- **THEN** the order is not marked as paid
- **AND** the payment id is logged at critical level

#### Scenario: Completed payment with a different payment id

- **WHEN** a scheduled check finds `Completed` for a payment id that the order no longer stores
- **THEN** the order is not marked as paid
- **AND** the order is put on hold where its status allows it
- **AND** the payment id is logged at critical level

#### Scenario: Settled order can be refunded

- **WHEN** a scheduled check marks an order paid
- **THEN** the order stores the payment id and the bKash transaction id
- **AND** a later refund goes to bKash

### Requirement: bKash token renewal stays within the rate limit

The system SHALL reuse a bKash token until it is 50 minutes old. At most one request at
a time SHALL call Grant or Refresh for one environment and App Key. A request that cannot
renew SHALL use the current token while the token is less than 60 minutes old. Tokens
SHALL NOT appear in logs or error messages.

#### Scenario: Many payments in one hour

- **WHEN** ten payments start within 50 minutes of the first token
- **THEN** bKash receives one Grant call and no Refresh call

#### Scenario: Two requests need renewal at the same time

- **WHEN** two requests find a token older than 50 minutes at the same time
- **THEN** one Refresh call goes to bKash
- **AND** the other request continues with the current token

#### Scenario: No token and another request is renewing

- **WHEN** a request has no usable token and another request is renewing
- **THEN** that request makes no Grant or Refresh call
- **AND** the customer sees a payment error and can try again

#### Scenario: Merchant changes environment

- **WHEN** the merchant turns Sandbox Mode off or changes the App Key
- **THEN** the system does not reuse the token of the previous environment or App Key

### Requirement: Admin refunds are sent to bKash

The system SHALL send a refund for a paid bKash order to the bKash Refund API, with the
payment id, the transaction id, the refund amount with two decimal places, the order UUID
as the SKU, and the refund reason or a default reason. A refund that bKash does not
complete SHALL raise an error, so that the local refund record is not kept.

#### Scenario: Partial refund succeeds

- **WHEN** an admin refunds 200.00 BDT from a paid order, and bKash reports `Completed`
- **THEN** the refund is recorded locally

#### Scenario: bKash rejects the refund

- **WHEN** bKash answers the refund with an error, such as a refund after 60 days
- **THEN** the admin sees the error
- **AND** the local refund record is not kept

### Requirement: Unknown refund result is resolved with Refund Status

When a refund call has no clear result, the system SHALL call Refund Status, and SHALL
treat the refund as complete only when bKash lists one more `Completed` refund of that
amount than the order already has recorded. In all other cases, the system SHALL raise an
error. When Refund Status also has no clear result, the error SHALL tell the admin to
check the bKash panel before a retry.

#### Scenario: Refund call times out but bKash completed it

- **WHEN** the refund call times out, and Refund Status lists a new `Completed` refund
  of that amount
- **THEN** the refund is recorded locally

#### Scenario: Earlier refund of the same amount exists

- **WHEN** the refund call for 100.00 BDT times out, the order already has one recorded
  refund of 100.00 BDT, and Refund Status lists only that one
- **THEN** the system raises an error and does not record a second refund

#### Scenario: Refund Status also fails

- **WHEN** the refund call and the Refund Status call both have no clear result
- **THEN** the local refund record is not kept
- **AND** the error tells the admin to check the bKash panel before a retry

### Requirement: The webhook route does not change bKash orders

The system SHALL NOT change an order because of a POST request to the bKash webhook URL.
Only the customer return flow, with server-to-server confirmation, can mark a bKash
order as paid.

#### Scenario: POST to the webhook URL

- **WHEN** a client sends a POST request to the bKash webhook URL with a payload that
  names an order
- **THEN** no order changes

