## Context

See proposal.md for the motivation. The current state:

- The 11 MCP tools extend `StoreReadTool` (`app/Mcp/Tools/StoreReadTool.php`).
  It sets the read-only annotations, checks `manage_options`, and gives
  `money()`, `datetime()` and `store_text()`. Tools validate with the
  `ValidatesArguments` concern and return `Response::error()` for a store rule.
- The framework-mcp `Tool` has `read_only`, `destructive`, `idempotent` and
  `open_world` properties. `Ability::meta()` returns the `$meta` property,
  and `AbilityRegistrar` sends it as the MCP `_meta` of the tool.
- The MCP Adapter registers each tool as an ability. The Abilities API checks
  the input schema before the tool runs, so a `required` argument that is
  missing fails with -32603 and a hidden message (found in the prompts
  change). Thus `confirmation_token` and other conditional arguments must be
  optional in the schema and checked in the tool.
- Order actions go through `PerformOrderAction`: a transaction, a row lock,
  and the state matrix guard. `OrderManager` writes each lifecycle activity
  with `OrderActivity::log()`, and `OrderActivityManager::comment()` writes a
  note. All activity writes go through `OrderActivityManager::record()` or
  `comment()`, which call `OrderActivityService::create()`.
- `UpdateProductAction` and `ProductService::update()` need the full product
  with all variants; variants that are not in the payload are deleted. They
  are too wide for a text-only or status-only change.
- `VariantService::partial_update()` and `bulk_update()` set absolute values.
  `bulk_update()` runs in one transaction.
- Coupon create and update use `CouponCreateRequest` and `CouponUpdateRequest`
  rules, then `CreateCouponAction` and `UpdateCouponAction`.
  `CouponService::change_activation_state()` and `DuplicateCouponAction` back
  the coupon `action` endpoint.
- `Utils::generate_site_pages()` creates a page for each page setting that
  has no page, and publishes the linked pages.
- Email notifications are in the `email` settings group, at
  `<recipient>_emails.<group>.<key>`, with `is_enabled`, `subject`, `heading`
  and `message`. `PUT /settings` replaces a whole group.
- `POST /calculate/order` (`OrderCalculationController` with
  `RecalculateCartAction`) gives the totals of an order before it exists.

## Goals / Non-Goals

**Goals:**

- One base class that makes the 2-step confirmation, the annotations, the
  AI-assistant mark and the error shape the same for all 18 tools.
- Each tool goes through the same service or action as the admin, so the
  admin rules and events apply.
- A token can do only the change that the preview showed.

**Non-Goals:**

- A setting to turn off write tools, capability tiers, or a role for the
  assistant. All tools use `manage_options`.
- An audit log outside the order timeline.
- Refunds, hard deletes, bulk "all" actions, order edits, customer creation,
  and invoices or payment links.
- MCP elicitation. The adapter does not support it for ability-backed tools.
- Stock alerts from `adjust-stock`. The admin variant update does not send
  them either.

## Decisions

### D1. `StoreWriteTool` base class with a template method

`StoreWriteTool extends Tool` sets `read_only` false, checks
`manage_options`, and uses the same `FormatsMoney` and `ValidatesArguments`
concerns as `StoreReadTool`. The shared helpers `money()`, `datetime()` and
`store_text()` move to a new `App\Mcp\Concerns\ReadsStoreValues` trait that
both base classes use, so the read tools do not change their output.

`handle()` is final in practice (the subclasses do not override it):

1. `validate(Request)` → validated arguments (subclass).
2. `target(array $args)` → the record or records, or a tool error (subclass).
3. `preview(array $args, $target)` → the `changes` array (subclass). A store
   rule that fails returns a tool error here, so no token is given.
4. Without a token: store the token and return the preview.
5. With a token: claim the token, then run `apply()` inside
   `OrderActivity::as_assistant()` (D4), then return `result()` with
   `status` `"done"`.

`requires_confirmation()` returns true by default. `CreateDraftProductTool`
and `DuplicateProductTool` return false, so steps 3 and 4 are skipped.
Tools that set `_meta` use a `$meta` property:
`['anthropic/requiresUserInteraction' => true]`.

Alternative: a trait per tool. Rejected because 18 tools would repeat the
same flow, and a missed step is a security gap.

### D2. Confirmation tokens in transients

`App\Mcp\ConfirmationTokens` has `issue()` and `claim()`.

