## Why

The store's MCP server has 11 tools, and all of them only read store data. A
merchant can ask "which orders are late?", but must then open the admin to
ship the orders, add tracking, publish a product or stop a leaked coupon.
Research (`reports/Kirki eCommerce MCP ideas.md`) lists 18 writes that the
plugin's own services already guard: fulfillment through the order state
matrix, coupons, products, stock, customer tags, store pages and emails.
WooCommerce's MCP has no write tools for coupons, customers or stock.

A write from an AI assistant has more risk than a read. The client can skip
its own prompt, and a tool annotation is only a hint. Thus each write that
changes existing data must show a preview first, and it must do the change
only when the second call brings a token from that preview.

## What Changes

- Add 18 write tools to `StoreServer`:
  - Orders: `kirki-ecommerce-add-order-note`, `kirki-ecommerce-update-fulfillment`,
    `kirki-ecommerce-mark-order-paid`, `kirki-ecommerce-resend-order-email`,
    `kirki-ecommerce-cancel-order`, `kirki-ecommerce-create-manual-order`.
  - Catalog: `kirki-ecommerce-update-product-content`,
    `kirki-ecommerce-create-draft-product`, `kirki-ecommerce-duplicate-product`,
    `kirki-ecommerce-change-product-status`, `kirki-ecommerce-adjust-stock`,
    `kirki-ecommerce-update-prices`.
  - Customers: `kirki-ecommerce-update-customer-tags`.
  - Coupons: `kirki-ecommerce-create-coupon`, `kirki-ecommerce-set-coupon-state`,
    `kirki-ecommerce-update-coupon`.
  - Store setup: `kirki-ecommerce-fix-store-pages`,
    `kirki-ecommerce-update-email-notification`.
- Add a 2-step confirmation on the server. A call without
  `confirmation_token` changes nothing and returns a preview and a token. The
  token is valid for one use, for 10 minutes, for the same user, tool and
  arguments, and only while the target record is not changed. A call with a
  valid token does the change and returns the stored values.
  `create-draft-product` and `duplicate-product` only add a draft, so they run
  in one call without a token.
- The 5 risky tools (`cancel-order`, `create-manual-order`, `update-prices`,
  `update-coupon`, `update-email-notification`) also set
  `_meta["anthropic/requiresUserInteraction"]`, so that Claude Code asks the
  merchant on each call.
- Each order activity that a write tool causes is marked as made by the AI
  assistant. The admin order timeline shows "via AI assistant" on that entry.
  The customer's order page does not show the mark.
- Add a stock change by a relative amount with an expected current quantity
  (`adjust-stock`). Today the admin can only set an absolute quantity.
- Add narrow service methods where the admin endpoint is too wide: change
  product text fields, change product status, and change one email
  notification. Each method keeps the data that the tool does not name.
- All write tools check `manage_options`, the same as the read tools. There is
  no setting to turn the write tools off in this change.

## Capabilities

### New Capabilities

- `mcp-write-tool-conventions`: access, annotations, the 2-step confirmation
  token, the AI-assistant mark on order activities, and the result and error
  rules that all write tools share.
- `mcp-order-write-tools`: the 6 order write tools.
- `mcp-catalog-write-tools`: the 6 product and variant write tools, with the
  relative stock change.
- `mcp-customer-write-tools`: the customer tags and note tool.
- `mcp-coupon-write-tools`: the 3 coupon write tools.
- `mcp-store-setup-write-tools`: the store pages tool and the email
  notification tool.

### Modified Capabilities

None. The read tools, resources and prompts keep their requirements. The
prompts stay read-only routines.

## Impact

- New code: `app/Mcp/Tools/StoreWriteTool.php` (base), 18 tool classes in
  `app/Mcp/Tools/`, a confirmation token store in `app/Mcp/`, and new
  integration tests in `tests/Integration/`.
- Changed code: `app/Mcp/Servers/StoreServer.php` (tool list and
  description), `app/Managers/OrderActivityManager.php` (AI-assistant mark),
  `app/Resources/Order/OrderActivityResource.php` (`via_ai_assistant`),
  `app/Services/ProductService.php` and `app/Services/VariantService.php`
  (narrow updates and the relative stock change), and the settings writer for
  one email notification.
- Admin app: `resources/app/features/orders/schemas/catalog/activity.ts` and
  `components/order-details/timeline.tsx` show the AI-assistant mark.
- Docs: `docs/mcp.md` gets the write tools, the confirmation flow and the
  "Where this differs" items.
- No new tables, no new routes and no new dependencies. Tokens use WordPress
  transients.
