## 1. MCP settings section (PHP)

- [x] 1.1 Add `OptionKeys::MCP_SETTINGS = 'mcp'`, `app/Settings/McpSettings.php`, its case in `SettingsFactory`, and `resources/data/settings/mcp.json` (`enabled: false`, `read_only: false`, empty `groups` and `abilities`)
- [x] 1.2 Add `app/Mcp/AbilityGroups.php` with the 6 groups and their classes in the order of the `mcp-settings` spec, and a unit test that the union of the groups equals `StoreServer`'s tool, resource and prompt lists with no class in 2 groups
- [x] 1.3 Add `app/Mcp/McpAbilities.php` (`is_enabled()`, `catalog()`, `filter()`, `count_on()`), bind it as a singleton, and add integration tests for: missing keys count as on, group off, ability off, read-only blocks only write tools, stored values unchanged by group or read-only
- [x] 1.4 Add the `mcp` rules and filters to `SettingsUpdateRequest` (booleans; reject unknown group ids and ability names) with integration tests for a valid save, an unknown ability name, and a non-boolean value
- [x] 1.5 Add the `mcp` read-only values to `SettingResource` (`catalog`, `server_url`, `user_login`, `profile_url`, `application_passwords_available`, `adapter_available`) and make sure a save ignores them; add an integration test for the GET response, including the adapter-missing case
- [x] 1.6 Verify: `composer test:integration` for the new tests, `composer phpcs:wporg`, then `npm run typecheck && npm test` in `resources/app/` (new tests pass in Docker; phpcs clean; typecheck passes; `npm test` has 9 failures in `features/list-page-empty-state.test.tsx` that exist before this change and are not related to it)

## 2. Server follows the settings (PHP)

- [x] 2.1 Override `tools()`, `resources()` and `prompts()` in `StoreServer` to return `McpAbilities::filter()` of the full lists
- [x] 2.2 In `AppServiceProvider::boot()`, register the `kirki-ecommerce` server only when MCP is enabled; if the settings read is not possible there, move the check to the adapter init hook and add a "Correction during implementation" note to design.md
- [x] 2.3 Update the existing MCP integration tests (`McpServerTest` and the tool, resource and prompt tests) to turn MCP on in their set-up (only `McpServerTest` needed it: the tool, resource and prompt tests call the components directly. The plugin boots once per test run, so the registration test uses a fresh `McpManager`)
- [x] 2.4 Add `McpServerTest` cases: no route when MCP is off and on a fresh install, an ability that is off is not listed and a call to it fails as unknown, read-only removes write tools, a group off removes its resource and prompt
- [x] 2.5 Verify: `composer test`, `composer phpcs:wporg`, then `npm run typecheck && npm test` in `resources/app/`

## 3. Frontend data layer

- [x] 3.1 Add `features/settings/mcp/schemas/catalog/mcp.ts` (GET shape) and register it as `mcp` in `schemas/catalog/settings.ts`
- [x] 3.2 Add `features/settings/mcp/schemas/forms/mcp-settings-form.ts` (`enabled`, `read_only`, `groups`, `abilities`), export its payload type from `features/settings/index.ts`, add it to `SettingsPayloadMap`, and write `features/settings/mcp/tests/schemas/forms/mcp-settings-form.test.ts`
- [x] 3.3 Add `features/settings/mcp/lib/abilities.ts` (`isAbilityOn`, `isAbilityBlocked`, `countAbilitiesOn`, `resetAbilities`) with tests that mirror the PHP rule, including "24 of 42 on" with read-only on
- [x] 3.4 Add `features/settings/mcp/lib/client-configs.ts` for the 8 clients (config text, where it goes) with tests for the Claude Desktop JSON, the Claude Code command and the Codex TOML (Gemini CLI uses a `settings.json` snippet, not a CLI command; see design.md correction)
- [x] 3.5 Add `features/settings/mcp/hooks/use-mcp-settings.ts`: optimistic state, ref-based `commit(updater)` that sends the full `groups` and `abilities` maps, rollback on error
- [x] 3.6 Verify: `npm run typecheck && npm test` in `resources/app/`

