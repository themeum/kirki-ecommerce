## Context

See proposal.md for the motivation. Current state that shapes the approach:

- `AppServiceProvider::boot()` always calls
  `Mcp::server('kirki-ecommerce', StoreServer::class)`. `StoreServer` lists
  29 tool classes, 7 resource classes and 6 prompt classes in `$tools`,
  `$resources` and `$prompts`.
- The framework-mcp `McpManager::register_abilities()` reads
  `$server->tools()`, `resources()` and `prompts()` to register abilities,
  and `create_servers()` passes the same names to the adapter. So an
  override of these 3 methods controls both the Abilities API registration
  and the MCP listing. We do not need to edit the scoped package.
- Read tools extend `StoreReadTool` (`$read_only = true`). Write tools
  extend `StoreWriteTool` (`$read_only = false`), directly or through
  `OrderActionTool`. There are 11 read tools and 18 write tools.
- Ability names come from `Ability::name()`: `kirki-ecommerce/<class-slug>`
  (for example `kirki-ecommerce/cancel-order`).
- Settings sections are `AppSettings` subclasses keyed by `OptionKeys`. The
  defaults come from `resources/data/settings/<key>.json`, merged with
  `array_merge` (top level only). `SettingsUpdateRequest` holds per-section
  rules and filters. `SettingResource::to_array()` adds read-only values per
  section (as `advance` does for pages).
- The settings UI uses `useSettingsQuery(key)` and
  `useUpdateSettingsMutation()`. The Legal page is the model for "save at
  each toggle": optimistic local state, rollback on error.
- `StackedItems` rows have a fixed height of 34px and no expand behaviour.

## Goals / Non-Goals

**Goals:**

- One PHP source of truth for "is this ability on", used by both the server
  and the settings response.
- No change to `vendor/libraries/framework-mcp/src/`.
- No change to the `StackedItems` component API.

**Non-Goals:**

- No storage of connections or keys, no activity log.
- No automatic test that a real MCP client connects; the PHP integration
  tests cover the registered ability list.

## Decisions

### 1. Group map in a constants class

Add `app/Mcp/AbilityGroups.php` (a `final` constants-only class, allowed by
the PHP standards). It maps each group id (`sales`, `orders`, `products`,
`customers`, `coupons`, `store_setup`) to a translatable label key and its
component classes, in catalog order. A unit test asserts that the union of
the groups is equal to `StoreServer`'s 3 lists, with no class in 2 groups.

- Alternative: use each ability's Abilities API `$category` as the group.
  Rejected: it needs 6 registered categories and makes the UI grouping a
  public Abilities API contract.
- Alternative: derive `StoreServer`'s lists from the group map. Rejected:
  `docs/mcp.md` §19 tells contributors to add a class to `StoreServer`; the
  test catches a class added to one list only.

### 2. `McpAbilities` service decides what is on

Add `app/Mcp/McpAbilities.php` (a singleton bound in `AppServiceProvider`).
It reads `Settings::get('mcp')` and gives:

- `is_enabled()`: the `enabled` value.
- `catalog()`: the groups with each entry's name, kind, title, description
  and `is_write` (from `read_only()` on a tool; resources and prompts are
  never write).
- `filter(array $classes)`: the classes whose ability is on by the rule in
  the `mcp-settings` spec (group on, own value on, not a write tool while
  read-only), ignoring `enabled`.
- `count_on()`: the "N" for the Abilities row.

It makes each component with `app()->make($class)` to read its metadata. A
missing key in `groups` or `abilities` counts as on, so new abilities from a
plugin update start on.

### 3. Server filters itself; the provider skips registration when off

`StoreServer` overrides `tools()`, `resources()` and `prompts()` to return
`McpAbilities::filter(parent::...())`. `AppServiceProvider::boot()` calls
`Mcp::server(...)` only when `McpAbilities::is_enabled()` is true. The
settings option is read on each request, so a save applies from the next
request.

- Alternative: keep the route and return 503 from `permission()`. Rejected
  in the grill: no endpoint must exist until the merchant opts in.

### 4. Storage shape and validation

`resources/data/settings/mcp.json`:
`{"enabled": false, "read_only": false, "groups": {}, "abilities": {}}`.
Empty maps mean "all on" and avoid a stored copy of the catalog. The
`SettingsUpdateRequest` rules accept `data.enabled` and `data.read_only` as
booleans, and `data.groups.*` and `data.abilities.*` as booleans. A custom
check rejects any key of `groups` or `abilities` that is not in the group
map or the catalog. The filters cast values to booleans.

The UI always sends the full `groups` and `abilities` maps with each save,
because `AppSettings::set()` replaces nested maps. "Reset to default" sends
`read_only: false` and empty maps.

