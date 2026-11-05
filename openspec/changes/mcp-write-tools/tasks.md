Verify command (VERIFY) for each group: `bash kirki-ecommerce-test integration --filter='Mcp'`, `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/`.

## 1. Shared base and confirmation tokens

- [x] 1.1 Move `money()`, `datetime()` and `store_text()` from `StoreReadTool` to a new `App\Mcp\Concerns\ReadsStoreValues` trait, and use it in `StoreReadTool` (read tool output does not change)
- [x] 1.2 Move the order lookup by `order_id` or `order_number` from `GetOrderTool` to a new `App\Mcp\Concerns\FindsOrders` concern, and use it in `GetOrderTool`
- [x] 1.3 Add `App\Mcp\ConfirmationTokens` with `issue()` and `claim()` on transients, 600 seconds, bound to user, tool and the sorted-arguments hash, one use (design D2)
- [x] 1.4 Add `App\Mcp\Tools\StoreWriteTool`: annotations, `manage_options` check, the `handle()` flow of design D1 (validate, target, preview, issue or claim, fingerprint check, apply, result), `requires_confirmation()`, the optional `confirmation_token` argument, decimal money helper (design D3)
- [x] 1.5 Add `tests/Integration/McpStoreWriteToolTest.php` with a test tool: preview changes nothing, confirmed change, other arguments, other user, used token, expired token, changed fingerprint, editor rejected, additive tool runs in one call
- [x] 1.6 VERIFY

## 2. AI-assistant mark on order activities

- [x] 2.1 Add `OrderActivityManager::as_assistant(callable)` and add `'source' => 'ai-assistant'` in `record()` and `comment()` while it runs (design D4)
- [x] 2.2 Add `via_ai_assistant` to the admin `OrderActivityResource`; leave the site resource as it is
- [x] 2.3 Add `via_ai_assistant: z.boolean().optional()` to `ActivitySchema` and show "via AI assistant" after the author in `features/orders/components/order-details/timeline.tsx` (translatable string); update `activity-form.test.ts` if the schema test covers the catalog schema
- [x] 2.4 Integration test: an activity written inside `as_assistant()` has the mark in the admin resource and not in the site resource; an activity outside it has no mark
- [x] 2.5 VERIFY

## 3. Order write tools

- [x] 3.1 `AddOrderNoteTool` (`message`, `notify_customer`, preview names the masked email when notified)
- [x] 3.2 `UpdateFulfillmentTool` (6 actions, tracking fields for `add-tracking`, preview with current and next status from the state matrix and the emails) through `PerformOrderAction`
- [x] 3.3 `MarkOrderPaidTool` (optional registered `payment_provider`) through `PerformOrderAction`
- [x] 3.4 `ResendOrderEmailTool` through `PerformOrderAction`
- [x] 3.5 `CancelOrderTool` (`reason` 1–500, `_meta` requiresUserInteraction) through `PerformOrderAction`
- [x] 3.6 `CreateManualOrderTool` (items, customer, addresses, shipping method, coupons, provider; preview totals from `RecalculateCartAction`; fingerprint with totals, prices, stock and coupons; `_meta` requiresUserInteraction) through `CreateOrderAction`
- [x] 3.7 Add the 6 tools to `StoreServer::$tools` and change the server description to "Tools read or change store data"
- [x] 3.8 `tests/Integration/McpOrderWriteToolsTest.php`: each spec scenario of `mcp-order-write-tools`, the AI-assistant mark on each order activity, and annotations and `_meta` of the 6 tools
- [x] 3.9 VERIFY

## 4. Catalog write tools

- [x] 4.1 Add `ProductService::update_fields()` and `ProductService::change_status()`, with the status and timestamp logic of `update()` moved to one protected helper that both use (design D6); integration test that `update()` keeps its behavior
- [x] 4.2 Add `VariantService::adjust_available()` as one conditional `UPDATE` (design D6), with an integration test for the expected-quantity, tracking and below-zero cases
- [x] 4.3 `UpdateProductContentTool` (allow-listed fields, old and new values)
- [x] 4.4 `CreateDraftProductTool` (simple product by default, attributes and variants when sent, `ProductCreateRequest` rules, status forced to draft, no token)
- [x] 4.5 `DuplicateProductTool` (no token)
- [x] 4.6 `ChangeProductStatusTool` (draft, published, scheduled with future `scheduled_at`, trashed; reject publish when a variant has no price)
- [x] 4.7 `AdjustStockTool` (`quantity_change`, `expected_quantity`)
- [x] 4.8 `UpdatePricesTool` (1–100 variants, sale price not over price, one transaction through `bulk_update()`, `_meta` requiresUserInteraction)
- [x] 4.9 Add the 6 tools to `StoreServer::$tools`
- [x] 4.10 `tests/Integration/McpCatalogWriteToolsTest.php`: each spec scenario of `mcp-catalog-write-tools` and the annotations of the 6 tools
- [x] 4.11 VERIFY

## 5. Customer, coupon and store setup write tools

- [x] 5.1 `UpdateCustomerTagsTool` (`add_tags`, `remove_tags`, `notes`; tags compared without case; through `CustomerService::update_profile()`)
- [x] 5.2 `CreateCouponTool` (`CouponCreateRequest` rules, generated code in the preview, plain-words rule summary)
- [x] 5.3 `SetCouponStateTool` (`activate`, `deactivate`, `duplicate`; reject a state that is already set)
- [x] 5.4 `UpdateCouponTool` (merge sent fields onto the current coupon, `CouponUpdateRequest` rules, `_meta` requiresUserInteraction)
- [x] 5.5 `FixStorePagesTool` (preview lists pages to create and to publish; no token when nothing is missing)
- [x] 5.6 `UpdateEmailNotificationTool` (`recipient`, `group`, `key`; `is_enabled`, `subject`, `heading`; valid keys from `email.json`; `_meta` requiresUserInteraction)
- [x] 5.7 Add the 6 tools to `StoreServer::$tools`
- [x] 5.8 `tests/Integration/McpCustomerWriteToolsTest.php`, `McpCouponWriteToolsTest.php` and `McpStoreSetupWriteToolsTest.php`: each spec scenario and the annotations
- [x] 5.9 Update `McpServerTest` for the tool count of 29 and the server description
- [x] 5.10 VERIFY

## 6. Docs and final check

- [x] 6.1 Update `docs/mcp.md`: the 18 write tools in tables, the preview and confirmation flow with an example, the AI-assistant mark, and new items in "Where this differs" (the token does not prove a person approved, no write toggle, no audit log, no refunds or hard deletes)
- [x] 6.2 Live check on the docker site: `tools/list` shows 29 tools with the right annotations and `_meta`; a preview and a confirmed call for one order tool and one catalog tool
- [x] 6.3 VERIFY, plus `bash kirki-ecommerce-test integration`, `composer test:unit` (run as `bash kirki-ecommerce-test unit`, because `composer test:unit` prints no result on the host) and `openspec validate mcp-write-tools --strict`