## 4. MCP settings page

- [x] 4.1 Add routes `McpSettings` (`/mcp`) and `McpAbilities` (`/mcp/abilities`) in `config/route-config.ts` and `features/settings/routes.tsx`, with `skeletons/mcp-settings-skeleton.tsx`
- [x] 4.2 Add the "MCP" item to `advancedSettings` in `features/settings/lib/utils.tsx`
- [x] 4.3 Add `components/settings-switch-row.tsx` (control top-aligned with the title) and build the Configuration card in `pages/mcp-settings.tsx`: main switch, server URL with copy or "Not available", read-only switch, Abilities "N of M on" link, adapter warning
- [x] 4.4 Add `components/connect-app-dialog.tsx`: client picker, config with copy, file location, application password steps with the profile link, Node.js note, "MCP is off" note, and the warning when application passwords are not available; add the "Connect an AI app" card with the "+ Connect app" button
- [x] 4.5 Add `data-search-id` and keywords to the cards and run `npm run search:index` to check for warnings (added the `mcp` page to `SETTINGS_PAGES` in `scripts/build-settings-search-index.mjs`; the Abilities sub-page has no search id, because the index maps one route per page)
- [x] 4.6 Verify: `npm run typecheck && npm test && npm run lint` in `resources/app/`

## 5. Abilities sub-page

- [x] 5.1 Add `components/ability-group.tsx`: one `StackedItems` per group, group row (name, n/m count, expand button, switch), ability rows (title, type badge, Read or Write badge, description tooltip, "Blocked by read-only" badge, switch), disabled states for group off and read-only
- [x] 5.2 Build `pages/mcp-abilities.tsx`: header with "Reset to default" and its confirm dialog, read-only banner with "Turn off", and the 6 groups
- [x] 5.3 Verify: `npm run typecheck && npm test && npm run lint` in `resources/app/` (also added `tests/components/ability-group.test.tsx` for the disabled and read-only states; `npm test` still has only the 9 old failures in `features/list-page-empty-state.test.tsx`)

## 6. Docs

- [x] 6.1 Update `docs/mcp.md`: quick start turns MCP on first; new section for the settings page, the Abilities sub-page, read-only mode and the Connect app steps; §19 "Adding a tool" also adds the class to `AbilityGroups`; "Where this differs" notes no per-connection keys and no activity log
- [x] 6.2 Verify: `npm run typecheck && npm test` in `resources/app/`, and `composer test` once more for the whole change (PHP: all unit and integration tests pass in Docker; typecheck and lint clean; `npm test` fails only in the old `features/list-page-empty-state.test.tsx`)

## 7. Design review updates

- [x] 7.1 Add a description to each group in the catalog response, with a test
- [x] 7.2 MCP page: "Configuration" and "Connections" titles outside the cards; MCP switch in the card header; card body hidden while MCP is off; server URL field on the right that scrolls and has a copy button that does not cover the URL; whole Abilities row is a link; read-only banner below the card
- [x] 7.3 Connections card: "Connect your AI app" with icon-only client logos that have the name as a native `title` (logos come from the design file: Claude for Claude Desktop and Claude Code, Cursor, Copilot for VS Code, Gemini. Codex, Windsurf and Other have no logo, so they show in the dialog only)
- [x] 7.4 Abilities page: one accordion per group (as the shipping zones) with name, description, counts and switch in the header; rows show the mode right-aligned before the switch; tooltip icon appears on row hover or focus
- [x] 7.5 Update the DOM test and `docs/mcp.md`
- [x] 7.6 Verify: `npm run typecheck && npm test && npm run lint` in `resources/app/`, and the MCP PHP tests in Docker
