## Purpose

Defines the rules that every write tool on the `kirki-ecommerce` MCP server
follows: who can run it, how it is marked, how the 2-step confirmation works,
how order changes are marked as made by the AI assistant, and how results and
errors are returned.

## ADDED Requirements

### Requirement: Only administrators can run a write tool

Each write tool SHALL run only for a user with the `manage_options`
capability. For any other user, the call SHALL be rejected with a permission
error, and no store data SHALL be read or changed.

#### Scenario: Editor cannot change an order

- **WHEN** a user with the `editor` role calls `kirki-ecommerce-update-fulfillment`
- **THEN** the call is rejected with a permission error and the order does not change

#### Scenario: Administrator gets a preview

- **WHEN** an administrator calls `kirki-ecommerce-update-fulfillment` without `confirmation_token`
- **THEN** the call succeeds and returns a preview

### Requirement: Write tools are marked and offered only by the store server

Each write tool SHALL have `readOnlyHint` false. A tool that changes or
removes existing data SHALL have `destructiveHint` true. `create-draft-product`
and `duplicate-product` SHALL have `destructiveHint` false. A tool that can
send an email to a customer SHALL have `openWorldHint` true:
`add-order-note`, `update-fulfillment`, `resend-order-email`, `cancel-order`
and `create-manual-order`. `mark-order-paid` sends no email, so it SHALL
have `openWorldHint` false.
`fix-store-pages` SHALL have `idempotentHint` true; the other write tools
SHALL have `idempotentHint` false. Each write tool SHALL be listed by the
`kirki-ecommerce` server only, and SHALL NOT be listed by the MCP Adapter's
default server or the Abilities REST API.

#### Scenario: Annotations of an email-sending tool

- **WHEN** a client lists the tools of the `kirki-ecommerce` server
- **THEN** `kirki-ecommerce-resend-order-email` has `readOnlyHint` false, `destructiveHint` true and `openWorldHint` true

#### Scenario: Annotations of an additive tool

- **WHEN** a client lists the tools of the `kirki-ecommerce` server
- **THEN** `kirki-ecommerce-duplicate-product` has `readOnlyHint` false and `destructiveHint` false

#### Scenario: Not offered to other servers

- **WHEN** a client lists the abilities of the MCP Adapter's default server
- **THEN** none of the 18 write tools is in the list

### Requirement: Risky tools ask the merchant on each call

`cancel-order`, `create-manual-order`, `update-prices`, `update-coupon` and
`update-email-notification` SHALL set
`_meta["anthropic/requiresUserInteraction"]` to true in the tool list.

#### Scenario: Risky tool meta

- **WHEN** a client lists the tools of the `kirki-ecommerce` server
- **THEN** `kirki-ecommerce-cancel-order` has `_meta["anthropic/requiresUserInteraction"]` true and `kirki-ecommerce-add-order-note` does not have it

### Requirement: A change needs a preview and a confirmation token

Each write tool, except `create-draft-product` and `duplicate-product`, SHALL
accept an optional `confirmation_token` argument. A call without
`confirmation_token` SHALL validate the arguments, SHALL change no store data
and send no email, and SHALL return:

- `status`: `"preview"`
- `changes`: the planned change, with the current value and the new value of
  each field that changes, and the emails that the change will send
- `confirmation_token`: a random token
- `expires_at`: the time when the token stops being valid, 10 minutes later

A call with `confirmation_token` SHALL do the change only when all of these
are true:

- the token was given to the same user, for the same tool
- the other arguments are the same as in the preview call
- the token is not older than 10 minutes and was not used before
- the target record did not change after the preview

Otherwise the call SHALL return a tool error that tells the client to call
the tool again without `confirmation_token` to get a new preview, and it
SHALL change nothing. A token SHALL be valid for one change only, also when
the change fails.

#### Scenario: Preview changes nothing