- `issue(string $tool, int $user_id, array $args, string $fingerprint)`
  makes a token with `wp_generate_password(32, false)`. It stores
  `['user_id', 'tool', 'args_hash', 'fingerprint']` in the transient
  `kirki_ecommerce_mcp_token_<sha256(token)>` for 600 seconds.
  `args_hash` is the sha256 of the JSON of the validated arguments without
  `confirmation_token`, with keys sorted at each level.
- `claim(string $token, string $tool, int $user_id, array $args)` reads the
  transient, then deletes it. Only when `delete_transient()` returns true
  and the user, tool and `args_hash` are the same does it return the stored
  fingerprint. Else it returns null. The delete comes first, so the token is
  used up also when the change later fails, and two calls at the same time
  cannot both claim it.
- The tool then computes the fingerprint again from the current record. A
  different fingerprint gives the "ask for a new preview" error.

The fingerprint is the sha256 of the record fields that the change depends
on: for an order the statuses, `is_refund_initiated` and `updated_at`; for a
variant the stock or the prices; for a product, coupon or customer the
fields that the tool changes plus the status; for an email notification its
current values; for the pages the page settings and page statuses; for a
manual order the calculated totals, the item prices and stock, and the
coupon codes.

Alternatives: an HMAC token with no storage (cannot be one-use), or a new
table (more code for a 10-minute value). Transients are enough. When an
object cache drops a transient early, the client gets the "ask for a new
preview" error, which is safe.

### D3. Argument format

- `confirmation_token` is an optional string in every token tool's schema.
- Order tools take `order_id` or `order_number`, the same as `get-order`. The
  lookup moves from `GetOrderTool::find_order()` to a shared
  `FindsOrders` concern.
- Money arguments are decimal numbers in the base currency. The tool checks
  the number of decimals against the base currency, then calls
  `Money::to_minor()`. This is the same as the admin request classes, which
  convert to minor units in `prepare_for_validation()`.
- Conditional arguments (for example `tracking_number` for `add-tracking`)
  are optional in the schema and checked in `validate()`, because of the
  Abilities API schema check.

### D4. AI-assistant mark through `OrderActivityManager`

`OrderActivityManager` gets `as_assistant(callable $callback)`. It sets a
flag, runs the callback, and clears the flag in `finally`. While the flag is
set, `record()` and `comment()` add `'source' => 'ai-assistant'` to the
metadata. The author stays the signed-in user.

The admin `OrderActivityResource` returns
`via_ai_assistant: bool`. The admin `ActivitySchema` gets
`via_ai_assistant: z.boolean().optional()`, and `timeline.tsx` shows
"via AI assistant" after the author name. The site
`Resources/Site/Order/OrderActivityResource` does not change, so customers
do not see the mark.

Alternative: a suffix in `describe()`. Rejected because `describe()` is also
used for the customer's view.

### D5. Order tools wrap `PerformOrderAction`

`update-fulfillment`, `mark-order-paid`, `resend-order-email` and
`cancel-order` build a `PerformOrderActionDTO` and call
`PerformOrderAction::execute()`. The preview runs the same guard without the
lock: it reads `OrderStatus::get_state()` and checks that the action is in
the allowed lists, and reads `transitions` for the next status. The
emails in the preview come from a map of action → mail in the tool, which
the tests check against the listeners in `app/Events/`.

`add-order-note` calls `OrderActivity::comment()` with the signed-in user.

`create-manual-order` builds the payload of `OrderCreateRequest` with
`is_manual` true. The preview calls `RecalculateCartAction` the same way as
`OrderCalculationController`. The change calls `CreateOrderAction`, which
checks stock, the shipping method and the provider again in its
transaction.

### D6. Narrow product and variant writes

- `ProductService::update_fields(int $id, array $fields)` updates only an
  allow-list of product columns and sets `updated_by`. It serves
  `update-product-content`.
- `ProductService::change_status(int $id, string $status, ?string $scheduled_at)`
  moves the status and timestamp logic of `update()` to a protected helper
  that both use, and dispatches `PublishScheduledProductJob` the same way.
  Trash and restore use the same timestamps as `bulk_trash()` and
  `bulk_restore()`.
- `create-draft-product` validates with the `ProductCreateRequest` rules and
  calls `CreateProductAction`. For a simple product it sends one variant with
  `has_variants` false. The tool forces `status` to `draft`.
- `duplicate-product` calls `DuplicateProductAction`, which already creates
  the copy as a draft.
- `VariantService::adjust_available(int $id, int $change, int $expected)`
  runs one `UPDATE ... SET available_quantity = available_quantity + %d
  WHERE id = %d AND track_inventory = 1 AND available_quantity = %d AND
  available_quantity + %d >= 0`, and returns true when one row changed.
