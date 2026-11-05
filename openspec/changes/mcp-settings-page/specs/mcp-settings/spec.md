## Purpose

Lets a store administrator turn the store's MCP server on or off, limit it
to read-only use, choose which tools, resources and prompts it offers, and
get the steps to connect an AI app.

## ADDED Requirements

### Requirement: MCP settings are stored as one settings section

The plugin SHALL store the MCP settings in a settings section with the key
`mcp`, read and written through the existing settings endpoints. The section
SHALL hold `enabled` (boolean), `read_only` (boolean), `groups` (a map of
group id to boolean) and `abilities` (a map of ability name to boolean).
The defaults SHALL be `enabled: false`, `read_only: false`, and every group
and every ability on. A group id or ability name that is not in the stored
map SHALL count as on. A save SHALL accept only the known group ids and
ability names, and SHALL reject other keys and non-boolean values.

#### Scenario: Fresh install

- **WHEN** an administrator reads the `mcp` settings on a site that never saved them
- **THEN** `enabled` is `false`, `read_only` is `false`, and every group and ability counts as on

#### Scenario: New ability after an update

- **WHEN** a plugin update adds an ability whose name is not in the stored `abilities` map
- **THEN** that ability counts as on

#### Scenario: Unknown ability name is rejected

- **WHEN** an administrator saves `abilities` with the key `kirki-ecommerce/not-a-tool`
- **THEN** the save is rejected with a validation error and the stored settings do not change

### Requirement: Settings response describes the server

The GET response of the `mcp` section SHALL also give, as read-only values
that a save ignores: the ability catalog, the server URL, the signed-in
user's login, the URL of the signed-in user's profile page, whether
application passwords are available for that user, and whether the MCP
Adapter is available. The catalog SHALL list the 6 groups in this order
with these members:

- Sales & analytics: tools sales report, sales trend, product performance,
  sales breakdown; resource analytics definitions; prompts morning brief,
  weekly review, monthly close.
- Orders: tools find orders, get order, add order note, update fulfillment,
  mark order paid, resend order email, cancel order, create manual order;
  resource order lifecycle; prompt investigate order.
- Products & inventory: tools find products, stock levels, update product
  content, create draft product, duplicate product, change product status,
  adjust stock, update prices; resource catalog structure; prompt low stock
  check.
- Customers: tools find customers, update customer tags.
- Coupons: tools find coupons, create coupon, set coupon state, update
  coupon.
- Store setup: tools setup status, fix store pages, update email
  notification; resources store profile, currencies, checkout and payments,
  tax and shipping; prompt setup guide.

Each catalog entry SHALL give the ability name, its type (`tool`,
`resource` or `prompt`), its title, its description, and for a tool whether
it is a write tool. Every tool, resource and prompt of the server SHALL be
in exactly one group.

#### Scenario: Catalog covers the server

- **WHEN** an administrator reads the `mcp` settings
- **THEN** the catalog lists 6 groups with 42 abilities in total: 29 tools, 7 resources and 6 prompts, each in exactly one group

#### Scenario: Write tools are marked

- **WHEN** an administrator reads the catalog entry of `kirki-ecommerce/cancel-order`
- **THEN** its type is `tool` and it is marked as a write tool

#### Scenario: Adapter missing

- **WHEN** the MCP Adapter plugin is not active and an administrator reads the `mcp` settings
- **THEN** the response says the adapter is not available and still gives the catalog and the stored values

### Requirement: Which abilities the server offers

An ability SHALL be on only when all of these are true: MCP is enabled, the
ability's group is on, the ability's own value is on, and, for a write tool,
read-only mode is off. Read-only mode SHALL NOT turn off read tools,
resources or prompts. Turning a group off or turning read-only mode on SHALL
NOT change the stored value of any ability.

#### Scenario: Group off

- **WHEN** the Orders group is off and `kirki-ecommerce/find-orders` is on
- **THEN** the server does not offer `kirki-ecommerce/find-orders`

#### Scenario: Read-only mode

- **WHEN** read-only mode is on
- **THEN** the server offers no write tool, and it still offers the read tools, resources and prompts that are on

#### Scenario: Stored values come back

- **WHEN** an administrator turns the Coupons group off, then on again
- **THEN** each coupon ability has the same value that it had before the group was turned off

### Requirement: MCP settings page

The settings sidebar SHALL have an "MCP" item in the advanced group that
opens Settings › MCP. The page SHALL have a "Configuration" section title
outside its card. The card header SHALL hold the "Kirki eCommerce MCP" title,
its description and the switch for `enabled`, with the switch on the same
line as the title. The card body SHALL hold these rows, and SHALL be hidden
(the card collapses to its header) while `enabled` is off:

- "Server URL", with the URL in a field on the right of the row title. The
  field SHALL scroll horizontally for a long URL, and its copy button SHALL
  NOT cover the URL. When the adapter is not available, the row SHALL show
  "Not available" and no copy button.
- "Read-only mode", with a switch for `read_only`.
- "Abilities", with the text "N of M on". The whole row SHALL be a link to
  the Abilities sub-page. N SHALL be the number of abilities that are on by
  the rules above, ignoring `enabled`. M SHALL be the number of abilities in
  the catalog.

