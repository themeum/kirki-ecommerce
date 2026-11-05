# Merchant jobs-to-be-done for an AI assistant in the store admin (as of October 2026)

Research date: 2026-10-26. Scope: small and mid-size merchants who run their own store. Most sources are from 2025-2026. Older data is marked. Source quality warning: much of the public material on Sidekick and WooCommerce MCP comes from vendor blogs (often competitors). Shopify's own help center and earnings-call figures are the strongest sources. I found no independent survey that ranks admin-assistant tasks by frequency.

## 1. Which tasks do merchants use admin AI assistants for most?

### Takeaway
The most-cited and best-supported admin assistant jobs are (1) asking questions about store data and reports, (2) writing product and marketing content, (3) creating discounts, (4) building automations, and (5) order lookup and edits. Customer-facing support is mostly handled by separate helpdesk agents (Gorgias etc.), not by the admin assistant. WooCommerce's own MCP is still small and experimental (7 abilities, no refunds, coupons or customers).

### Cited Findings
**Shopify Sidekick (the reference product)**
- Shopify's help center lists Sidekick capabilities: completing technical store tasks such as editing orders in plain language; drafting product descriptions and images; generating custom apps; building Shopify Flow workflows; writing and running code to "forecast, compare, or summarize store data"; proactive recommendations via Sidekick Pulse on Shopify Home; saved "skills" and memory of preferences; voice mode and screen sharing; long multi-step tasks that keep running after the chat closes, with a notification when done — [Shopify Help Center: Sidekick](https://help.shopify.com/en/manual/ai-powered-tools/sidekick)
- Q3 2025 earnings call: over 750,000 shops used Sidekick for the first time in the quarter; almost 100 million merchant conversations to date, 8 million in October 2025 alone; conversations can run 50-100 turns and cover "analytics and building new customer segments" among other things — [AOL / Q3 2025 earnings call transcript](https://www.aol.com/finance/shopify-shop-q3-2025-earnings-001638969.html); [Bullfincher Q3 2025 summary](https://bullfincher.io/companies/shopify/earnings-call/fy2025-q3)
- Secondhand (unverified against Shopify transcript): Q1 2026 weekly active shops using Sidekick up 385% YoY, 12,000+ custom apps built through it in one quarter; "roughly 42%" of Shopify merchants use Shopify AI features (Sidekick + Magic) — [Ringly blog (competitor), citing PYMNTS](https://www.ringly.io/blog/ai-sidekick-shopify)
- Q2 2026 call: management tied Sidekick to merchant retention and product attach; no specific usage number found — [Barchart summary](https://www.barchart.com/story/news/3796799/shopifys-q2-earnings-call-our-top-5-analyst-questions)
- Use-case guide (updated 14 Sept 2026, by a competing vendor) ranks: (1) store data questions — estimates 2-3 minutes of report clicking becomes a ~5-second query; (2) discounts — one prompt replaces 4-5 admin screens, Sidekick shows the proposed change for approval; (3) Flow automations (follow-up email 3 days after delivery, tag VIP customers over $1,000 spend, Slack alert on payment dispute, archive products when stock hits zero); (4) store content (product descriptions, email, SMS, SEO meta titles/descriptions — output "usually needs editing"); (5) B2B account management (find wholesale customers who have not reordered, B2B vs DTC revenue); (6) Sidekick Pulse proactive insights (regional trends, checkout abandonment spikes, low stock, bundle opportunities); (7) ShopifyQL queries ("revenue by traffic source for the last 30 days"); (8) voice; (9) small theme tweaks — [Fudge: Shopify Sidekick Use Cases (2026)](https://www.fudge.ai/guides/shopify-sidekick-use-cases/)
- Same guide, limits: no customer service conversations, single store only, no persistent brand voice across sessions, answers "what" not "why" — [Fudge](https://www.fudge.ai/guides/shopify-sidekick-use-cases/)
- Sidekick is an admin-only tool; it cannot talk to customers directly, but Shopify Inbox uses it to suggest replies that the merchant still sends — [Ringly](https://www.ringly.io/blog/ai-sidekick-shopify); [Alhena (vendor)](https://alhena.ai/blog/shopify-sidekick-vs-third-party-ai-apps/)
- Merchant sentiment is split. Positive: a Shopify Plus merchant was "positively surprised" when Sidekick identified products that needed restocking; another says used well it saves "a meaningful number of expensive dev hours". Negative: theme edits error out or make the wrong change; a Community user reports hallucinated variables and wrong IDs in Flow workflows and wrong claims about store status. Testers advise one task per request — [Reddit snapshot, May 2026](https://reddit.sentinel-team.org/posts/1t4l0s9/snapshots/2026-05-05T22%3A24%3A54.73441Z); [Reddit snapshot, Feb 2026](https://reddit.sentinel-team.org/posts/1rfqc2a/snapshots/2026-02-26T23%3A42%3A26.69168Z); [Shopify Community: "Sidekick is hallucinating quite a lot"](https://community.shopify.com/t/sidekick-is-hallucinating-quite-a-lot/666319); [FoxEcom test](https://foxecom.com/blogs/all/shopify-sidekick)

**WooCommerce**
- WooCommerce 10.3 (Oct 2025) introduced the first WooCommerce MCP, built on the WordPress Abilities API, so Claude, Cursor, VS Code etc. can act on a store — [WooCommerce developer blog, 3 Oct 2025](https://developer.woocommerce.com/2025/10/03/ai-agentic-commerce-in-woocommerce/)
- As of WooCommerce 11.2.0 (tested 9 Oct 2026) the built-in MCP is still experimental and off by default, with 7 abilities: query products, query orders, create/update/delete product, update order status, add order note. No refunds, coupons or customers. Intended uses: owners looking up orders, changing statuses, adding notes; agencies doing catalogue updates across client stores; bulk price/category/stock corrections. No real merchant deployment data reported — [InstaWP WooCommerce MCP test, Oct 2026](https://instawp.com/?p=157729)

**Amazon Seller Assistant (marketplace, for comparison)**
- Project Amelia launched in beta (2024, older) with three areas: knowledge questions; status updates and metrics (sales, units sold, traffic); actions and issue resolution — [Maginative](https://www.maginative.com/article/amazon-unveils-project-amelia-an-ai-assistant-for-sellers/)
- 2025 agentic upgrade: monitors inventory, manages compliance, generates ad campaigns; acts "with a seller's permission"; example job: investigate an inventory discrepancy — [PYMNTS, 2025](https://www.pymnts.com/amazon/2025/amazon-expands-seller-assistant-with-agentic-ai-to-become-always-on-partner/); [Nasdaq](https://www.nasdaq.com/articles/amazon-unveils-ai-powered-seller-assistant-agentic-capabilities)

**Customer service (adjacent, mostly helpdesk tools)**
- WISMO ("where is my order") is the largest support ticket type: ~18% of requests per Gorgias (via Redo); 30-40% normally and over 50% at peak per Salesforce (as cited by a vendor). Figures measure different bases — [eesel](https://www.eesel.ai/blog/gorgias-ai-order-tracking); [FactualMinds](https://www.factualminds.com/blog/wismo-automation-ai-agents-ecommerce-2026/)
- Gorgias AI Agent real automation rate 26-56% per its own case studies (vs "up to 60%" marketing claim); self-service tracking cuts WISMO tickets up to 17%; order-management self-serve claims up to 30% of live chat volume, but refund/cancel buttons only submit requests, they do not execute — [Ringly (competitor)](https://www.ringly.io/blog/gorgias-live-chat-ai-features)

### Inferences
Ranked list of merchant jobs-to-be-done for a Kirki eCommerce MCP (ranking = strength of demand evidence x measured benefit x fit for a small/mid-size WordPress store):

1. **Ask questions about sales and store data** (AOV, revenue vs prior period, top products, revenue by source, unfulfilled orders). Strongest evidence: top Sidekick use case in every source; Amazon Amelia's core area; "analytics" named first by Shopify management. Benefit: minutes to seconds per question. MCP: read-only report tools + resources (the existing sales-report tool is the right first tool).
2. **Order lookup, status and notes** (find order, check status, update status, add note, edit order). Evidence: one of only 7 WooCommerce MCP abilities; Sidekick help center example "editing orders"; WISMO is the largest support ticket type. MCP: order search/get tools; status update and note tools with confirmation.
3. **Product content writing** (descriptions, SEO titles/meta, bulk rewrite). Evidence: Sidekick/Magic core feature; most popular SMB AI use case is content (Thryv, Section 5). Benefit: vendor case studies show 15-30 min to under 2 min per description, review still needed. MCP: product get/update tools + a "write description" prompt; the client LLM writes the text.
4. **Inventory and restock** (which products run out soon, low stock list, set stock). Evidence: Sidekick restock example, Pulse low-stock alerts, Amazon inventory monitoring, WooCommerce stock-correction use. MCP: low-stock / days-of-cover read tool; stock update tool.
5. **Discount / coupon creation** (incl. BFCM batches). Evidence: #2 Sidekick use case; 4-5 screens to one prompt. Gap in WooCommerce MCP (no coupons) = differentiation opportunity. MCP: create-coupon tool with preview + confirm.
6. **Customer questions and segments** (customers who have not ordered in 90 days, VIP list, wholesale customers who have not reordered). Evidence: Sidekick examples and "building customer segments" in earnings call. MCP: customer query tool; PII-sensitive (see Section 4).
7. **Bulk catalogue edits** (price, category, stock corrections). Evidence: WooCommerce MCP intended uses; but highest-risk writes (InstaWP found silent failures). MCP: bulk-edit tool with dry-run preview.
8. **Automations / recurring routines** (alerts, tagging, scheduled reports). Evidence: Flow building is a top Sidekick use, but reliability complaints exist. For MCP this maps better to prompts the client runs on a schedule than to a workflow builder.
9. **Refunds, tax and shipping setup, payment settings**: low/no evidence of demand for AI execution; sources advise keeping these under human review. Offer read-only at most.
10. **Fraud review**: Shopify's AI stats article mentions fraud detection only in general; no evidence merchants ask an admin assistant for it.

### Gaps
- No primary Shopify data ranks Sidekick tasks by share of conversations; the ranking above is inferred from capability lists and third-party guides.
- No usage data found for WooCommerce AI features, BigCommerce AI, Wix AI, or Squarespace AI admin assistants (not searched in depth within the tool budget).
- Shopify Community best-practices thread (community.shopify.com/t/.../410541) returned HTTP 403, so merchant-shared prompts there were not read.

## 2. What daily, weekly and monthly routines could an assistant run as a prompt?

### Takeaway
Direct evidence for routines is thin, but the platforms themselves point to the same set: a proactive daily insight feed (Sidekick Pulse), low-stock alerts, and campaign-season discount batches. Sidekick now runs long tasks in the background and notifies the merchant, which supports "routine as prompt".

### Cited Findings
- Sidekick Pulse surfaces suggestions on Shopify Home without a prompt — [Shopify Help Center](https://help.shopify.com/en/manual/ai-powered-tools/sidekick)
- Pulse covers regional product trends, checkout abandonment spikes, low stock, bundle opportunities (no thresholds or accuracy published) — [Fudge](https://www.fudge.ai/guides/shopify-sidekick-use-cases/)
- Pulse described as a background monitor of inventory, conversion and marketing metrics posting to the admin notification feed (unofficial source) — [zectox guide](https://zectox.is-a.dev/blog/shopify-sidekick-ai-guide-2026)
- Low-stock alert is a built-in Shopify Flow template ("Get notified by email when product variant inventory is low") — [Shopify Community inventory AMA](https://community.shopify.com/t/exclusive-ama-optimizing-your-inventory-management-with-shopify-experts/354784?page=6)
- Ask Sidekick which products are about to run out; returns a ranked list with days-of-cover (vendor claim) — [Let's Talk Shop](https://www.letstalkshop.com/blog/how-to-use-shopify-sidekick-for-inventory-management)
- BFCM: Sidekick used to create multiple discount codes quickly; the Shopify inventory AMA focused on pre-BFCM inventory issues, including a 90-day inventory adjustment history limit — [Let's Talk Shop / Shopify Community AMA search results](https://community.shopify.com/t/exclusive-ama-optimizing-your-inventory-management-with-shopify-experts/354784/167)
- Sidekick saved "skills" let merchants store repeat instructions, and long tasks keep running after the chat closes — [Shopify Help Center](https://help.shopify.com/en/manual/ai-powered-tools/sidekick)
- Example comparison prompt: "What was my AOV yesterday vs last week?" — [Fudge](https://www.fudge.ai/guides/shopify-sidekick-use-cases/)

### Inferences
Candidate MCP prompts (routines), from the findings above:
- **Daily "morning brief"**: yesterday's revenue, orders, AOV vs same day last week; unfulfilled orders; low-stock items; abandoned-checkout spike.
- **Daily/weekly "low stock & restock"**: items below threshold, days of cover, suggested reorder.
- **Weekly performance review**: top and slow products, revenue by source, new vs returning customers.
- **Monthly close**: month revenue/orders/refunds/tax totals for the accountant (export-friendly).
- **Campaign / BFCM prep**: stock check on best sellers, create discount batch (with preview), check active coupons.
- **Win-back list**: customers who have not ordered in N days.
These map to MCP "prompts" that call read-only tools; only the BFCM discount step writes.

### Gaps
- No survey or study measures which recurring routines merchants run or how long they take today.
- No official Shopify list of BFCM prompts found. Month-end and tax-report routines: no source found.

## 3. What questions do merchants ask about their data?

### Takeaway
The documented questions are period comparisons (AOV, revenue), top products, revenue by traffic source, unfulfilled orders, lapsed customers, restock needs, and customer segments. Deeper metrics (CLV, cohorts, refund reasons, margin) are asked about in theory, but I found no source that measures demand for them.

### Cited Findings
- Example data questions: AOV yesterday vs last week; top products last month; unfulfilled orders; customers who have not ordered in 90 days; revenue by traffic source last 30 days; wholesale customers who have not reordered; B2B vs DTC revenue — [Fudge](https://www.fudge.ai/guides/shopify-sidekick-use-cases/)
- Sidekick writes and runs code to "forecast, compare, or summarize store data" — [Shopify Help Center](https://help.shopify.com/en/manual/ai-powered-tools/sidekick)
- Sidekick conversations cover "analytics and building new customer segments" — [Q3 2025 earnings call](https://www.aol.com/finance/shopify-shop-q3-2025-earnings-001638969.html)
- Sidekick flags high return rates or inventory imbalances in reports (vendor source) — [Ringly / search summary](https://www.ringly.io/blog/ai-sidekick-shopify)
- Products about to run out with days-of-cover estimates — [Let's Talk Shop](https://www.letstalkshop.com/blog/how-to-use-shopify-sidekick-for-inventory-management)
- Amazon seller assistant metrics: sales performance, units sold, website traffic (2024, older) — [Maginative](https://www.maginative.com/article/amazon-unveils-project-amelia-an-ai-assistant-for-sellers/)
- Merchant limit noted: Sidekick answers "what" but merchants still need to work out "why" — [Fudge](https://www.fudge.ai/guides/shopify-sidekick-use-cases/)

### Inferences
- Minimum read surface for the MCP: sales summary by period with comparison; product performance (best sellers and slow movers); orders by status; customers by last-order date and total spend; stock levels; refunds/returns by product; revenue by source/channel if Kirki tracks it.
- Repeat rate, CLV and cohort questions are cheap to add once customer + order aggregates exist; margin needs cost-of-goods data, which the store may not hold.

### Gaps
- No source quantifies how often merchants ask about CLV, cohorts, repeat rate, abandoned carts, refund reasons or margin.

## 4. Merchant concerns about AI acting in their store, and expected guardrails

### Takeaway
The dominant industry pattern is "propose, then approve": the AI reads state, proposes a change, and the merchant confirms. Real tests show silent write failures (price changed in the editor but checkout still charged the old price), so read-back verification and least-privilege accounts matter. Privacy of customer PII sent to the AI provider is a stated concern.

### Cited Findings
- Sidekick "presents changes for your review before applying them" — [Shopify Help Center](https://help.shopify.com/en/manual/ai-powered-tools/sidekick)
- Sidekick app extensions (June 2026): read-only data tools, deep-link actions (navigation only), and scoped action extensions where Sidekick stages a change and the merchant clicks Save; no headless writes or silent mutations; argued benefits are audit trail, limited blast radius, merchant trust (vendor write-up) — [Weaverse, 22 June 2026](https://weaverse.io/blogs/shopify-sidekick-agents-propose-merchants-approve-2026)
- Shopify Winter '26: Sidekick can build code and make changes "all with your oversight" — [Shopify Winter '26 Edition](https://www.shopify.com/news/winter-26-edition-merchant)
- Amazon Seller Assistant acts "with a seller's permission" — [PYMNTS, 2025](https://www.pymnts.com/amazon/2025/amazon-expands-seller-assistant-with-agentic-ai-to-become-always-on-partner/)
- InstaWP WooCommerce MCP tests (Oct 2026): a generic meta write replied "Meta updated" while checkout still charged the old $35 and the lookup table was stale; stock set to zero but product page still showed "in stock" with Add to cart; generic post-based tools found 0 of 8 orders on an HPOS store; only one of five servers returned an undo token; WordPress Application Passwords carry all user permissions and cannot be narrowed — [InstaWP](https://instawp.com/?p=157729)
- InstaWP recommended guardrails: dedicated Shop Manager account (never admin); rehearse on staging; start with read-only prompts; restore point before live writes; add product to cart to verify a price change; keep refunds, payment settings and status changes that trigger customer emails under human review; revoke tokens after use; check AI provider data terms because order lookups expose billing emails — [InstaWP](https://instawp.com/?p=157729)
- WooCommerce MCP: every call runs as a real WordPress user and each ability checks capabilities; a third-party write-up tags operations read-only, write, destructive — [Elestio](https://blog.elest.io/woocommerce-mcp-give-ai-agents-read-only-store-access/)
- Merchant complaints about wrong output: hallucinated IDs, wrong claims about store status — [Shopify Community](https://community.shopify.com/t/sidekick-is-hallucinating-quite-a-lot/666319)
- 48% of mature organizations cite security threats as an AI barrier; data quality is a challenge for 29-34% (Gartner 2025, via Shopify) — [Shopify AI statistics, Sep 2025](https://www.shopify.com/blog/ai-statistics)
- 71% of US marketers say ethical and privacy standards are the top step to prepare for AI agent-led commerce (ANA/Harris Poll, Oct 2025) — [eMarketer](https://www.emarketer.com/content/marketers-putting-guardrails-before-growth-on-ai-agents)

### Inferences
Guardrails Kirki's MCP should ship with:
- Read-only by default; write tools separate and gated by WordPress capability (shop manager, not admin).
- MCP tool annotations (readOnlyHint / destructiveHint) so clients ask for confirmation; dry-run / preview mode for bulk and price edits.
- Write tools go through the plugin's own domain layer (never raw post meta) and return the read-back value.
- No refund, payment-settings, or delete tools in v1 (or behind explicit opt-in).
- Audit log of AI-initiated changes; undo where cheap.
- PII minimisation in tool output (mask emails/addresses unless asked), which supports GDPR.

### Gaps
- No merchant survey found that directly measures trust in AI making store changes (price, refunds, deletes) or ranks preferred guardrails.

## 5. Surveys and studies on merchant AI adoption and valued use cases

### Takeaway
Adoption is broad but shallow: most SMBs use some AI, mostly for content; heavy operational use concentrates in larger firms; and agentic AI in commerce is still early (28% of commerce orgs run it). Measured benefits for admin assistants are mostly vendor estimates, not independent studies.

### Cited Findings
- Thryv survey (May 2025, 540 SMB decision-makers): AI use rose from 39% (2024) to 55% (2025); content marketing is the most popular use case; retail is among leading sectors — [Thryv AI and Small Business Adoption Report 2025](https://www.thryv.com/guides-resources/ai-and-small-business-adoption-report-2025)
- US Census BTOS: 8.8% of small businesses (<250 employees) reported AI use in producing goods/services as of Aug 2025 (definition much narrower than vendor surveys) — [Capsule CRM](https://capsulecrm.com/blog/small-business-ai-adoption-statistics/)
- 2025 ecommerce holiday report: 86% of respondents lean on AI extensively or somewhat in operations; firms with 500+ employees were 5x more likely than firms with ≤10 employees to be heavy users — [Stacker / KTVZ, Nov 2025](https://ktvz.com/stacker-money/2025/11/25/2025-ecommerce-holiday-report-headwinds-high-hopes-and-ai-acceleration/)
- Salesforce State of Commerce (4th ed., July 2026; 3,450 commerce professionals, 4,689 consumers): 28% of commerce organizations run agentic AI now, 44% expect to within 6 months, only 32% have defined success; traffic from AI chats to commerce sites up 150-428% per quarter — [Shopifreaks](https://www.shopifreaks.com/shoppers-now-open-purchase-journeys-in-ai-chats-200-more-than-a-year-ago-according-to-salesforces-state-of-commerce-report/); [Salesforce news](https://www.salesforce.com/news/industries/retail/)
- Shopify AI statistics (Sep 2025): 75% of SMBs at least experimenting with AI (Salesforce 2025, data 2024); 83% of growing SMBs use AI; 87% of SMBs using AI say it helps them scale; 29% of Shopify merchants not using AI are not sure what the tools can do (main barrier); 55% of AI-using marketers generate text with it (HubSpot); 78% of marketers say AI cuts manual tasks like data entry (HubSpot) — [Shopify blog](https://www.shopify.com/blog/ai-statistics)
- Emarsys AI in Retail 2025 (Italy): 35% of merchants said AI had already significantly affected their business model at start of 2025, 48% more expected it by year end; uses: product content, data analysis, customer service — [Emarsys report PDF](https://emarsys.com/app/uploads/2025/09/AI-in-Retail-report-2025_global-Prefazione-con-Foto-Capitolo-v3.pdf)
- Measured benefit, product content (vendor case studies): 15 min → under 2 min per description for a 10,000-product store; ~30 min manual baseline, ~4,800 person-hours/month saved at 2,500 SKUs/week; small Shopify merchant review: "saved over 100 hours" — [Sunzinet](https://www.sunzinet.com/en/references/scale-10000-products-ai-content-generation); [Netscribes](https://netscribes.com/?p=63108); [Shopify App Store reviews](https://apps.shopify.com/automated-description-writing/reviews?page=1)
- Measured benefit, data questions and discounts (vendor estimates): 2-3 min → ~5 s per report question; 4-5 admin screens → 1 prompt for a discount — [Fudge](https://www.fudge.ai/guides/shopify-sidekick-use-cases/)
- Measured benefit, support: Gorgias AI Agent automates 26-56% of tickets per its case studies; self-service tracking cuts WISMO up to 17% — [Ringly](https://www.ringly.io/blog/gorgias-live-chat-ai-features)

### Inferences
- For small WordPress merchants, the biggest barrier is not knowing what to ask (29% figure). Shipping ready-made MCP prompts (morning brief, low stock, monthly report) addresses this directly.
- Heavy operational AI use is concentrated in larger firms, so v1 for SMBs should favour low-risk, high-frequency reads over complex agentic writes.

### Gaps
- Klaviyo, BigCommerce, Digital Commerce 360, McKinsey and Gartner merchant-specific numbers on admin-assistant use cases were not found within the tool budget.
- No independent (non-vendor) study measures time saved or revenue lift from an admin AI assistant specifically.
- Salesforce State of Commerce figures are from secondary coverage; the full report was not read.
