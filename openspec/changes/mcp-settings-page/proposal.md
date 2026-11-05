## Why

The `kirki-ecommerce` MCP server is always on when the MCP Adapter is active,
and it always offers all 29 tools, 7 resources and 6 prompts. A merchant
cannot turn it off, cannot stop AI apps from changing data, and cannot remove
one ability. The merchant also has no screen that tells how to connect an AI
app. For a wp.org plugin, a new endpoint that can change store data must be
off until the merchant turns it on.

## What Changes

- Add a **Settings › MCP** page (sidebar item in the "Advanced" group). It
  has two sections:
  - **Configuration**: the main "Kirki eCommerce MCP" switch, the server URL
    with a copy button, the "Read-only mode" switch, and an "Abilities" row
    that shows "N of M on" and opens the Abilities sub-page. Each switch is
    on the same line as its row title.
  - **Connect an AI app**: an intro card with client logos and a
    "+ Connect app" button. The button opens a dialog. The merchant picks a
    client (Claude Desktop, Claude Code, Cursor, VS Code, Codex, Gemini CLI,
    Windsurf, Other). The dialog shows a config that runs
    `@automattic/mcp-wordpress-remote` with `WP_API_URL`, `WP_API_USERNAME`
    (the signed-in user) and a `WP_API_PASSWORD` placeholder, plus the steps
    to make a WordPress application password in Users › Profile.
- Add a **Settings › MCP › Abilities** sub-page. It shows 6 domain groups
  (Sales & analytics, Orders, Products & inventory, Customers, Coupons,
  Store setup). Each group is one `StackedItems` list: the first row is the
  group row (switch and expand control), and the next rows are the group's
  tools, resources and prompts with a type badge and, for tools, a Read or
  Write badge. The page has a "Reset to default" button and a read-only
  banner.
- Each switch saves at once. There is no draft and no floating save bar.
- A group that is off shows its rows off and disabled. Read-only mode shows
  every write tool off and disabled with a "Blocked by read-only" badge. The
  stored value of each row does not change, so it comes back when the group
  or read-only mode changes back.
- Add an `mcp` settings section (`OptionKeys::MCP_SETTINGS`) that stores
  `enabled`, `read_only`, `groups` and `abilities`. The GET response also
  gives the ability catalog, the server URL, the signed-in user's login, the
  profile URL, and whether the MCP Adapter is available.
- **BREAKING** (for the unreleased `feat/mcp` branch only): MCP is **off by
  default**. When it is off, the plugin does not register the
  `kirki-ecommerce` server, so the HTTP route and the WP-CLI server do not
  exist.
- When MCP is on, the server registers only the abilities that are on. An
  ability is off when its own switch is off, when its group is off, or, for
  a write tool, when read-only mode is on.
- When WordPress is older than 6.9 or the MCP Adapter plugin is not active,
  the MCP page shows a warning with the requirements. The switches stay
  usable, and the server URL row shows "Not available".
- Update `docs/mcp.md` with the settings page, the default-off behaviour and
  the connect steps.

Out of scope: a list of connections, per-connection keys, the activity log,
OAuth sign-in for web apps, search on the Abilities page, and the
"Advanced" (low-level) ability group from the design.

## Capabilities

### New Capabilities

- `mcp-settings`: the MCP settings page, the Abilities sub-page, the
  Connect app dialog, the `mcp` settings section and its stored shape, and
  the rules for which abilities are on.

### Modified Capabilities

- `mcp-server`: the server exists only when MCP is turned on in settings,
  and it lists only the tools, resources and prompts that are on.

## Impact

- PHP: `app/Constants/OptionKeys.php`, new `app/Settings/McpSettings.php`,
  `app/Settings/SettingsFactory.php`, `resources/data/settings/mcp.json`,
  `app/Http/Requests/Settings/SettingsUpdateRequest.php`,
  `app/Resources/SettingResource.php`, `app/Mcp/Servers/StoreServer.php`, a
  new ability group map under `app/Mcp/`, and
  `app/Providers/AppServiceProvider.php`.
- React: new `resources/app/features/settings/mcp/` feature (pages,
  components, schemas, tests, skeleton), `config/route-config.ts`,
  `features/settings/routes.tsx`, `features/settings/lib/utils.tsx`,
  `features/settings/index.ts`, `schemas/catalog/settings.ts`,
  `services/settings.ts`.
- Docs: `docs/mcp.md`.
- Sites on the `feat/mcp` branch lose the MCP endpoint until an
  administrator turns MCP on.
