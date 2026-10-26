# eCommerce and Payments MCP Servers for Merchants (status: October 2026)

Scope: merchant/admin-facing MCP servers, with storefront/shopper-facing servers noted separately. Research date: 2026-10-26. About 23 web lookups. Where a primary page did not list tool names, this is stated as a gap. No tool names were invented.

---

## 1. WooCommerce MCP (WordPress Abilities API + WordPress MCP Adapter)

### Takeaway
WooCommerce MCP is a developer preview. It now runs on the WordPress MCP Adapter plugin. The adapter exposes three generic meta-tools (discover / get-info / execute ability), not one MCP tool for each ability. Since 10.9 (June 2026), WooCommerce ships 7 "canonical" abilities for products and orders only. There are no canonical abilities for customers, coupons or reports. The old REST-derived bridge (`/wp-json/woocommerce/mcp`, REST API keys) was removed in 11.3. Auth is a WordPress user + Application Password, and each ability runs its own `permission_callback`.

### Cited Findings

**Timeline**
- WooCommerce 10.3 (October 2025) shipped the first MCP version as a beta. You enabled it at WooCommerce > Settings > Advanced > Features > "Enable MCP Beta", or with option `woocommerce_feature_mcp_integration_enabled`, or with the `woocommerce_features` filter key `mcp_integration` — [Call for Testing: WooCommerce MCP Beta (2025-11-03)](https://developer.woocommerce.com/2025/11/03/call-for-testing-woocommerce-mcp-beta/)
- The 10.3 beta abilities: products list/get/create/update/delete, and orders list/get/create/update. There is no order delete — [Call for Testing](https://developer.woocommerce.com/2025/11/03/call-for-testing-woocommerce-mcp-beta/); [WooCommerce blog: WooCommerce MCP](https://woocommerce.com/posts/woocommerce-mcp/)
- The 10.3 beta abilities were thin bridges over the REST API, so REST API permissions controlled access — [WooCommerce blog](https://woocommerce.com/posts/woocommerce-mcp/)
- The beta required HTTPS (or a local dev environment) and used the local `mcp-wordpress-remote` proxy to turn MCP stdio into HTTP — [Call for Testing](https://developer.woocommerce.com/2025/11/03/call-for-testing-woocommerce-mcp-beta/)
- WooCommerce 10.9 (scheduled 2026-06-23) added "canonical" domain abilities with strict input/output schemas, WooCommerce-aware enums and permission callbacks. Query abilities are marked readonly and idempotent. The REST-derived set became a deprecated transition path — [Introducing canonical WooCommerce abilities for products and orders (2026-05-12)](https://developer.woocommerce.com/2026/05/12/mcp-abilities-api-10-9/)
- WooCommerce 11.3 removed the old `/wp-json/woocommerce/mcp` endpoint (it now returns HTTP 410 with a JSON-RPC error). It also removed the REST-derived abilities (for example `woocommerce/products-list`, `woocommerce/orders-get`) and the filters `woocommerce_mcp_include_ability`, `woocommerce_mcp_allow_insecure_transport` and `woocommerce_check_rest_ability_permissions_for_method` — [WooCommerce MCP developer docs](https://developer.woocommerce.com/docs/features/mcp/)

**Canonical abilities (10.9+, current)** — source: [10.9 post](https://developer.woocommerce.com/2026/05/12/mcp-abilities-api-10-9/)

| Ability | R/W | Guard / notes |
|---|---|---|
| `woocommerce/products-query` | Read | readonly + idempotent annotation |
| `woocommerce/product-create` | Write | product type aliases: `physical`, `virtual`, `digital`, `affiliate`, `grouped` |
| `woocommerce/product-update` | Write | same aliases |
| `woocommerce/product-delete` | Write (destructive) | moves to trash by default; permanent delete needs `force: true`; if trash is disabled and `force` is not set, it returns an error and does not hard-delete |
| `woocommerce/orders-query` | Read | readonly + idempotent; filters: ID, status, customer ID, billing email, parent order, excluded IDs, created/modified date ranges, sort; line items omitted unless `include_line_items: true` |
| `woocommerce/order-update-status` | Write | rejects no-op status changes |
| `woocommerce/order-add-note` | Write | adds note without status change; note attributed to the acting user |

- The current docs also name `woocommerce/order-notes-query` (read) — [WooCommerce MCP docs](https://developer.woocommerce.com/docs/features/mcp/)
- Unknown fields and unsupported enum values are rejected before execution. The HTTP run-route method follows annotations: readonly = GET, destructive + idempotent = DELETE, other writes = POST — [10.9 post](https://developer.woocommerce.com/2026/05/12/mcp-abilities-api-10-9/)

**MCP surface (how a client sees it)**
- Default server endpoint: `https://yourstore.com/wp-json/mcp/mcp-adapter-default-server`. `tools/list` returns three adapter tools: `mcp-adapter-discover-abilities`, `mcp-adapter-get-ability-info`, `mcp-adapter-execute-ability`. It does not return one tool for each WooCommerce ability — [WooCommerce MCP docs](https://developer.woocommerce.com/docs/features/mcp/)
- The MCP Adapter plugin is not bundled with WooCommerce. You install it with `wp plugin install mcp-adapter --activate`. Abilities are always registered, and no WooCommerce setting turns MCP on — [WooCommerce MCP docs](https://developer.woocommerce.com/docs/features/mcp/)
- Custom abilities are exposed only when `meta.mcp.public` is `true` (fallback: top-level `meta.public`). Abilities are private by default — [WooCommerce MCP docs](https://developer.woocommerce.com/docs/features/mcp/); [WordPress/mcp-adapter README](https://github.com/WordPress/mcp-adapter)

**Auth and permissions**
- Remote HTTP: WordPress username + Application Password. The docs say do not use the account password or a WooCommerce REST API key. Local: STDIO through WP-CLI `wp mcp-adapter serve --server=mcp-adapter-default-server --user=admin` (no Application Password). The remote proxy is `@automattic/mcp-wordpress-remote` with env vars `WP_API_URL`, `WP_API_USERNAME`, `WP_API_PASSWORD` — [WooCommerce MCP docs](https://developer.woocommerce.com/docs/features/mcp/)
- The default server requires an authenticated user with the `read` capability. Each ability then runs its own permission check against the WooCommerce permission model — [WooCommerce MCP docs](https://developer.woocommerce.com/docs/features/mcp/); [10.9 post](https://developer.woocommerce.com/2026/05/12/mcp-abilities-api-10-9/)
- Recommended practice: a dedicated least-privilege user, HTTPS, revoke unused Application Passwords, do not commit configs. There is a PII warning (names, emails, addresses, payment details). Ability errors are logged under source `woocommerce-abilities` in WooCommerce > Status > Logs — [WooCommerce MCP docs](https://developer.woocommerce.com/docs/features/mcp/)
- The removed endpoint used a WooCommerce REST API key in the `X-MCP-API-Key` header (DEPRECATED/REMOVED) — [WooCommerce MCP docs](https://developer.woocommerce.com/docs/features/mcp/)

### Inferences
- Kirki is a WordPress plugin, so the WooCommerce pattern (register abilities with `wp_register_ability`, opt in with `meta.mcp.public`, set readonly/destructive/idempotent annotations, and let the MCP Adapter serve them) is the most direct reference design. A store can install both plugins and get one MCP endpoint that covers both.
- WooCommerce has a clear coverage gap: no customers, coupons, refunds, inventory or analytics/report abilities. Kirki could stand out there. (The Kirki repo already has a sales-report MCP tool.)
- The meta-tool pattern (discover/info/execute) saves context, but it hides abilities from clients that only read `tools/list`. Stripe (`stripe_api_read`/`write`) and Square (`make_api_request`) use the same "few generic tools" pattern.

### Gaps
- The docs do not list the per-ability WooCommerce capability (for example `edit_products`, `edit_shop_orders`) behind each `permission_callback`.
- The docs do not give the destructive/idempotent annotation values for each write ability (only product-delete soft-delete behaviour is documented).
- No confirmation/preview step for destructive WooCommerce abilities was found. Confirmation is left to the MCP client.
- I did not confirm whether WooCommerce 11.x added coupon, customer or report abilities after 10.9. The 11.3 docs name only product/order/order-note abilities.

---

## 2. Shopify MCP servers and Sidekick

### Takeaway
Shopify has no official Admin-API MCP server for merchants' store data. Its official servers are: Dev MCP (docs/schema/validation for developers, local, no auth), shopper-facing storefront servers that moved to the Universal Commerce Protocol endpoint `/api/ucp/mcp` (Catalog, Cart, Ask, Checkout, Order), and the Customer Account MCP (OAuth for the logged-in customer). Merchant admin automation sits in Sidekick, which proposes changes for review before it applies them. Community servers fill the admin gap.

### Cited Findings

**Storefront / shopper-facing (note separately — not merchant admin)** — source: [Shopify Storefront MCP docs](https://shopify.dev/docs/apps/build/storefront-mcp)

| Server | Endpoint | Tools | Status |
|---|---|---|---|
| Storefront MCP (legacy) | `https://{shop}/api/mcp` | `search_catalog`, `get_product_details`, `get_cart`, `update_cart`, `search_shop_policies_and_faqs` | DEPRECATED. Catalog and cart tools removed; the policy/FAQ tool still works |
| Catalog MCP (UCP) | `https://{shop}/api/ucp/mcp` | `search_catalog`, `lookup_catalog`, `get_product` | Current |
| Cart MCP (UCP) | same | `create_cart`, `get_cart`, `update_cart`, `cancel_cart` (`update_cart` replaces the full cart) | Current |
| Ask MCP (UCP) | same | `ask_business` (policy/FAQ answers) | Current; replaces `search_shop_policies_and_faqs` |
| Checkout MCP | not stated | not named | Every request must be authenticated or signed |
| Order MCP (UCP) | not stated | not named | Order tracking |

- Every request to `/api/ucp/mcp` must include an agent profile — [Shopify Storefront MCP docs](https://shopify.dev/docs/apps/build/storefront-mcp)
- A secondary source says the legacy `/api/mcp` deprecation came in June 2026, with support until the end of August 2026 — [mcp.directory blog (secondary, single source)](https://mcp.directory/blog/shopify-mcp-complete-guide-2026)

**Customer Account MCP (shopper-facing, post-purchase)**
- Endpoint discovered from `https://{shopDomain}/.well-known/customer-account-api` (`mcp_api` field), for example `https://{shopDomain}/customer/api/mcp`. Auth: OAuth 2.0 authorization code + PKCE, discovered from `/.well-known/openid-configuration`, scope `customer-account-mcp-api:full`. A 401 response starts the OAuth flow. The app must request protected customer data (name, email, phone, address) with a reason for each field. The store must have a custom domain. Tools are found through `tools/list` and cover order status/details, account details/preferences and returns. The page does not name individual tools — [Shopify Customer Accounts MCP docs](https://shopify.dev/docs/apps/build/customer-accounts-mcp)

**Dev MCP (developer-facing)**
- Runs locally and does not need authentication. It is part of a toolkit that validates GraphQL against Shopify schemas. Store-management tasks go through Shopify CLI's authenticated store context, and "you choose when to execute them". Older skills such as `shopify-admin` are deprecated — [Shopify Dev MCP docs](https://shopify.dev/docs/apps/build/devmcp)
- A secondary source says Shopify open-sourced the "Shopify AI Toolkit" (Dev MCP) on 2026-04-09. It also says developers can run Admin API queries against their own shop with changes blocked by default — [activepieces / blog aggregator results (secondary)](https://www.activepieces.com/blog/shopify-mcp-server-2026-setup-guide.md)
- Secondary sources list four official Shopify MCP servers: Dev, Storefront, Customer Account, and Checkout (preview for select partners) — [chatarmin comparison (secondary)](https://chatarmin.com/en/blog/mcp-servers-e-commerce)

**Admin / merchant (community, not official)**
- The most popular community admin server is `shopify-mcp` by GeLi2001 (about 169 stars, 31 tools: CRUD for products, customers, orders, metafields, inventory, tags). Guidance: create a Custom App with the minimum scopes (for example read-only) to limit what an agent can change — [aggregated from trueprofit / polaranalytics / mcp.directory search results (secondary)](https://trueprofit.io/blog/best-mcp-servers)

**Sidekick (merchant admin assistant reference)**
- Shopify Help Centre (as quoted in secondary sources): Sidekick analyses data, manages orders and edits products. It shows you changes for review before it applies them — [polaranalytics guide (secondary, quoting Shopify Help Centre)](https://www.polaranalytics.com/post/shopify-mcp-server-connect-your-store-to-claude-ai)
- Winter '26 / Spring '26: Sidekick moved from answers to multi-step actions (for example create a product, set up a discount, schedule a campaign in one conversation). It proposes actions and waits for merchant confirmation. Destructive actions get a confirmation card. Third-party app actions need the app to publish a tool integration (launch partners named: Klaviyo, Judge.me, Yotpo, Loop, Smile) — [getkanal Sidekick guide (secondary)](https://getkanal.com/blog/shopify-sidekick-guide.md); [chattergo deep dive (secondary)](https://www.chattergo.com/blog/shopify-sidekick-deep-dive-from-chatbot-to-agentic-copilot); [webkul Spring '26 (secondary)](https://webkul.com/blog/shopify-editions-spring-26/). The sources disagree on whether Sidekick can edit theme files.

### Inferences
- Sidekick shows the target UX for an admin assistant: read analytics, then propose a write, then a confirmation card, then execute. This matches Stripe's human-confirmation URL pattern (section 6).
- Shopify keeps official MCP for shoppers (via UCP) and keeps merchant admin inside its own assistant. A WordPress plugin can offer an admin MCP that Shopify does not officially offer.

### Gaps
- Exact Dev MCP tool names are not on the current primary page. (In 2025 they included names like `learn_shopify_api`, `search_docs_chunks`, `fetch_full_docs`, `introspect_graphql_schema`, `validate_graphql_codeblocks`, but I could not verify these as current. The github.com/Shopify/dev-mcp URL returned 404, so the repo may be moved or renamed.)
- Customer Account MCP and Checkout MCP tool names are not published on the pages I fetched.
- No primary Shopify source for the Sidekick confirmation-card wording was retrieved. The Sidekick claims are secondary.

---

## 3. Other commerce platforms (BigCommerce, Wix, Squarespace, Magento/Adobe Commerce, Medusa, Saleor, commercetools)

### Takeaway
Vendor-official merchant-data servers exist for Saleor (read-only), commercetools (Commerce MCP, in development, paid for production) and Wix (docs + site management + site API calls). BigCommerce's official server is a beta, shopper-facing storefront server (search, product detail, cart, checkout handoff). Adobe Commerce, Medusa and Squarespace have no official server found. Only community or third-party servers exist for them.

### Cited Findings

| Platform | Server | Facing | Tools / scope | Write? | Source |
|---|---|---|---|---|---|
| BigCommerce | Official MCP Server (beta, AI Labs approval, Settings > Early access) | Shopper (B2C guest; B2B "coming soon") | product search, product detail, cart creation, checkout handoff (no tool names published) | Cart only | [BigCommerce beta MCP](https://developer.bigcommerce.com/beta/mcp-server); [BigCommerce MCP overview](https://docs.bigcommerce.com/developer/api-reference/mcp/overview) |
| BigCommerce | StackOne hosted connector | Admin | about 120 CRUD actions | Yes | [StackOne](https://stackone.com/connectors/bigcommerce/mcp/) |
| BigCommerce | isaacgounton/bigcommerce-api-mcp (community) | Admin | products, customers, orders via REST | Yes | [Glama listing](https://glama.ai/mcp/servers/@isaacgounton/bigcommerce-api-mcp) |
| BigCommerce | CData (local) | Admin | SQL-style access to data | Read-only | [CData](https://www.cdata.com/drivers/bigcommerce/download/mcp/) |
| Wix | Official Wix MCP, `https://mcp.wix.com/mcp` (HTTP/SSE) | Developer + site owner | search Wix docs (Design System, REST, SDK, Build Apps, Headless), read full docs, API method schemas, list sites, call site APIs, manage sites, collect feedback; all tools enabled by default | Yes (via site API calls) | [wix/wix-mcp README via Glama](https://glama.ai/mcp/servers/@wix/wix-mcp/blob/c976314fd8f60267e852992b37e0751d14d0472f/README.md) |
| Saleor | Official saleor-mcp, `https://mcp.saleor.app/mcp` (Streamable HTTP); local `uv run saleor-mcp` | Admin | fetch products, customers, orders (tool names not listed) | Read-only: "doesn't trigger any mutations" | [github.com/saleor/saleor-mcp](https://github.com/saleor/saleor-mcp) |
| commercetools | Commerce MCP (managed or self-hosted; "under development") | Admin / agent | "extensive set of tools" for carts, orders and other resources; field filtering; scoped access via API client credentials; custom tools when self-hosted | Yes | [commercetools MCP overview](https://docs.commercetools.com/sdk/mcp/overview); [dev-tooling overview](https://docs.commercetools.com/dev-tooling/mcp/overview) |
| commercetools | Knowledge/Developer MCP (free) | Developer | docs search, GraphQL/OAS access, query/mutation validation, prompt `commercetools-developer-tips` | n/a | [commercetools MCP overview](https://docs.commercetools.com/sdk/mcp/overview) |
| Adobe Commerce | Marketplace extension "MCP" (webdevs-ltd) | Admin | catalog data | Read-only | [Adobe Commerce Marketplace](https://commercemarketplace.adobe.com/webdevs-ltd-module-mcp.html) |
| Adobe Commerce | Cequence AI Gateway connector | Admin | products, orders, customers, catalog, sales analytics | Yes | [Cequence docs](https://docs.aigateway.cequence.ai/docs/applications/ecommerce/adobe-commerce) |
| Medusa | medusa-mcp (community) | Admin | products, orders, inventory, pricing via Medusa JS SDK | Yes | [ecommerceguide listing (secondary)](https://ecommerceguide.com/use-cases/headless-ai/?type=mcp) |

- Saleor auth: headers `X-Saleor-API-URL` and `X-Saleor-Auth-Token`. The token needs MANAGE_PRODUCTS and MANAGE_ORDERS. It supports Saleor 3.21+ on saleor.cloud domains — [saleor-mcp](https://github.com/saleor/saleor-mcp). A third-party listing says it can update orders. That conflicts with the README. Trust the README.
- commercetools licensing: non-production use is free up to 1,000,000 tool invocations. Production needs a paid licence — [commercetools dev-tooling overview](https://docs.commercetools.com/dev-tooling/mcp/overview)

### Inferences
- "Read-only by default" is common for official admin servers (Saleor, CData, the Adobe extension). Kirki could ship read tools first and gate writes behind a setting.
- Most official servers use generic "call any API" tools (Wix site API calls, Stripe, Square). Saleor and WooCommerce use curated domain tools. For a WP plugin aimed at non-developer merchants, curated tools with strict schemas are safer.

### Gaps
- I found no Squarespace MCP server (official or community) in search results.
- No official Medusa MCP server was found.
- The commercetools Commerce MCP tool catalog (exact names, read-only/allowed-action config) is on the linked "Commerce MCP" page, which I did not fetch.
- BigCommerce official tool names are not published.

---

## 4. Payments MCP servers: Stripe, PayPal, Square

### Takeaway
Stripe's remote server (`https://mcp.stripe.com`) now uses a small set of generic tools (`stripe_api_search/details/read/write`) plus account, analytics, Treasury and docs tools. It forces human confirmation through a Dashboard URL for risky writes such as refunds and outbound payments. PayPal exposes about 30 named, domain-specific tools (invoices, orders/refunds, disputes, shipment tracking, subscriptions, catalog, insights). Square exposes 3 generic tools over 38 services with a `DISALLOW_WRITES` read-only switch.

### Cited Findings

**Stripe** — source: [docs.stripe.com/mcp](https://docs.stripe.com/mcp)

| Group | Tool | R/W |
|---|---|---|
| API | `stripe_api_search` — find API methods by keyword | Read |
| API | `stripe_api_details` — parameter info for a method | Read |
| API | `stripe_api_read` — any supported `GET` method | Read |
| API | `stripe_api_write` — any supported `POST/PATCH/PUT/DELETE` method | Write |
| Account | `get_stripe_account_info` | Read |
| Atlas | `atlas_company_formation` | Write |
| Analytics | `stripe_analytics` (preview; metrics, subscriptions, billing, financial reports; natural-language SQL with Sigma) | Read |
| Treasury (public preview) | `get_balance_summary` (interactive), `convert_currency`, `send_money`, `setup_recipient`, `transfer_money` | Read / Write |
| Other | `search_stripe_documentation`, `stripe_implementation_planner`, `send_stripe_feedback` | Read |

- Supported API methods behind read/write include: customers (list/retrieve/create/update), charges, refunds (list/retrieve/create), PaymentIntents, PaymentMethods, Checkout Sessions (incl. create), invoices (create/update/finalize/void/mark uncollectible/preview), invoice items, credit notes (list), subscriptions (create/update/cancel), coupons (incl. delete), promotion codes, products, prices, payment links (create/update), disputes (list/retrieve/update), webhook endpoints, events, customer portal, balance, balance transactions, payouts, tax settings/registrations/calculations, and Issuing — [docs.stripe.com/mcp](https://docs.stripe.com/mcp)
- Auth: OAuth (consent page lets you pick live/sandbox accounts and set permissions for each environment), or "agent API keys" (badge "Agent") as bearer token. From December 2026, full-access secret keys and restricted keys without the Agent tag are rejected with 401 + OAuth discovery challenge (migrate by 2026-11-30) — [docs.stripe.com/mcp](https://docs.stripe.com/mcp)
- Admins can enable/disable MCP access for the whole team, separately for live mode and sandbox. They can view and revoke OAuth sessions for each user — [docs.stripe.com/mcp](https://docs.stripe.com/mcp)
- **Human confirmation:** "Stripe requires human confirmation before it takes certain `stripe_api_write` actions, such as refunds and outbound payments." The agent gives the user a URL. The user reviews and clicks Approve. Stripe returns an approval token, and the agent retries. Approvals expire after 24 hours — [docs.stripe.com/mcp](https://docs.stripe.com/mcp)
- Stripe tells users to turn on client tool-approval and warns about prompt injection when other servers are combined. Tool-call logs are visible in Workbench. Connect platforms pass a `Stripe-Account` header (OAuth is not supported for connected accounts) — [docs.stripe.com/mcp](https://docs.stripe.com/mcp)
- Stripe now recommends setup through `stripe agent setup` (plugin + skills) — [docs.stripe.com/mcp](https://docs.stripe.com/mcp)

**PayPal** — source: [PayPal Agent Tools catalog](https://developer.paypal.com/ai-tools/agent-tools/); setup: [PayPal MCP server docs](https://developer.paypal.com/tools/mcp-server/)

| Group | Tools | R/W |
|---|---|---|
| Catalog | `create_product`, `list_product`, `show_product_details` | W / R / R |
| Disputes | `list_disputes`, `get_dispute`, `accept_dispute_claim` | R / R / W (concedes to buyer) |
| Invoices | `create_invoice`, `list_invoices`, `get_invoice`, `send_invoice`, `send_invoice_reminder`, `cancel_sent_invoice`, `generate_invoice_qr_code` | mix |
| Payments | `create_order`, `pay_order` (capture), `get_order`, `create_refund` (full/partial), `get_refund` | mix |
| Reporting | `get_merchant_insights` (sales/order analytics by date range and interval), `list_transaction` | R |
| Shipment tracking | `create_shipment_tracking`, `get_shipment_tracking`, `update_shipment_tracking` | mix |
| Subscriptions | `create_subscription_plan`, `list_subscription_plans`, `show_subscription_plan_details`, `create_subscription`, `show_subscription_details`, `update_subscription`, `cancel_subscription` | mix |
| Remote, gift cards only (header `x-feature-flags: commerce:true`) | `search_product`, `create_cart`, `checkout_cart` | shopper-facing |

- Local: `npx -y @paypal/mcp --tools=all`, `PAYPAL_ACCESS_TOKEN`, `PAYPAL_ENVIRONMENT=SANDBOX|PRODUCTION`. Remote: `https://mcp.paypal.com` (sandbox `https://mcp.sandbox.paypal.com`), `/sse` and `/http` transports, PayPal login consent on first connect. The docs give no safety/confirmation guidance beyond "use sandbox for testing" — [PayPal MCP server docs](https://developer.paypal.com/tools/mcp-server/)
- The `--tools=` flag lets you choose a subset of tools (scoping by tool selection) — [PayPal MCP server docs](https://developer.paypal.com/tools/mcp-server/)
- An older PayPal limited-release page said the remote server had only 2 tools. The current page says the full catalog is available. This is a conflict, and the newer page is likely current — [PayPal limited-release](https://developer.paypal.com/limited-release/agents/) vs [PayPal MCP server docs](https://developer.paypal.com/tools/mcp-server/)

**Square** — sources: [Square MCP docs](https://developer.squareup.com/docs/mcp); [github.com/square/square-mcp-server](https://github.com/square/square-mcp-server)
- Status: Beta. Remote `https://mcp.squareup.com/mcp` (OAuth, scopes chosen at sign-in, production only). Local `npx square-mcp-server start` with `ACCESS_TOKEN`, `SANDBOX`/`PRODUCTION`, `DISALLOW_WRITES`, `SQUARE_VERSION`. Square keeps an allowlist of MCP clients — [Square MCP docs](https://developer.squareup.com/docs/mcp)
- Tools: `get_service_info` (list the methods of a service), `get_type_info` (parameter requirements), `make_api_request` (execute). There are 38 services, including orders, payments, checkout, refunds, invoices, subscriptions, catalog, inventory, customers, customer groups/segments, gift cards, loyalty, bookings, labor, team, locations, merchants, devices, terminal, disputes, payouts, webhook subscriptions — [square-mcp-server](https://github.com/square/square-mcp-server)
- `DISALLOW_WRITES=true` restricts the server to read-only operations — [Square MCP docs](https://developer.squareup.com/docs/mcp)

### Inferences
- The PayPal list is the closest model for an eCommerce plugin's named tool set: `create_refund`, `get_merchant_insights`, `list_transaction`, shipment tracking, invoice send/remind/cancel, dispute accept.
- The Stripe confirmation URL + approval token is the strongest documented guard for money-moving writes. A WP plugin can copy it: the tool returns a wp-admin approval link and a pending-action ID, and the merchant approves in wp-admin.

### Gaps
- The older Stripe local `@stripe/mcp` / agent-toolkit tool names (for example `create_refund`, `create_payment_link`) were not re-checked. The remote docs now show only the generic tools, so treat the older named tools as likely superseded (unverified).
- No PayPal or Square docs describe server-side confirmation, idempotency keys or rate limits for MCP calls.
- The page does not say which Square methods `DISALLOW_WRITES` blocks.

---

## 5. Use of MCP resources and MCP prompts (not only tools)

### Takeaway
Almost all commerce servers are tools-only. Prompts appear mainly in developer/knowledge servers (commercetools `commercetools-developer-tips`, PayPal's docs "Prompts" page, which may be example prompts and not MCP prompts). The WordPress MCP Adapter can map abilities to resources and prompts. WooCommerce uses none. No server was found that exposes store data as MCP resources.

### Cited Findings
- WordPress MCP Adapter: "WordPress abilities automatically become MCP tools, resources, and prompts" — [WordPress/mcp-adapter](https://github.com/WordPress/mcp-adapter)
- The WooCommerce MCP docs and the 10.9 post mention no MCP resources or prompts — [WooCommerce MCP docs](https://developer.woocommerce.com/docs/features/mcp/); [10.9 post](https://developer.woocommerce.com/2026/05/12/mcp-abilities-api-10-9/)
- A WooCommerce community comment (2026-02-11) reports Cursor showing "No tools, prompts or resources" — [WooCommerce AI & Agentic Commerce post](https://developer.woocommerce.com/?p=8769212)
- commercetools Knowledge MCP offers development prompts and a `commercetools-developer-tips` prompt — [commercetools MCP overview](https://docs.commercetools.com/sdk/mcp/overview)
- The Stripe, Square, Saleor and Shopify (Storefront, Customer Account) pages document tools only. Stripe's `get_balance_summary` returns an "interactive" balance summary (a UI-returning tool, not a resource) — [docs.stripe.com/mcp](https://docs.stripe.com/mcp); [Square MCP docs](https://developer.squareup.com/docs/mcp); [saleor-mcp](https://github.com/saleor/saleor-mcp); [Shopify Storefront MCP](https://shopify.dev/docs/apps/build/storefront-mcp)
- The PayPal MCP docs link to a "Prompts" page as the next docs page — [PayPal MCP server docs](https://developer.paypal.com/tools/mcp-server/)

### Inferences
- Kirki could use resources for slow-changing reference context (store settings, currency, tax/shipping zones, order status enum, product schema) and prompts for merchant workflows ("weekly sales review", "draft a restock list", "investigate an order"). No competitor does this, but MCP client support for resources/prompts is uneven (see the Cursor comment).

### Gaps
- How the MCP Adapter decides tool vs resource vs prompt (`meta.mcp.type` or similar) is not on the README page I fetched. See the adapter's "Creating Abilities" guide.
- It is not confirmed whether PayPal's "Prompts" page holds MCP prompts or only example user prompts.

---

## 6. How servers guard write actions (confirmation, preview, read-only, scopes, idempotency, rate limits)

### Takeaway
The guards seen across servers are: (a) server-side human approval for money-moving actions (Stripe only); (b) a read-only server or switch (Saleor, CData, Adobe ext, Square `DISALLOW_WRITES`); (c) scoped credentials (Stripe agent keys and per-environment OAuth, Square OAuth scopes, Shopify Custom App scopes, WooCommerce least-privilege WP user + per-ability `permission_callback`); (d) tool-subset selection (PayPal `--tools=`); (e) MCP annotations (WooCommerce readonly/destructive/idempotent); (f) safe defaults in the ability (WooCommerce soft-delete unless `force`, reject no-op status changes, strict schemas); (g) review-before-apply in the first-party assistant (Shopify Sidekick). No explicit MCP dry-run tool, idempotency key or rate-limit documentation was found.

### Cited Findings
- Stripe: human confirmation URL for refunds/outbound payments; approval token; 24 h expiry; client tool-approval recommended; per-environment permissions; admin kill switch for live/sandbox; session revocation; Workbench logs — [docs.stripe.com/mcp](https://docs.stripe.com/mcp)
- Stripe API "Create a preview invoice" is available through MCP. It is a preview-before-commit pattern at API level — [docs.stripe.com/mcp](https://docs.stripe.com/mcp)
- Square: `DISALLOW_WRITES=true`; sandbox only via local server; client allowlist — [Square MCP docs](https://developer.squareup.com/docs/mcp)
- Saleor: read-only server — [saleor-mcp](https://github.com/saleor/saleor-mcp)
- WooCommerce: readonly/idempotent annotations on queries; destructive/idempotent declared on writes; soft delete unless `force: true`, error if trash disabled; no-op status change rejected; unknown fields rejected; per-ability `permission_callback`; `meta.mcp.public` opt-in — [10.9 post](https://developer.woocommerce.com/2026/05/12/mcp-abilities-api-10-9/); [WooCommerce MCP docs](https://developer.woocommerce.com/docs/features/mcp/)
- PayPal: choose tools with `--tools=`; sandbox vs production env — [PayPal MCP server docs](https://developer.paypal.com/tools/mcp-server/)
- commercetools: "scoped access with built-in safeguards for commerce operations" (no detail) — [commercetools MCP overview](https://docs.commercetools.com/sdk/mcp/overview)
- Shopify Sidekick: proposes, then the merchant confirms. Destructive actions get confirmation cards (secondary) — [getkanal](https://getkanal.com/blog/shopify-sidekick-guide.md); [chattergo](https://www.chattergo.com/blog/shopify-sidekick-deep-dive-from-chatbot-to-agentic-copilot)
- Shopify Dev toolkit: store-management tasks run only when "you choose when to execute them" — [Shopify Dev MCP docs](https://shopify.dev/docs/apps/build/devmcp)

### Inferences
- Suggested guard set for Kirki: (1) all abilities private by default, opt-in for each one; (2) a global "read-only MCP" setting; (3) readonly/destructive/idempotent annotations on every ability; (4) a dedicated capability (for example `kirki_mcp_write`) separate from `manage_options`; (5) Stripe-style approval link in wp-admin for refunds, bulk price changes, deletes and customer data export; (6) soft-delete defaults and no-op rejection; (7) an audit log of MCP calls (like Stripe Workbench logs and WooCommerce `woocommerce-abilities` logs).

### Gaps
- No server documents MCP-level idempotency keys (Stripe's REST API supports `Idempotency-Key`, but the MCP docs do not mention it). No MCP-specific rate limits are documented by any vendor I checked.
- No vendor ships a dedicated "dry_run"/"preview" parameter on MCP write tools.

---

## 7. Agentic commerce protocols (ACP, AP2, UCP) and what a store plugin should expose

### Takeaway
UCP (Google + Shopify, Apache 2.0, launched 2026-01-11) is now the shopper-agent standard Shopify migrated to. It publishes a `/.well-known/ucp` profile with capabilities (catalog, cart, checkout with discount/fulfillment extensions, order). It has REST/MCP/A2A/Embedded bindings and optional AP2 payment mandates. ACP (OpenAI + Stripe) powers ChatGPT checkout with a product feed + checkout API. A single vendor reports that OpenAI moved away from in-chat "Instant Checkout" toward merchant-controlled checkout in 2026. WooCommerce plugins for UCP/ACP already exist on WordPress.org. These protocols are shopper-facing and are a separate surface from a merchant-admin MCP.

### Cited Findings
- UCP is organized around a business profile at a well-known URI. The profile declares services, capabilities, endpoints and signing keys. Checkout is core, with discount and fulfillment as extensions (for example `dev.ucp.shopping.checkout`). The Checkout capability can have a REST or MCP binding — [Google Developers Blog: Under the Hood: UCP](https://developers.googleblog.com/en/under-the-hood-universal-commerce-protocol-ucp/)
- UCP supports REST, MCP, A2A and Embedded bindings. It has a 3-step payment lifecycle, and AP2 mandates are optional — [github.com/universal-commerce-protocol/ucp](https://github.com/universal-commerce-protocol/ucp)
- UCP is a Google + Shopify open standard (Apache 2.0) launched 2026-01-11. It plugs into AP2 for payment authorization — [Eco UCP explainer (secondary)](https://eco.com/support/en/articles/14839408-universal-commerce-protocol-ucp-explained)
- Shopify storefront agent tools now live at `https://{shop}/api/ucp/mcp`, and every request needs an agent profile — [Shopify Storefront MCP docs](https://shopify.dev/docs/apps/build/storefront-mcp)
- ACP / Instant Checkout launched in September 2025 for US ChatGPT users (Etsy first, Shopify merchants to follow, single-item). Merchants implement ACP and provide a Product Feed Spec feed. Merchants pay a fee on completed purchases. PayPal said it would adopt ACP in October 2025 — [Travel Daily News (secondary)](https://www.traveldailynews.com/technology/chatgpt-launches-instant-checkout-with-the-agentic-commerce-protocol/); [letsdatascience (secondary)](https://letsdatascience.com/news/openai-and-stripe-enable-agentic-commerce-in-chatgpt-965c7bf2)
- OpenAI moved away from in-chat Instant Checkout toward merchant-controlled checkout, while ACP is "expanding" (Checkout.com, 2026-04-20, an interested single source) — [Checkout.com blog](https://cfworker-www.checkout.com/blog/openai-agentic-commerce-shift)
- WooCommerce (2025-10-03): Woo works with Stripe on ACP, which it calls "a natural fit" for WooCommerce MCP + Store API. Woo is experimenting with OpenAI's Product Feed Spec and testing off-site checkout with Google and Stripe — [WooCommerce: AI & Agentic Commerce](https://developer.woocommerce.com/?p=8769212)
- WordPress.org plugins: "UCP/ACP Agent for WooCommerce" (v0.1.0) claims 75/75 UCP conformance tests on protocol 2026-04-08, serves `/.well-known/ucp` and `/.well-known/acp.json`, and creates normal WooCommerce orders; ACP checkout is limited to OpenAI-approved merchants. "UCPhub for WooCommerce" serves a UCP profile through the external service api.ucphub.ai (account + API key) — [wordpress.org listing](https://wordpress.org/plugins/?p=362417); [UCPhub for WooCommerce](https://wordpress.org/plugins/ucphub-for-woocommerce/) (self-reported claims)

### Inferences
- For Kirki, keep two surfaces: (1) merchant-admin MCP (abilities via the MCP Adapter, authenticated wp-admin user), and (2) optional shopper-agent surface (UCP profile + catalog/cart/checkout capabilities with an MCP binding, and later an ACP product feed). Surface (2) is a larger, separate project with signing keys, agent profiles and payment-handler integration. It is a candidate for a later phase, not the first MCP tool set.
- WP.org distribution (guideline 8 / no external-service lock-in without disclosure) favours a self-hosted UCP implementation over a SaaS-relay design like UCPhub.

### Gaps
- No primary OpenAI source was found for the 2026 Instant Checkout change or for the current ACP merchant onboarding status.
- No WooCommerce-core UCP or AP2 implementation was confirmed. No WordPress plugin that implements AP2 was found.
- The current UCP version and exact capability names were not fetched from ucp.dev. Check them before implementation.
