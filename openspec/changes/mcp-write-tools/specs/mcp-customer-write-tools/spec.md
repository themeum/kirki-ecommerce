## Purpose

Defines the MCP tool that changes the tags and the private note of one
customer. The tool changes no other customer data, such as the name, email
or addresses.

## ADDED Requirements

### Requirement: Update customer tags and note

`kirki-ecommerce-update-customer-tags` SHALL require `customer_id` and at
least one of `add_tags` (a list of tag names), `remove_tags` (a list of tag
names) and `notes` (text up to 2000 characters, or null to remove the note).
A tag name SHALL be 1 to 50 characters after trim, and tags SHALL be compared
without case. The preview SHALL show the current tags, the new tags, and the
current and new note, with the current note in `notes_text`. The customer's
other data and the linked WordPress user SHALL NOT change.

#### Scenario: Mark a VIP

- **WHEN** a confirmed call sends `customer_id` 5 and `add_tags` `["VIP"]` for a customer with the tag `"wholesale"`
- **THEN** customer 5 has the tags `"wholesale"` and `"VIP"`, and the name, email and addresses do not change

#### Scenario: Tag exists in another case

- **WHEN** `add_tags` is `["vip"]` and the customer has the tag `"VIP"`
- **THEN** the preview shows no tag change for `"vip"`

#### Scenario: Nothing to change

- **WHEN** only `customer_id` is sent
- **THEN** the tool returns a tool error that names `add_tags`, `remove_tags` and `notes`

#### Scenario: Unknown customer

- **WHEN** `customer_id` does not match a customer
- **THEN** the tool returns a tool error that tells the client to use the find-customers tool