### 5. Read-only values in the GET response

`SettingResource::to_array()` adds, for the `mcp` key: `catalog`,
`server_url` (`rest_url()` of the server route; `null` when the adapter is
not available), `user_login`, `profile_url`
(`admin_url('profile.php#application-passwords-section')`),
`application_passwords_available`
(`wp_is_application_passwords_available_for_user()`), and
`adapter_available` (the Abilities API function and the MCP Adapter class
exist). `SettingsController::update()` returns the same resource, so the
UI gets fresh values after each save. The update request ignores these keys.

### 6. Frontend structure

New feature folder `resources/app/features/settings/mcp/`:

- `schemas/catalog/mcp.ts`: the GET shape, added to `SettingsSchemaMap`.
- `schemas/forms/mcp-settings-form.ts`: the payload schema
  (`enabled`, `read_only`, `groups`, `abilities`), added to
  `SettingsPayloadMap`, with its payload test.
- `lib/abilities.ts`: pure helpers `isAbilityOn()`, `isAbilityBlocked()`,
  `countAbilitiesOn()`, `resetAbilities()`, mirroring the PHP rule, with
  unit tests.
- `lib/client-configs.ts`: the per-client config builder (JSON for Claude
  Desktop, Cursor, VS Code, Windsurf and Other; TOML for Codex; a CLI
  command for Claude Code and Gemini CLI) and where each one goes, with unit
  tests.
- `pages/mcp-settings.tsx`, `pages/mcp-abilities.tsx`.
- `components/connect-app-dialog.tsx`, `components/ability-group.tsx`,
  `components/settings-switch-row.tsx` (title and description on the left,
  control top-aligned with the title).
- `skeletons/mcp-settings-skeleton.tsx`.
- Routes `McpSettings: defineRoute('/mcp', { McpAbilities:
  defineRoute('/abilities') })`; the sidebar item goes in
  `advancedSettings`. The sub-page uses the existing drill-down pattern
  (as the shipping zone page does).

A shared hook `use-mcp-settings.ts` holds the optimistic state and the
`commit(updater)` function, with the same ref-based pattern as the Legal
page, so the MCP page and the Abilities sub-page save the same way.

### 7. Each group is one `StackedItems` list

The first `StackedItem` is the group row: name, "n/m" count, an expand
button and the group `Switch`. When the group is open, one `StackedItem`
per ability follows: title, type `Badge`, Read or Write `Badge`, an
`InfoTooltip` for the description (the row is 34px high, so the
description cannot wrap under the title), the "Blocked by read-only" badge
when it applies, and the `Switch`. Groups start closed. The open state is
local UI state and is not stored.

### 8. Client configs use the npx remote package

Every client runs `npx -y @automattic/mcp-wordpress-remote@latest` with
`WP_API_URL`, `WP_API_USERNAME` and `WP_API_PASSWORD`. The server key in
each config is `kirki-ecommerce`. Decided in the grill: one auth method for
all clients, and no base64 header for the merchant to make by hand.

### Correction during implementation: Gemini CLI config

Decision 6 listed Gemini CLI as a CLI command. The implementation gives it
an `mcpServers` JSON for `~/.gemini/settings.json` (or `.gemini/settings.json`
in a project), the same shape as Claude Desktop. The `gemini mcp add` option
order for a command whose own arguments start with `-y` is not clear, and
the settings file format is documented. Only Claude Code gets a CLI command.

### Correction during implementation: registration test

`AppServiceProvider::boot()` runs one time per test process, with the
default (off) settings. The registration logic is in
`McpAbilities::register_server($manager)`, so the tests call it on a fresh
`McpManager` to cover the "on" case.

## Risks / Trade-offs

- [Settings read in `boot()` before the settings layer is ready] → The
  settings are a WordPress option; the provider boots after plugins load.
  If the read fails in a test, move the check into a callback on the
  adapter init hook and record a correction here.
- [A class added to `StoreServer` but not to `AbilityGroups`] → The unit
  test fails. Also update `docs/mcp.md` §19.
- [Save at each toggle sends many requests on fast clicks] → The ref-based
  commit builds each request on the previous one, as on the Legal page. The
  last response wins.
- [`@automattic/mcp-wordpress-remote` changes its env names] → The names are
  in one builder file with tests; the docs link to the package.
- [Sites on `feat/mcp` lose the endpoint after update] → Unreleased branch;
  `docs/mcp.md` quick start says to turn MCP on first.

## Migration Plan

No data migration. On update, the `mcp` option does not exist, so the
defaults apply and MCP is off. Rollback: revert the change; the stored
`mcp` option is ignored by the old code.
