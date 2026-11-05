## MODIFIED Requirements

### Requirement: Server id and transports

The plugin SHALL expose one MCP server with the id `kirki-ecommerce`. The
server SHALL exist only when MCP is turned on in the store's MCP settings.
When MCP is off, the plugin SHALL NOT register the server, so that no HTTP
route and no WP-CLI server with this id exist. When MCP is on, the server
SHALL be reachable over HTTP at
`/wp-json/<plugin REST namespace>/mcp/kirki-ecommerce` and over WP-CLI STDIO
with `wp mcp-adapter serve --server=kirki-ecommerce`. A change to the MCP
settings SHALL apply from the next request, with no other step.

#### Scenario: HTTP client lists the tools

- **WHEN** MCP is on with the default abilities and an administrator's MCP client sends `tools/list` to the HTTP endpoint
- **THEN** the response lists the `kirki-ecommerce-sales-report` tool

#### Scenario: STDIO session

- **WHEN** MCP is on with the default abilities and a user with shell access runs `wp mcp-adapter serve --server=kirki-ecommerce --user=<admin>`
- **THEN** the session lists the `kirki-ecommerce-sales-report` tool

#### Scenario: MCP is off

- **WHEN** MCP is off in the store's MCP settings and a client sends a request to `/wp-json/<plugin REST namespace>/mcp/kirki-ecommerce`
- **THEN** WordPress answers with its "no route" error and no MCP tool runs

#### Scenario: Fresh install

- **WHEN** the plugin is installed on a new site and nobody changed the MCP settings
- **THEN** the `kirki-ecommerce` server does not exist

### Requirement: Server offers resources and prompts

The `kirki-ecommerce` server SHALL list the store resources that are on in
`resources/list` and the store prompts that are on in `prompts/list`, on both
the HTTP and the STDIO transport. Each resource and each prompt SHALL check
the capability that it needs, the same as a tool. The server SHALL NOT have a
capability check of its own for them.

#### Scenario: Client lists the resources

- **WHEN** MCP is on with the default abilities and an administrator's MCP client sends `resources/list`
- **THEN** the response lists the 7 store resources, each with its `kecom://` URI and the `application/json` MIME type

#### Scenario: Client lists the prompts

- **WHEN** MCP is on with the default abilities and an administrator's MCP client sends `prompts/list`
- **THEN** the response lists the 6 store prompts, each with its arguments

#### Scenario: Editor cannot read a resource

- **WHEN** a user with the `editor` role reads `kecom://store/profile`
- **THEN** the read is rejected with a permission error and no store data is returned

## ADDED Requirements

### Requirement: Server offers only the abilities that are on

When the server exists, it SHALL list, register and run only the tools,
resources and prompts that are on by the store's MCP settings. A tool,
resource or prompt that is off SHALL NOT be in `tools/list`,
`resources/list` or `prompts/list`, and a call to it SHALL fail as an
unknown tool, resource or prompt.

#### Scenario: Ability turned off

- **WHEN** an administrator turns off `kirki-ecommerce/cancel-order` and a client sends `tools/list`
- **THEN** the response does not list `kirki-ecommerce-cancel-order`

#### Scenario: Call to a tool that is off

- **WHEN** read-only mode is on and a client calls `kirki-ecommerce-update-prices`
- **THEN** the call fails as an unknown tool and no price changes

#### Scenario: Group off removes its resource and prompt

- **WHEN** an administrator turns the Orders group off and a client sends `resources/list` and `prompts/list`
- **THEN** the responses do not list the order lifecycle resource or the investigate order prompt