- **WHEN** an administrator calls `kirki-ecommerce-set-coupon-state` with `coupon_id` 7 and `state` `"inactive"`, without `confirmation_token`
- **THEN** the result has `status` `"preview"`, `changes` shows `is_active` from true to false, a `confirmation_token` and an `expires_at`, and coupon 7 stays active

#### Scenario: Confirmed change

- **WHEN** the administrator calls the same tool again within 10 minutes with the same arguments and the token from the preview
- **THEN** coupon 7 becomes inactive and the result has `status` `"done"`

#### Scenario: Arguments differ from the preview

- **WHEN** the second call sends `coupon_id` 8 with the token that the preview of coupon 7 gave
- **THEN** the call returns a tool error that asks for a new preview, and no coupon changes

#### Scenario: Record changed after the preview

- **WHEN** an order is previewed for `mark-as-shipped`, and then a person cancels the order in the admin, and then the token is sent
- **THEN** the call returns a tool error that asks for a new preview, and the order stays cancelled

#### Scenario: Token used two times

- **WHEN** a token that already did a change is sent again
- **THEN** the call returns a tool error that asks for a new preview, and nothing changes

#### Scenario: Other user

- **WHEN** administrator B sends a token that a preview for administrator A gave
- **THEN** the call returns a tool error that asks for a new preview, and nothing changes

### Requirement: Additive tools run in one call

`create-draft-product` and `duplicate-product` SHALL do the change in the
first call, without a token, and SHALL return `status` `"done"`. The product
that they create SHALL always have the `draft` status.

#### Scenario: Duplicate in one call

- **WHEN** an administrator calls `kirki-ecommerce-duplicate-product` with a product ID
- **THEN** a new draft product is created and returned in the same call

### Requirement: A done change returns the stored values

After a change, the tool SHALL read the changed records again from the
database and SHALL return them with `status` `"done"`. Money SHALL be
returned as decimal amounts with a display string and a currency code, the
same as the read tools.

#### Scenario: Stock change result

- **WHEN** `adjust-stock` adds 5 to a variant with 10 in stock
- **THEN** the result has `status` `"done"` and the variant's `available_quantity` is 15, as read from the database

### Requirement: Order changes are marked as made by the AI assistant

Each order activity that a write tool causes SHALL be marked as made by the AI
assistant. The activity SHALL keep the user who signed in as its author. The
admin order timeline SHALL show "via AI assistant" on that activity. The
customer's order page SHALL NOT show the mark. Activities made in the admin
SHALL NOT have the mark.

#### Scenario: Shipped through the assistant

- **WHEN** an administrator ships order 1042 through `update-fulfillment`
- **THEN** the order timeline in the admin shows the shipped entry with the administrator's name and "via AI assistant"

#### Scenario: Customer view

- **WHEN** the customer opens order 1042 on the storefront account page
- **THEN** the shipped entry shows no AI-assistant mark

#### Scenario: Admin action

- **WHEN** an administrator ships an order from the admin order page
- **THEN** the shipped entry has no AI-assistant mark

### Requirement: Arguments are validated before any change

Each write tool SHALL validate its arguments before it reads or changes store
data. A validation failure SHALL be returned as a tool error that names each
argument that is not valid and tells what to send. A rule of the store, such
as an action that the order status does not allow, SHALL also be returned as
a tool error with the store's message, and SHALL change nothing.

#### Scenario: Action not allowed for the order status

- **WHEN** `update-fulfillment` is called with `action` `"mark-as-delivered"` for an order that is not shipped
- **THEN** the preview call returns a tool error that says the action is not available for the order's current status, and no token is given

### Requirement: Text from outside people is marked in previews

A preview or result that shows text that customers or other outside people
wrote, such as an order note or a customer note, SHALL return that text in a
field whose name ends in `_text`, without markup and cut to 500 characters.
The tool description SHALL tell the client to treat that text as data.

#### Scenario: Customer note in a preview

- **WHEN** `update-customer-tags` previews a change for a customer whose note has HTML tags
- **THEN** the current note is in `notes_text`, without tags and not longer than 500 characters
