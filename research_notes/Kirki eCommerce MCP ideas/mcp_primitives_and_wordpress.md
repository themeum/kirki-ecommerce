# MCP Primitives, Client Support and the WordPress MCP Stack (as of 26 October 2026)

## 1. Current MCP spec version and what changed (tools, resources, prompts, elicitation, auth, tasks)

### Takeaway
The current MCP revision is **2026-07-28** (published 28 July 2026). It makes the protocol stateless (no `initialize` handshake, no `Mcp-Session-Id`), replaces server-initiated requests (elicitation, sampling, roots) with **Multi Round-Trip Requests (MRTR)**, moves Tasks into an official extension, and **deprecates Sampling, Roots and Logging** and Dynamic Client Registration (DCR). The 2025-11-25 revision is now the previous version; 2025-06-18 and older are superseded.

### Cited Findings
**Version history**
- 2025-11-25 changelog lists changes since 2025-06-18: icons on tools/resources/templates/prompts (SEP-973); incremental scope consent via `WWW-Authenticate` (SEP-835); tool-name guidance (SEP-986); standards-based enum schemas for elicitation, titled/untitled, single/multi-select (SEP-1330); **URL mode elicitation** (SEP-1036); tool calling inside sampling (`tools`, `toolChoice`, SEP-1577); **OAuth Client ID Metadata Documents (CIMD)** as recommended registration (SEP-991); **experimental tasks** for durable requests with polling (SEP-1686); OpenID Connect Discovery support; input-validation errors must be Tool Execution Errors (not protocol errors) so the model can self-correct (SEP-1303); JSON Schema 2020-12 is the default dialect (SEP-1613); default values in elicitation primitives (SEP-1034) — [MCP 2025-11-25 changelog](https://modelcontextprotocol.io/specification/2025-11-25/changelog)
- 2026-07-28 major changes vs 2025-11-25 — [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog):
  - Removes protocol-level sessions and `Mcp-Session-Id`. `tools/list`, `resources/list`, `prompts/list` "no longer vary per-connection". Servers that need cross-call state use "explicit, server-minted handles passed as ordinary tool arguments" (SEP-2567).
  - Removes the `initialize`/`notifications/initialized` handshake; every request carries protocol version and client capabilities in `_meta`. Adds mandatory `server/discover` RPC (SEP-2575).
  - Replaces HTTP GET endpoint and `resources/subscribe`/`unsubscribe` with a single `subscriptions/listen` stream; clients opt in to `toolsListChanged`, `promptsListChanged`, `resourcesListChanged`, `resourceSubscriptions`.
  - Removes `ping`, `logging/setLevel`, `notifications/roots/list_changed`.
  - Moves tasks to the extension `io.modelcontextprotocol/tasks`: polling via `tasks/get`, new `tasks/update`, removes `tasks/list` and blocking `tasks/result` (SEP-2663).
  - **MRTR** replaces server-initiated `roots/list`, `sampling/createMessage`, `elicitation/create`: server returns `resultType: "input_required"` with `inputRequests`; client retries the original request with `inputResponses` (SEP-2322). All results carry `resultType`.
  - Removes SSE resumability (`Last-Event-ID`); broken stream = client re-issues request.
  - Minor: `tools/list` SHOULD be deterministic order (prompt-cache friendly); new `Mcp-Method`/`Mcp-Name` headers and `x-mcp-header` parameter mirroring (SEP-2243); `ttlMs` + `cacheScope` on list/read results (SEP-2549); resource-not-found code changes from `-32002` to `-32602`; `inputSchema`/`outputSchema` may use any JSON Schema 2020-12 keyword and `structuredContent` may be any JSON value (SEP-2106); removes `notifications/elicitation/complete` and `elicitationId`.
  - Auth: authorization servers SHOULD return `iss` (RFC 9207), clients MUST validate it (SEP-2468); clients MUST set `application_type` in DCR (SEP-837); client credentials bound to the issuer (SEP-2352).
  - **Deprecated** (≥12-month window under new lifecycle policy): Roots, Sampling, Logging (SEP-2577) — "integrate directly with LLM provider APIs instead of Sampling"; HTTP+SSE transport; `includeContext` `thisServer`/`allServers`; **OAuth DCR (RFC 7591) in favor of CIMD** (PR #2858).
- The official blog summarises: stateless core so servers "scale behind a simple round-robin load balancer"; elicitation now runs through MRTR "to confirm an action or collect a missing parameter"; Tasks joins **MCP Apps** and **Enterprise Managed Authorization** as official extensions; Tier 1 SDKs (TypeScript, Python, Go, C#) support the new spec, Rust in beta — [MCP blog: 2026-07-28](https://blog.modelcontextprotocol.io/posts/2026-07-28/)
- Clients built for the 2025 protocol keep working against 2026-07-28 servers per Vercel; GitHub notes Tier 1 SDKs preserved backwards compatibility — [Vercel changelog](https://vercel.com/changelog/vercel-mcp-now-supports-the-2026-07-28-mcp-specification); [GitHub changelog](https://github.blog/changelog/2026-07-23-github-mcp-server-supports-the-next-mcp-specification/)
- Python SDK v2.0.0b1 is the first v2 release with 2026-07-28 support; `pip install mcp` still resolves to stable 1.x — [newreleases: python-sdk v2.0.0b1](https://newreleases.io/project/github/modelcontextprotocol/python-sdk/release/v2.0.0b1)

**Stateful tools guidance (new, relevant to carts/drafts)**
- Spec (non-normative): MCP "has no protocol-level session"; a server that needs state "should do so by returning an explicit handle from a creation tool" (e.g. `create_basket` → `basket_id`). Handle design: validate caller authorization on every call ("a handle is a name, not a capability"), make it opaque, state lifetime in the tool description, return a tool execution error on expiry — [MCP spec: Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)

### Inferences
- A WordPress eCommerce plugin should target 2026-07-28 semantics but must also serve 2025-11-25 clients, because claude.ai/Desktop OAuth docs still reference the 2025 auth specs (see Section 3) and many clients lag.
- Any "confirm before write" flow that relies on elicitation now depends on MRTR support in both the server library and the client; it is not a universal capability.
- Do not design features on Sampling or Roots — they are deprecated and Claude does not support Sampling.

### Gaps
- I did not verify the exact status of MCP Apps as an extension spec (version, stability label) beyond the blog's mention.
- I did not find an authoritative list of which clients already negotiate 2026-07-28 (only Claude Code and the WordPress MCP Adapter confirmed it — see Sections 3 and 4).

---

## 2. What each MCP primitive is good for (and how it maps to merchant use)

### Takeaway
Tools are model-controlled actions; resources are application-driven context; prompts are user-controlled templates (slash commands). Elicitation (form/URL), structured output, annotations, completions and subscriptions are supporting features. In practice tools carry almost all value because client support for the others is uneven.

### Cited Findings
- **Tools**: "model-controlled, meaning that the language model can discover and invoke tools automatically". There "SHOULD always be a human in the loop with the ability to deny tool invocations"; clients SHOULD "Present confirmation prompts to the user for operations" — [MCP spec: Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- **Tool errors**: two mechanisms — Protocol Errors (unknown tool, malformed request) and Tool Execution Errors with `isError: true` that "contain actionable feedback that language models can use to self-correct" (API failures, input validation, business-logic errors) — [MCP spec: Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- **Tool names**: SHOULD be 1–128 chars, case-sensitive, only `A-Z a-z 0-9 _ - .`, unique within a server; aggregating clients SHOULD disambiguate collisions (e.g. prefixing) — [MCP spec: Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- **Structured output**: `structuredContent` is any JSON value conforming to `outputSchema` if defined; "a tool that returns structured content SHOULD also return the serialized JSON in a TextContent block" for backwards compatibility; if `outputSchema` is given, servers MUST conform and clients SHOULD validate. `structuredContent` "is unrelated to LLM 'structured outputs'" — [MCP spec: Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- **Tool annotations**: the spec says "clients **MUST** consider tool annotations to be untrusted unless they come from trusted servers" — [MCP spec: Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools). Abilities API defaults (which the adapter maps to the MCP hints): `readonly` default `false`, `destructive` default `true` ("If `false`, the ability performs only additive updates"), `idempotent` default `false` — [WordPress/abilities-api docs/php-api.md](https://github.com/WordPress/abilities-api/blob/trunk/docs/php-api.md)
- **Resource links / embedded resources in tool results**: tools MAY return `resource_link` or embedded `resource` content; links "are not guaranteed to appear in the results of a `resources/list` request" — [MCP spec: Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- **Resources**: "application-driven, with host applications determining how to incorporate context" (picker UI, search, automatic inclusion). Resource **templates** use RFC 6570 URI templates and arguments "may be auto-completed through the completion API". Annotations: `audience` (`user`/`assistant`), `priority` 0.0–1.0, `lastModified`. Subscriptions now via `subscriptions/listen` with `resourceSubscriptions`, server sends `notifications/resources/updated`. Not-found MUST be `-32602`; servers MUST NOT return empty `contents` for a missing resource. `resources/read` may also return an MRTR `InputRequiredResult` — [MCP spec: Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- **Prompts**: "user-controlled ... Typically ... triggered through user-initiated commands", e.g. slash commands. Have named `arguments`; arguments "may be auto-completed through the completion API". Messages can include text, image, audio, resource links and embedded resources. Implementations "MUST carefully validate all prompt inputs and outputs to prevent injection attacks" — [MCP spec: Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- **Completions**: the completion API autocompletes prompt arguments and resource-template arguments — [MCP spec: Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts); [MCP spec: Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- **Elicitation**: two modes. Form mode = flat object of primitives only (string with formats email/uri/date/date-time, number/integer, boolean, single/multi-select enums, defaults). URL mode = out-of-band page for "auth flows, payment processing, and other sensitive or secure operations". Responses: `accept` / `decline` / `cancel`. Servers "MUST NOT use form mode elicitation to request sensitive information such as passwords, API keys, access tokens, or payment credentials". Servers MUST bind elicitation to client and user identity and MUST handle decline/cancel. URL-mode `accept` "does not mean that the interaction is complete" — [MCP spec: Elicitation](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation)
- **Sampling**: deprecated in 2026-07-28; migrate to "integrate directly with LLM provider APIs" — [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- **Notifications / caching**: `listChanged` notifications flow on `subscriptions/listen`; list results carry `ttlMs` and `cacheScope` (`public`/`private`) — [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog); the tools list "MAY vary by the authorization presented on the request — for example, returning only the tools the caller's granted scopes permit" — [MCP spec: Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- **Tasks**: long-running work through the `io.modelcontextprotocol/tasks` extension with polling `tasks/get` — [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)

### Inferences
- Merchant mapping (my synthesis, not from a source):
  - Tools: sales report, order lookup/search, low-stock list, refund/cancel order, update stock/price, create coupon.
  - Resources / templates: store settings snapshot, `kirki://orders/{id}`, product catalogue entries — useful as `@`-attachments in Claude Code / VS Code, but invisible to model-only clients unless also offered as tools.
  - Prompts: "weekly sales review", "draft reply to a customer review" — appear as slash commands in Claude Code, VS Code, Cursor.
  - Elicitation (form): confirm refund amount / reason before executing; URL mode for anything involving payment-gateway credentials.
  - Tasks: bulk price updates, CSV exports.
  - `listChanged`: tools list per role/scope can change, but clients cache.
- Because `cacheScope: "private"` exists, per-user tool lists (role-based) should mark caching private.

### Gaps
- I did not fetch the completion utility page itself (only references from prompts/resources pages), so exact `completion/complete` request shape is not verified here.

---

## 3. Client support matrix (late 2026)

### Takeaway
Every major client supports **tools**. Resources and prompts are supported by Claude (all surfaces), Claude Code, VS Code and Cursor; ChatGPT's documentation centres on tools (and UI resources for Apps). Elicitation is confirmed in Claude Code (form + URL) and Cursor; **Sampling is not supported by Claude**. Annotations drive permission UX in Claude and ChatGPT. claude.ai and ChatGPT web connectors require OAuth (no Application Password field).

### Cited Findings
**Claude (claude.ai, Desktop, mobile, Cowork — shared connector infrastructure)**
- Server can expose "Tools, prompts, and resources", text and image tool results, text and binary resources. "Claude doesn't yet support ... Resource subscriptions, Sampling, Advanced or draft capabilities" — [Claude docs: Build an MCP server for Claude](https://claude.com/docs/connectors/building)
- Transport: Streamable HTTP; legacy HTTP+SSE still supported but being deprecated — [same](https://claude.com/docs/connectors/building)
- Auth: OAuth 2.0 per user, a static credential header entered by an org Owner, or no auth. OAuth follows the **2025-03-26, 2025-06-18 and 2025-11-25** authorization specs; DCR supported, other registration options documented; redirect `https://claude.ai/api/mcp/auth_callback` — [same](https://claude.com/docs/connectors/building)
- Limits: ~150,000 characters max tool result and 240 s timeout on claude.ai/Desktop; Claude Code 25,000 tokens (configurable `MAX_MCP_OUTPUT_TOKENS`) — [same](https://claude.com/docs/connectors/building)
- MCP Apps (interactive UI in conversation) supported — [same](https://claude.com/docs/connectors/building)
- Directory review: every tool must have a `title` and `readOnlyHint: true` or `destructiveHint: true` as applicable; "Read-only tools can run without per-call confirmation, and destructive tools always prompt". Tool names ≤64 characters. A catch-all tool mixing GET and POST/PUT/DELETE "is rejected"; split read vs write, ideally create/update/delete separately. Descriptions must not instruct Claude how to behave (prompt-injection patterns). Actionable errors required; "don't return a full database dump". **Connectors that "Transfer money, cryptocurrency, or other financial assets" are not accepted** — [Claude docs: Connector pre-submission checklist](https://claude.com/docs/connectors/building/review-criteria.md)

**Claude Code**
- Resources: referenced with `@server:protocol://resource/path`; "Claude Code automatically provides tools to list and read MCP resources" — [Claude Code docs: MCP](https://code.claude.com/docs/en/mcp)
- Prompts: listed as `/servername:promptname (MCP)` or `/mcp__servername__promptname` — [Claude Code docs: MCP](https://code.claude.com/docs/en/mcp)
- Elicitation: form mode (dialog) and URL mode (open link); on 2026-07-28 connections declares `elicitation: {form: {}, url: {}}`; served "only in interactive terminal sessions"; `Elicitation` hook can auto-respond — [Claude Code docs: MCP](https://code.claude.com/docs/en/mcp)
- Annotations: `readOnlyHint` → tool runs in parallel with other read-only calls; `idempotentHint`/`readOnlyHint` let Claude Code repeat a pending call once after a dropped connection. `_meta["anthropic/requiresUserInteraction"]: true` forces a permission prompt on every call, even in auto/bypass modes. `_meta["anthropic/maxResultSizeChars"]` raises a tool's result threshold up to 500,000 chars — [Claude Code docs: MCP](https://code.claude.com/docs/en/mcp)
- Output: warning above 10,000 tokens, default cap 25,000 tokens; text results above 50,000 chars persisted to disk — [Claude Code docs: MCP](https://code.claude.com/docs/en/mcp)
- Tasks in public beta (v2.1.304+); tool search (deferred loading) is the default; supports CIMD and DCR; v2 runtime negotiates 2026-07-28 — [Claude Code docs: MCP](https://code.claude.com/docs/en/mcp)

**ChatGPT / OpenAI**
- Deep research / company knowledge requires read-only `search` and `fetch` tools. Declare an output schema and return `structuredContent` plus the same JSON string in `content` "for compatibility". "ChatGPT currently requires manual confirmation in any conversation before write actions can be taken", and warns write actions may occur "even if the MCP server has tagged the action as read only". Responses API offers `allowed_tools` and `require_approval`. Auth: OAuth recommended with CIMD (public client `none` or `private_key_jwt`); "Dynamic client registration remains supported" — [OpenAI docs: MCP](https://developers.openai.com/api/docs/mcp/)
- Apps SDK: `readOnlyHint`, `destructiveHint`, `openWorldHint` are **required**; `idempotentHint` optional; `destructiveHint` tells the host "to elicit explicit approval first"; hints only affect framing and "servers must still enforce their own authorization logic". `structuredContent` and `content` go to the model and the widget; `_meta` goes only to the widget, hidden from the model — [OpenAI Apps SDK reference](https://developers.openai.com/apps-sdk/reference)

**VS Code (GitHub Copilot)**
- Tools, Resources ("Add Context > MCP Resources", "MCP: Browse Resources"), Prompts as `/<server>.<prompt>` slash commands, MCP Apps (experimental); transports stdio, HTTP, SSE — [VS Code docs: MCP servers](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)

**Cursor**
- Protocol table: Tools, Prompts, Resources, Roots, Elicitation, Apps extension = Supported; transports stdio, SSE, Streamable HTTP; OAuth (authorization code + PKCE) — [Cursor docs: MCP](https://cursor.com/docs/context/mcp)

**Summary matrix (from the sources above; "?" = not stated in the doc I read)**

| Feature | claude.ai / Desktop | Claude Code | ChatGPT | VS Code Copilot | Cursor |
|---|---|---|---|---|---|
| Tools | Yes | Yes | Yes | Yes | Yes |
| Resources | Yes | Yes (@ mentions) | UI resources for Apps only documented | Yes | Yes |
| Prompts | Yes | Yes (slash) | ? | Yes (slash) | Yes |
| Elicitation | ? | Yes (form + URL, interactive only) | ? | ? | Yes |
| Sampling | No | ? (deprecated anyway) | ? | ? | ? |
| Structured output | ? | ? | Yes (recommended) | ? | ? |
| Annotations used for permissions | Yes (readOnly auto, destructive prompts) | Yes | Yes (required in Apps SDK) | ? | ? |
| MCP Apps | Yes | n/a | Yes (Apps SDK) | Experimental | Yes |
| Resource subscriptions | No | ? | ? | ? | ? |
| Tasks | ? | Beta | ? | ? | ? |

### Inferences
- Design for the lowest common denominator: put every capability behind a tool; treat resources/prompts as optional extras.
- Annotations are effectively mandatory (Claude directory + ChatGPT Apps both require them) and directly control whether the merchant is asked to confirm.
- Elicitation-based confirmation will not work in every client, so a server-side fallback (two-step "preview then confirm with token" or dry-run) is needed.
- A "refund/issue money" tool would make a server ineligible for the Claude directory (money-transfer rule), even if it works as a custom connector. This needs a careful product decision.

### Gaps
- The former modelcontextprotocol.io "clients" feature matrix page now redirects to the docs home; I found no single authoritative cross-client matrix for late 2026.
- I could not confirm from first-party docs whether claude.ai/Desktop render elicitation, or whether VS Code supports elicitation/structured output/annotations; the VS Code page I read did not state it.
- ChatGPT support for MCP prompts and form elicitation is not documented in the pages I read.

---

## 4. WordPress Abilities API and the MCP Adapter

### Takeaway
The Abilities API is in core since WordPress 6.9 (client-side JS in 7.0, unified `meta.public` flag in 7.1). The **MCP Adapter** (latest **v0.7.1**, 16 Oct 2026; first wp.org release v0.7.0 on 2 Oct 2026) maps abilities to MCP tools (default), resources (`meta.mcp.type = resource` + `uri`) or prompts (`type = prompt`), supports HTTP and WP-CLI STDIO, authenticates via WordPress users (Application Passwords), **does not ship an OAuth server**, and supports MCP 2026-07-28 including elicitation via MRTR — but only for "direct" tools, not ability-backed tools.

### Cited Findings
**Abilities API (core)**
- WordPress 6.9: `wp_register_ability()`, `wp_get_ability()->execute()`, categories required (`wp_register_ability_category()`), registration only on `wp_abilities_api_init`; args `label`, `description`, `category`, `input_schema`, `output_schema`, `execute_callback`, `permission_callback`, `meta`; hooks `wp_before_execute_ability`, `wp_after_execute_ability`; REST namespace `wp-abilities/v1` with `/abilities/{name}/run`, off unless `meta.show_in_rest` is true; schemas are a subset of JSON Schema draft 4; failures return `WP_Error` — [Make WordPress Core: Abilities API in WordPress 6.9](https://make.wordpress.org/core/2025/11/10/abilities-api-in-wordpress-6-9/)
- `meta.annotations` keys: `instructions`, `readonly` (default false), `destructive` (default true), `idempotent` (default false); REST `/run` uses GET for readonly, POST for others, DELETE for destructive (per the package docs) — [WordPress/abilities-api php-api.md](https://github.com/WordPress/abilities-api/blob/trunk/docs/php-api.md); [rest-api.md](https://github.com/WordPress/abilities-api/blob/trunk/docs/rest-api.md). Note: the GitHub package repo is **archived** (last push Jan 2026) after the merge to core, so core behaviour may differ in detail — verified via `gh api repos/WordPress/abilities-api` (archived: true).
- WordPress 7.0 adds client-side Abilities API (`@wordpress/abilities`, `@wordpress/core-abilities`) — [Make WordPress Core: Client-Side Abilities API in WordPress 7.0](https://make.wordpress.org/core/2026/03/24/client-side-abilities-api-in-wordpress-7-0/)
- WordPress 7.1 adds a unified `public` flag; channel-specific settings override it; it "controls discoverability only and does not replace `permission_callback`" — secondary source only: [eseospace.com](https://eseospace.com/blog/wordpress-abilities-api/), [daily.dev mirror](https://daily.dev/posts/a-unified-public-exposure-flag-for-abilities-in-wordpress-7-1-bjm7y8wez). Confirmed by the adapter docs: "WordPress core starts applying `meta.public` to the REST API (`meta.show_in_rest`) in version 7.1. On WordPress 6.9 and 7.0, the MCP Adapter honors `meta.public` for MCP exposure, but REST API access still requires setting `meta.show_in_rest`" — [mcp-adapter: creating-abilities.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/creating-abilities.md)

**MCP Adapter — releases**
- v0.7.1 (2026-10-16): session init params capped at 4 KiB (security fix); unknown/non-public abilities now both return `ability_not_found` with suggestions; site-owner setup guide — [mcp-adapter releases](https://github.com/WordPress/mcp-adapter/releases) (via `gh api`)
- v0.7.0 (2026-10-02): "adds support for MCP `2026-07-28`"; first wp.org directory release; clients requesting `2025-06-18` or `2024-11-05` still connect and are served through the `2025-11-25` schema; "Direct callable tools can request elicitation input under `2026-07-28` with `McpInputRequired`"; validator classes removed; **"Using MCP Adapter as a bundled Composer library is deprecated. Install the plugin instead."** — [mcp-adapter v0.7.0 release](https://github.com/WordPress/mcp-adapter/releases/tag/v0.7.0)
- Earlier: 0.5.0 (15 Apr 2026), 0.6.0 (12 Aug), 0.6.1 (13 Aug); requires WP 6.9 / PHP 7.4, tested to 7.1, pre-1.0 — secondary: [theplusaddons.com guide](https://theplusaddons.com/blog/wordpress-mcp-adapter/), [pasqualepillitteri.it](https://pasqualepillitteri.it/news/21004/mcp-adapter-wordpress-plugin-ufficiale)

**MCP Adapter — mapping and exposure**
- Abilities "are NOT accessible via the default MCP server by default"; set `meta.public = true`, or `meta.mcp.public` to override for MCP only. `meta.mcp.type`: `tool` (default), `resource` (requires `meta.uri`), `prompt` (arguments from `input_schema`; must return `{ messages: [...] }`) — [creating-abilities.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/creating-abilities.md)
- Annotations: WordPress format `readonly`/`destructive`/`idempotent` auto-converted to `readOnlyHint`/`destructiveHint`/`idempotentHint`; `openWorldHint` must be given in MCP format; resources/prompts use `audience`, `priority`, `lastModified` — [creating-abilities.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/creating-abilities.md)
- Tool naming: `my-plugin/my-tool` → `my-plugin-my-tool` via `McpNameSanitizer` (128-char limit, hash suffix when truncated); `mcp_adapter_tool_name` filter to override — [creating-abilities.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/creating-abilities.md)
- Schemas: object schemas recommended; "flattened" schemas wrapped as `input` / `result` — [creating-abilities.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/creating-abilities.md)
- **Default server** (`/wp-json/mcp/mcp-adapter-default-server`) exposes only three meta-tools: `mcp-adapter-discover-abilities`, `mcp-adapter-get-ability-info`, `mcp-adapter-execute-ability` (discover → inspect → execute), keeping `tools/list` at 3 schemas; also auto-discovers public abilities typed `resource`/`prompt`. Disable with `mcp_adapter_create_default_server`; extend with `mcp_adapter_default_server_config` — [default-server.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/default-server.md)
- **Custom server** via `mcp_adapter_init` → `$adapter->create_server(id, namespace, route, name, description, version, transports, error_handler, observability_handler, tools, resources, prompts, permission_callback)`; each listed ability becomes a standalone tool with its full schema — [default-server.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/default-server.md); [transport-permissions.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/transport-permissions.md)
- **Two-layer security**: transport permission callback (default `is_user_logged_in()`) gates the whole server; each ability's `permission_callback` gates the call. "If transport blocks a user, they can't access ANY abilities" — [transport-permissions.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/transport-permissions.md); [creating-abilities.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/creating-abilities.md)
- Pluggable `McpErrorHandlerInterface`, `McpObservabilityHandlerInterface`, `McpTransportInterface`; multi-server — [mcp-adapter README](https://github.com/WordPress/mcp-adapter)

**MCP Adapter — elicitation (MRTR)**
- "The Adapter supports this for direct `tools/call` handlers. It does not implement MRTR for `prompts/get` or `resources/read`." Direct tool = `McpTool::fromArray()`, handler gets `McpToolCallContext` (`revision()`, `client_supports_elicitation('form'|'url')`, `input_responses()`, `request_state()`, `is_continuation()`); return `new McpInputRequired($input_requests, $request_state)` — [mrtr.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/mrtr.md)
- "Continuation fields on Ability-backed tools ... or the 2025 revision are rejected"; under 2025-11-25 returning `McpInputRequired` gives `-32603`; "Sampling and roots input requests are not supported"; "Tool permission callbacks run on every attempt" — [mrtr.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/mrtr.md)
- Security warnings: treat state and answers as attacker-controlled; protect client-carried state with HMAC/AEAD; bind to authenticated user, not `clientInfo.name`; "An `accept` answer is not independently verified human approval"; "Never collect secrets through form elicitation" — [mrtr.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/mrtr.md)

**MCP Adapter — transports and auth**
- STDIO: `wp mcp-adapter serve [--server=<id>] [--user=<id|login|email>]`; without `--user` runs unauthenticated; `wp mcp-adapter list --protocol=2026-07-28` — [cli-usage.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/cli-usage.md)
- HTTP: Application Passwords (HTTPS required except local dev; some security plugins/hosts disable them). Desktop clients use the `@automattic/mcp-wordpress-remote` npx proxy; Claude Code can connect directly with an `Authorization: Basic` header — [site-owners.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/getting-started/site-owners.md)
- **"The web versions of Claude and ChatGPT add connectors through an OAuth sign-in, and they have no field for an Application Password. WordPress does not include an OAuth server and MCP Adapter does not add one, so these apps cannot connect to MCP Adapter on their own today."** — [site-owners.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/getting-started/site-owners.md)

**WooCommerce as prior art**
- WooCommerce MCP is a "developer preview"; it registers abilities exposed through the MCP Adapter **default server** (requires an authenticated user with `read`; each ability has its own permission callback; only `meta.mcp.public` abilities). Abilities cover products (query/create/update/delete) and orders (query, update status, add notes); named examples `woocommerce/products-query`, `woocommerce/order-notes-query`. Auth: Application Passwords (HTTP) or WP-CLI `--user` (STDIO); no OAuth mentioned. WooCommerce 11.3 removed the old `/wp-json/woocommerce/mcp` endpoint (`X-MCP-API-Key`), now HTTP 410. Security notes: dedicated least-privilege user, revoke unused passwords, PII compliance is the merchant's responsibility — [WooCommerce developer docs: MCP](https://developer.woocommerce.com/docs/features/mcp/)
- Third-party sources disagree on WooCommerce ability count/names (7 vs 9; `products-query` vs `products-list`) — [WebSearch summary of woocommerce.com post](https://woocommerce.com/posts/woocommerce-mcp/); treat names as unstable.

### Inferences
- For a merchant-facing plugin, a **custom server** with a small set of direct tools is a better fit than relying on the default server's discover/execute indirection: dedicated schemas, annotations visible in `tools/list` (so client permission UX works), and only direct tools can use elicitation.
- Annotation passthrough matters: on the default server the client sees only the three meta-tools, so per-ability `readOnlyHint`/`destructiveHint` cannot drive the client's auto-approve/confirm logic (`execute-ability` is one tool for both reads and writes). This also conflicts with Claude's directory rule against catch-all read/write tools. (Inference from default-server.md + review criteria; not stated by either source.)
- To reach claude.ai / ChatGPT web users, the plugin (or a companion plugin) must provide an OAuth 2.1 authorization server with CIMD (preferred) or DCR, protected resource metadata, and audience-bound tokens. Without it, only desktop/IDE clients via Application Password are reachable.
- Abilities' `destructive` default is `true`; forgetting to set annotations makes every tool look destructive (and non-readonly) to clients.
- Bundling the adapter via Composer is deprecated from v0.7.0; depending on the installed plugin is the supported path. (The repo's latest commit already requires the MCP Adapter plugin and WP 6.9.)

### Gaps
- I did not read the make.wordpress.org 7.1 dev note directly; the 7.1 `public` flag details come from secondary sources plus the adapter docs.
- I did not confirm whether core 6.9's `/run` method rules exactly match the archived package docs.
- No first-party OAuth plugin for WordPress MCP was identified in this research; this is open.

---

## 5. Best practices for designing merchant-facing tools

### Takeaway
Build a few consolidated, workflow-shaped tools; split reads from writes; return compact, human-readable, paginated results with a concise/detailed switch; use actionable `isError` messages; annotate every tool; keep names short and namespaced; enforce authorization, rate limits and audit logging on the server.

### Cited Findings
- Anthropic (11 Sep 2025): "More tools don't always lead to better outcomes"; build few thoughtful tools for high-impact workflows instead of wrapping every endpoint (e.g. `schedule_event` instead of list + create); namespace with common prefixes; "return only high signal information"; resolve UUIDs to "semantically meaningful" language; offer a `response_format` (`concise`/`detailed`); use pagination, filtering, truncation and sensible defaults (Claude Code caps at 25,000 tokens); errors should "clearly communicate specific and actionable improvements, rather than opaque error codes or tracebacks"; describe tools like to a new team member, use unambiguous parameter names (`user_id` not `user`); evaluate with realistic multi-step tasks — [Anthropic Engineering: Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
- Claude directory: separate read and write tools (ideally create/update/delete separately); `title` + `readOnlyHint`/`destructiveHint` on every tool; names ≤64 chars; narrow accurate descriptions; actionable errors; "Keep responses reasonably sized"; don't collect conversation data beyond need — [Claude docs: pre-submission checklist](https://claude.com/docs/connectors/building/review-criteria.md)
- Spec: input validation errors belong in Tool Execution Errors (`isError: true`) to enable self-correction (SEP-1303) — [MCP 2025-11-25 changelog](https://modelcontextprotocol.io/specification/2025-11-25/changelog); deterministic `tools/list` order improves prompt-cache hit rates — [MCP spec: Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- Spec: servers "MUST: Validate all tool inputs; Implement proper access controls; Rate limit tool invocations; Sanitize tool outputs"; clients SHOULD "Log tool usage for audit purposes" and prompt for confirmation on sensitive operations — [MCP spec: Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- Spec: `x-mcp-header` SHOULD NOT be applied to "passwords, API keys, tokens, PII" because headers are visible to intermediaries — [MCP spec: Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- Pagination in MCP list methods uses opaque `cursor`/`nextCursor` — [MCP spec: Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- Result size limits: claude.ai ~150,000 chars / 240 s; Claude Code 25,000 tokens and 50,000-char persist threshold — [Claude docs](https://claude.com/docs/connectors/building); [Claude Code docs](https://code.claude.com/docs/en/mcp)
- ChatGPT: output schema + `structuredContent` with duplicated JSON text in `content`; keep approval on for tools that "modify data or take other consequential actions" — [OpenAI docs: MCP](https://developers.openai.com/api/docs/mcp/)
- Elicitation for confirmation: spec positions elicitation to "confirm an action or collect a missing parameter" — [MCP blog: 2026-07-28](https://blog.modelcontextprotocol.io/posts/2026-07-28/); adapter example asks "Allow post creation?" before calling the ability, checks `client_supports_elicitation()` and returns an error otherwise — [mcp-adapter mrtr.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/mrtr.md)
- Claude Code honors `_meta["anthropic/requiresUserInteraction"]` to force a human prompt on every call — [Claude Code docs: MCP](https://code.claude.com/docs/en/mcp)
- WooCommerce: dedicated least-privilege user; PII in order/customer data is the merchant's compliance responsibility — [WooCommerce MCP docs](https://developer.woocommerce.com/docs/features/mcp/)
- Existing project tool already applies rate limiting at transport level (60 requests/minute/user over HTTP) and a `manage_options` check per tool — repo commit 182d7415 message (local `git show`).

### Inferences
Recommended patterns for Kirki eCommerce (synthesis):
- **Granularity**: workflow tools (`sales_report`, `find_orders`, `get_order`, `low_stock_products`, `top_customers`) rather than one per REST endpoint; separate write tools (`update_order_status`, `adjust_stock`, `create_coupon`, `refund_order`).
- **Naming**: short verb_noun under a `kirki` prefix when needed; ≤64 chars after sanitisation (`kirki-ecommerce-` already uses 16).
- **Pagination**: `limit` (default ~20, max ~100) + opaque `cursor`; return `total` and `next_cursor`; filters (date range, status, customer) instead of dumping.
- **Output**: `structuredContent` with `outputSchema` plus a short text summary; human-readable labels (order number, product name, currency-formatted totals) alongside IDs; `response_format: concise|detailed`.
- **PII**: default to masked/minimal customer fields (first name + initial, masked email), full PII only on a dedicated `get_order` / `get_customer` call with capability check; never put PII in URLs, headers or logs.
- **Write safety**: `destructiveHint: true` on refunds/cancels/deletes; `idempotentHint` where safe with idempotency keys; a `dry_run` / preview mode that returns the planned change plus a short-lived, user-bound confirmation token; elicitation confirm when the client supports it (direct tool), fallback to the two-step token otherwise; `requiresUserInteraction` meta for money-moving actions.
- **Rate limits**: per-user per-tool limits, stricter for writes; return an `isError` message with retry-after.
- **Audit log**: record user, client (from verified credential, not `clientInfo`), tool, arguments (redacted), result status, timestamp; expose to merchant in admin.

### Gaps
- No vendor source gave concrete numeric pagination defaults for MCP tools; the numbers above are suggestions.
- No first-party guidance found on a standard "dry-run" field name in MCP; it is a design convention, not a spec feature.

---

## 6. Security guidance: prompt injection, confused deputy, least privilege, human-in-the-loop

### Takeaway
Store data (reviews, customer notes, order notes, product descriptions from imports) is untrusted content that can carry prompt injection. Combined with private data access and an outbound channel it forms the "lethal trifecta". Mitigate with least-privilege users/scopes, server-side authorization on every call, no token passthrough, user-bound state handles, clear marking of untrusted text, and a human approval step for money-moving or destructive actions. Annotations and elicitation answers are hints, not security controls.

### Cited Findings
- **Lethal trifecta**: access to private data + exposure to untrusted content + ability to communicate externally; MCP makes this worse because users mix tools from different sources; the GitHub MCP exploit used a malicious public issue to exfiltrate private repo data — [Simon Willison, 16 Jun 2025](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)
- **Annotations untrusted**: clients "MUST consider tool annotations to be untrusted unless they come from trusted servers" — [MCP spec: Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools); OpenAI: hints only shape the UX; "servers must still enforce their own authorization logic" — [OpenAI Apps SDK reference](https://developers.openai.com/apps-sdk/reference); ChatGPT warns write actions may happen even if a tool is tagged read-only — [OpenAI docs: MCP](https://developers.openai.com/api/docs/mcp/)
- **Elicitation is not proof of human approval**: "An `accept` answer is not independently verified human approval"; state and answers are attacker-controlled; bind to authenticated user — [mcp-adapter mrtr.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/mrtr.md). Spec: servers MUST bind elicitation to client and user identity; "MUST NOT rely on client-provided user identification"; URL-mode MUST NOT carry PII or pre-authenticated URLs; server MUST verify the user who opens the URL is the one who started it (phishing) — [MCP spec: Elicitation](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation)
- **Confused deputy**: MCP proxy servers with a static client ID to a third-party AS + DCR + consent cookies can leak auth codes; mitigation: per-client consent stored server-side, consent page showing client name/scopes/redirect URI, CSRF protection, exact redirect URI matching, single-use short-lived `state` — [MCP Security Best Practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices.md)
- **Token passthrough forbidden**: "MCP servers MUST NOT accept any tokens that were not explicitly issued for the MCP server" (audience validation, RFC 9068) — [MCP Security Best Practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices.md)
- **State handle hijacking** (replaces session hijacking under stateless MCP): servers "MUST NOT treat possession of a state handle as authentication", SHOULD use random non-sequential handles and bind them server-side to the verified user (`<user_id>:<handle>`) — [MCP Security Best Practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices.md)
- **Scope minimization**: minimal initial scopes for read/discovery, step-up via `WWW-Authenticate scope="..."` for privileged operations, avoid omnibus scopes, log elevation events — [MCP Security Best Practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices.md)
- **SSRF on CIMD**: an authorization server that accepts CIMD fetches client-supplied URLs; block private IP ranges and use egress proxies — [MCP Security Best Practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices.md)
- **Local server**: prefer stdio for local servers; restrict HTTP with tokens — [MCP Security Best Practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices.md)
- **Human in the loop**: spec — "there SHOULD always be a human in the loop with the ability to deny tool invocations" — [MCP spec: Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools). Claude: destructive tools always prompt — [Claude review checklist](https://claude.com/docs/connectors/building/review-criteria.md). ChatGPT: manual confirmation before write actions — [OpenAI docs: MCP](https://developers.openai.com/api/docs/mcp/)
- **Tool descriptions as an injection vector**: Claude rejects descriptions that instruct Claude to call unrequested tools, pull behavioural instructions from external sources, or contain hidden/encoded instructions — [Claude review checklist](https://claude.com/docs/connectors/building/review-criteria.md)
- **Least privilege in WordPress**: "every action runs with that user's role and permissions"; revoke Application Passwords under Users > Profile — [mcp-adapter site-owners.md](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/getting-started/site-owners.md); WooCommerce recommends a dedicated user with only needed capabilities — [WooCommerce MCP docs](https://developer.woocommerce.com/docs/features/mcp/)
- **Money movement**: Claude's directory does not accept connectors that transfer money or financial assets — [Claude review checklist](https://claude.com/docs/connectors/building/review-criteria.md)

### Inferences
- Treat review text, customer notes, order notes, coupon descriptions and imported product content as data: return them in clearly delimited fields (e.g. `untrusted_text`), cap length, strip markup, and never let such content trigger a write without a fresh human confirmation.
- Avoid giving the same MCP session both broad PII-reading tools and outbound-communication tools (send email to customer, webhook) without confirmation, to break the trifecta.
- Refunds/cancellations: destructive annotation + per-call human approval (`requiresUserInteraction` in Claude Code, elicitation where supported, two-step token otherwise) + server-side amount caps + audit log entry. Consider leaving actual refunds out of v1 for directory eligibility.
- Use a dedicated "AI assistant" role with narrow custom capabilities (e.g. `view_kirki_reports`, `edit_kirki_orders`) rather than `manage_options` for all tools.
- If OAuth is added, implement audience-bound tokens, CIMD with SSRF protection, and per-tool scopes mapped to WordPress capabilities.

### Gaps
- I did not fetch Anthropic's or OpenAI's dedicated prompt-injection guidance pages; findings rely on the MCP spec, Claude review criteria, OpenAI MCP/Apps docs and Willison.
- No source found that gives eCommerce-specific prompt-injection incidents via product reviews or order notes; the risk is inferred from the general mechanism.
