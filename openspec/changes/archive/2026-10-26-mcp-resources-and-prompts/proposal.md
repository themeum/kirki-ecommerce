## Why

The store's MCP server has 11 read-only tools, but no resources and no
prompts. Two gaps follow from this:

- The assistant does not know the store's fixed facts: its name, base
  currency, order statuses, which action emails the customer, and how the
  Analytics page counts sales. It must guess, or call several tools to find
  out.
- The merchant must know what to ask. Research
  (`reports/Kirki eCommerce MCP ideas.md`) found that 29% of Shopify merchants
  who do not use AI do not know what the tools can do. Prompts show ready-made
  routines, such as a morning brief, as slash commands.

The `framework-mcp` package already supports resources and prompts and gives
them to the MCP Adapter. WooCommerce's MCP has no resources and no prompts.

## What Changes

- Add 7 read-only resources to `StoreServer`. Each one has a fixed URI and
  returns JSON:
  - `kecom://store/profile`: store name, contact data, address, industry,
    selling countries, base currency, time zone, order and invoice number
    format.
  - `kecom://store/order-lifecycle`: order statuses, the allowed actions for
    each status, and which action sends which email, with the email's on or
    off state.
  - `kecom://store/analytics-definitions`: the counting rules of the
    Analytics page, the range presets, the comparisons, the granularity rules
    and the top-N limits.
  - `kecom://store/checkout-and-payments`: enabled payment methods (names and
    online or offline only), guest checkout, the coupon field, the customer
    note and the legal consents. No credentials.
  - `kecom://store/tax-and-shipping`: tax settings, tax regions, and shipping
    zones with their methods and rates.
  - `kecom://store/currencies`: active currencies, base currency, exchange
    rates, and the last and next rate sync. No API keys.
  - `kecom://catalog/structure`: the category tree, brands, collections, tags
    and attributes, with product counts. Each list has a size cap.
- Add 6 prompts to `StoreServer`. Each prompt returns instructions that tell
  the assistant which existing tools to call and what to give the merchant.
  All 6 are read-only routines:
  - `morning-brief`: yesterday's results against the same day last week, the
    orders that need action, and stock that needs attention.
  - `weekly-review`: wins, losses, top products and categories, coupon and
    country results, and three suggested actions.
  - `monthly-close`: a table for the accountant for one month: sales totals,
    tax by region, payment method and shipping method totals.
  - `low-stock-check`: a reorder list, out-of-stock items first, best sellers
    first in each group.
  - `investigate-order`: a summary of one order and a draft reply to the
    customer. The prompt does not send anything.
  - `setup-guide`: the open setup steps in order, with links to the admin
    pages.
- Only users with `manage_options` can read a resource or get a prompt, the
  same as the tools.
- No new tool. The 4 other prompts in the research report
  (`fulfillment-backlog`, `bfcm-prep`, `win-back-list`,
  `write-product-description`) need tools that do not exist yet. They are not
  in this change.

## Capabilities

### New Capabilities

- `mcp-store-resources`: the 7 resources, their URIs and contents, what they
  must never contain (credentials, customer data), and their access check.
- `mcp-store-prompts`: the 6 prompts, their arguments and free-text argument parsing with a
  fall-back,
  the tools that each prompt names, and their access check.

### Modified Capabilities

- `mcp-server`: the server also offers resources and prompts, and each one
  checks its own access, the same as a tool.

## Impact

- New code: `app/Mcp/Resources/` (7 resources and a base class),
  `app/Mcp/Prompts/` (6 prompts and a base class), and
  `app/Mcp/Servers/StoreServer.php` (`$resources` and `$prompts` lists).
- Read only. The resources read the settings groups, the order state matrix,
  `CurrencyService`, `PaymentManager` and the catalog models. No service
  changes. No database changes.
- `docs/mcp.md` gets sections for resources and prompts.
- Client support: Claude, Claude Code, VS Code and Cursor show resources and
  prompts. ChatGPT supports tools only, so it gets no benefit from this
  change. The prompts use only the existing tools, so they do not depend on
  resource support.
- The vendor packages (`framework`, `framework-mcp`) do not change.
