# mcp-server Specification

## Purpose

Defines the plugin's Model Context Protocol server: its id, how a client
reaches it, who may use it, and how often it can be called.

## Requirements

### Requirement: Server id and transports

The plugin SHALL expose one MCP server with the id `kirki-ecommerce`. The
server SHALL be reachable over HTTP at
`/wp-json/<plugin REST namespace>/mcp/kirki-ecommerce` and over WP-CLI STDIO
with `wp mcp-adapter serve --server=kirki-ecommerce`. The server SHALL list
the sales report tool.

#### Scenario: HTTP client lists the tools

- **WHEN** an administrator's MCP client sends `tools/list` to the HTTP endpoint
- **THEN** the response lists the `kirki-ecommerce-sales-report` tool

#### Scenario: STDIO session

- **WHEN** a user with shell access runs `wp mcp-adapter serve --server=kirki-ecommerce --user=<admin>`
- **THEN** the session lists the `kirki-ecommerce-sales-report` tool

### Requirement: Server needs the MCP Adapter

The server SHALL exist only when WordPress has the Abilities API (6.9 or
later) and the MCP Adapter plugin is active. Without them, the plugin SHALL
run with no error and no MCP endpoint.

#### Scenario: Adapter plugin is not active

- **WHEN** the MCP Adapter plugin is not active
- **THEN** no MCP route is registered and the plugin loads with no error or warning

### Requirement: Each tool checks its own access

The server SHALL NOT have a capability check of its own. The MCP Adapter's
default transport gate SHALL apply to HTTP requests. Each tool SHALL check the
capability that it needs before it runs, so that later tools can be for other
roles. HTTP clients SHALL sign in with a WordPress application password.

#### Scenario: Anonymous request is rejected

- **WHEN** a request without credentials is sent to the HTTP endpoint
- **THEN** the adapter's default gate rejects the request with a permission error

#### Scenario: Editor cannot run an administrator tool

- **WHEN** a user with the `editor` role calls the `kirki-ecommerce-sales-report` tool
- **THEN** the call is rejected with a permission error and the tool does not run

#### Scenario: Administrator is accepted

- **WHEN** an administrator signs in with an application password and calls the `kirki-ecommerce-sales-report` tool
- **THEN** the call succeeds

### Requirement: HTTP rate limit

HTTP requests to the server SHALL be limited to 60 per minute for each user.
A request over the limit SHALL get status 429 with a `Retry-After` header.
STDIO sessions SHALL NOT be limited.

#### Scenario: Too many requests

- **WHEN** one administrator sends a 61st request to the HTTP endpoint within one minute
- **THEN** that request gets status 429 with a `Retry-After` header

### Requirement: Server offers resources and prompts

The `kirki-ecommerce` server SHALL list the store resources in
`resources/list` and the store prompts in `prompts/list`, on both the HTTP and
the STDIO transport. Each resource and each prompt SHALL check the capability
that it needs, the same as a tool. The server SHALL NOT have a capability
check of its own for them.

#### Scenario: Client lists the resources

- **WHEN** an administrator's MCP client sends `resources/list`
- **THEN** the response lists the 7 store resources, each with its `kecom://` URI and the `application/json` MIME type

#### Scenario: Client lists the prompts

- **WHEN** an administrator's MCP client sends `prompts/list`
- **THEN** the response lists the 6 store prompts, each with its arguments

#### Scenario: Editor cannot read a resource

- **WHEN** a user with the `editor` role reads `kecom://store/profile`
- **THEN** the read is rejected with a permission error and no store data is returned
