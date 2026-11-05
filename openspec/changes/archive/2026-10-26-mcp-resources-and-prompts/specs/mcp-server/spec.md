## ADDED Requirements

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