- `update-prices` calls `VariantService::bulk_update()` with only the price
  columns, which already runs in one transaction.

### D7. Customer, coupon, pages and email writes

- `update-customer-tags` reads the customer, merges the tags (compared
  without case, the first spelling kept), and calls
  `CustomerService::update_profile()` with only `tags` and `notes`. It does not call
  `UpdateCustomerAction`, because that action also syncs addresses and the
  WordPress user.
- `create-coupon` and `update-coupon` validate with the rules of
  `CouponCreateRequest` and `CouponUpdateRequest`. `update-coupon` merges the
  sent fields onto the current coupon first, so the cross-field rules see the
  full coupon. A missing code comes from `CouponService::generate_new_code()`
  in the preview and is part of the hashed arguments, so the confirmed call
  must send it.
- `set-coupon-state` calls `change_activation_state()` or
  `DuplicateCouponAction`.
- `fix-store-pages` reads `Utils::get_site_pages()` and the page settings to
  build the preview, and calls `Utils::generate_site_pages()`.
- `update-email-notification` reads the `email` group with `Settings::get()`,
  changes the one notification in the array, and writes the group back with
  `Settings::get('email')->set()`, the same writer as `SettingsController`. The valid notifications
  come from `resources/data/settings/email.json`.

### D8. Result shape

Preview: `{ status: "preview", changes, confirmation_token, expires_at }`.
Done: `{ status: "done", ...stored values }`. Errors stay tool errors
(`Response::error()` or a `ValidationException` from `validate_arguments()`),
the same as the read tools. The text fields of customers and outside people
use the `_text` suffix and `store_text()`.

## Risks / Trade-offs

- [The AI calls the preview and the confirmed call without a stop.] → The
  token proves only that a preview existed. The destructive annotation and
  `requiresUserInteraction` make the client ask the merchant. The docs say
  this limit in "Where this differs".
- [A token in a client log can be used by another person.] → It is bound to
  the user, the tool and the arguments, lives 10 minutes and works one time.
- [Narrow service methods drift from the admin update logic.] → The status
  logic moves to one protected helper that `update()` and `change_status()`
  share. Integration tests compare a status change through the tool and
  through `update()`.
- [Manual order totals change between preview and change.] → The fingerprint
  includes the calculated totals, so the token is not valid when they change.
- [Write tools on a store without a way to turn them off.] → The user chose
  no toggle in this change. Each change still needs `manage_options` and a
  preview.

## Migration Plan

No data migration. The `source` value is new metadata on new activities only;
old activities have no mark. Rollback: remove the tools from
`StoreServer::$tools`.

## Corrections during implementation

- **`mark-order-paid` is not open-world.** The research marked it as
  open-world, but `OrderManager::mark_payment_as_paid()` dispatches no event
  and sends no email. The spec now gives it `openWorldHint` false.
- **`CreateOrderAction` is resolved when the tool runs.** Its constructor
  reads the base currency, so a tool that takes it in its constructor breaks
  `tools/list` on a store with no base currency. `CreateManualOrderTool`
  resolves it in `create_order()`. `CreateOrderAction::calculate()` is new:
  it runs the provider, address, shipping method and price steps of
  `execute()` without creating the order, for the preview.
- **`PerformOrderAction::guard()` is public**, so that the preview checks
  the state matrix with the same code as the change.
- **The email list of the order tools** comes from
  `OrderLifecycleResource::ACTION_EMAILS`, the map that the
  order-lifecycle resource already shows. `resume-fulfillment` sends no email.
- **"No price" means a price of 0.** `variants.base_price` is
  `NOT NULL DEFAULT 0`, so a variant without a price stores 0.
  `change-product-status` refuses to publish or schedule a product with a
  variant at 0. This is stricter than the admin form, which accepts 0; the
  merchant can still publish a free product in the admin.
- **Coupon and product input use the admin request classes.**
  `StoreWriteTool::form_request()` builds the admin `Request` subclass from a
  `WP_REST_Request` and runs its validation, so the tools get the same rules,
  money conversion and sanitizers as the admin endpoints.
- **`create-coupon` has `destructiveHint` false.** It only adds a coupon,
  the same as the two draft product tools, but it keeps the 2-step
  confirmation that the user chose.
- **A new coupon starts now when `start_datetime` is empty.** The default is
  set when the coupon is checked and created, not in the hashed arguments, so
  that the token of the preview stays valid.
- **The coupon tools take the fields of the admin coupon form only.** The
  spend condition and reward fields have rules in `CouponCreateRequest`, but
  the admin form does not send them, so the tools do not offer them.