While `enabled` and `read_only` are both on, the page SHALL show a
"Read-only mode is on" banner below the Configuration card and above the
Connections section.

When the adapter is not available, the page SHALL show a warning that names
the requirements (WordPress 6.9 or later and the MCP Adapter plugin), and
the controls SHALL stay usable. Every switch on the page and the sub-page
SHALL save its change at once, without a save button. When a save fails,
the switch SHALL go back to its last saved value.

#### Scenario: MCP off collapses the card

- **WHEN** an administrator turns off the "Kirki eCommerce MCP" switch
- **THEN** the Configuration card shows only its header, and the server URL, read-only and abilities rows are hidden

#### Scenario: Turn MCP on

- **WHEN** an administrator turns on the "Kirki eCommerce MCP" switch
- **THEN** the setting is saved at once and the server is available on the next request

#### Scenario: Save fails

- **WHEN** an administrator turns on "Read-only mode" and the save request fails
- **THEN** an error toast shows and the switch goes back to off

#### Scenario: Abilities count

- **WHEN** read-only mode is on and every group and ability is on
- **THEN** the Abilities row shows 24 of 42 on, because the 18 write tools are blocked

### Requirement: Connect an AI app

The MCP page SHALL have a "Connections" section title outside a card. The
card SHALL have the title "Connect your AI app", a short text, the
client logos and a "+ Connect app" button. The logos SHALL be icons only,
each with the client name as its native `title` hint. The card SHALL NOT list
connections. The button SHALL open a dialog where the administrator picks a
client: Claude Desktop, Claude Code, Cursor, VS Code, Codex, Gemini CLI,
Windsurf or Other. For the picked client, the dialog SHALL show:

- A config in that client's format that runs
  `npx -y @automattic/mcp-wordpress-remote@latest` with the environment
  values `WP_API_URL` (the server URL), `WP_API_USERNAME` (the signed-in
  user's login) and `WP_API_PASSWORD` set to the placeholder
  `<your application password>`, with a copy button.
- Where the config goes for that client.
- The steps to get `WP_API_PASSWORD`: open the profile page (a link to the
  signed-in user's profile at the Application Passwords section), type a
  name for the app, select "Add New Application Password", copy the
  password that WordPress shows one time, and paste it in place of the
  placeholder.
- A note that the config needs Node.js 18 or later, and that the
  administrator can revoke access from the same profile section.

When WordPress application passwords are not available for the signed-in
user (for example, on a site without HTTPS), the dialog SHALL show a warning
that says so in place of the profile steps.

The dialog SHALL NOT ask for, store or send an application password.

#### Scenario: Claude Desktop config

- **WHEN** an administrator with the login `admin` picks Claude Desktop
- **THEN** the dialog shows a `mcpServers` JSON with a `kirki-ecommerce` entry whose `env` has `WP_API_URL` set to the server URL, `WP_API_USERNAME` set to `admin`, and `WP_API_PASSWORD` set to `<your application password>`

#### Scenario: Claude Code command

- **WHEN** an administrator picks Claude Code
- **THEN** the dialog shows a `claude mcp add` command for the server `kirki-ecommerce` that sets the same 3 environment values and runs the same npx package

#### Scenario: MCP is off

- **WHEN** MCP is off
- **THEN** the Connections card is faded, it has no "+ Connect app" button, and it shows a lock icon with the text "Turn on Kirki eCommerce MCP above to connect an app."

### Requirement: Abilities sub-page

Settings › MCP › Abilities SHALL show the catalog groups in catalog order.
Each group SHALL be one accordion. The accordion header SHALL show the group
name, the group description, the number of abilities in the group with the
number of read and write abilities, and a switch for the group. The
accordion content SHALL be one stacked list with one row for each ability:
its title, a type badge (Tool, Resource or Prompt), and, aligned right before
its switch, its mode (read or write). A resource or prompt SHALL show the
read mode. The description SHALL show in a tooltip whose icon appears only
while the pointer is on the row or the row has focus. The catalog SHALL give
a description for each group.

A row's switch SHALL show off and be disabled when the group is off. A
write tool's switch SHALL show off and be disabled, with a "Blocked by
read-only" badge, when read-only mode is on. The sub-page SHALL show a
warning banner while read-only mode is on, with a "Turn off" action that
turns read-only mode off. The sub-page SHALL have a "Reset to default"
button. After the administrator confirms a dialog, it SHALL turn every group
and every ability on and turn read-only mode off, and it SHALL NOT change
`enabled`.

#### Scenario: Group off disables its rows

- **WHEN** an administrator turns the Customers group off
- **THEN** the find customers and update customer tags rows show off and their switches are disabled

#### Scenario: Read-only blocks write rows

- **WHEN** read-only mode is on and an administrator opens the Coupons group
- **THEN** the find coupons row has an active switch, and the 3 coupon write tools show off, disabled, with the "Blocked by read-only" badge

#### Scenario: Reset to default

- **WHEN** an administrator selects "Reset to default" and confirms
- **THEN** every group and ability is on, read-only mode is off, MCP stays in its current on or off state, and the change is saved at once

#### Scenario: Cancel reset

- **WHEN** an administrator selects "Reset to default" and cancels the dialog
- **THEN** no setting changes
