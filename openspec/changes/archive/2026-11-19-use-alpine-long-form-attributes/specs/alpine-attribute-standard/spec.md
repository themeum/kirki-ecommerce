# Spec Delta

## Purpose

Defines one way to write Alpine.js attributes in storefront markup, so every view works wherever it is printed, including block theme headers and footers that pass through HTML filtering, and so developers follow one style.

## ADDED Requirements

### Requirement: Storefront markup uses long-form Alpine attributes

Markup printed by `resources/views/**` and by PHP classes under `app/**` SHALL write Alpine event and binding directives in the long form (`x-on:<event>` and `x-bind:<attribute>`, with any modifiers kept). It SHALL NOT use the `@<event>` or `:<attribute>` shorthand.

#### Scenario: A view binds a class

- **WHEN** a view toggles a CSS class from Alpine state
- **THEN** it uses `x-bind:class`, not `:class`

#### Scenario: A view listens to an event with modifiers

- **WHEN** a view reacts to a click outside an element or to a document-level event
- **THEN** it uses `x-on:click.outside` or `x-on:<event>.document`, not `@click.outside` or `@<event>.document`

#### Scenario: Rendered behaviour is unchanged

- **WHEN** a view is converted from shorthand to long form
- **THEN** the page behaves exactly as before, because Alpine treats both forms as the same directive

### Requirement: Alpine markup survives header and footer filtering

Alpine attributes used by a view that can print inside a block theme header or footer SHALL reach the browser intact on every page, including pages the plugin renders itself.

#### Scenario: Currency switcher in a header on a plugin page

- **WHEN** a store owner puts the currency switcher shortcode in the block theme header and a visitor opens the shop, cart, checkout or account page
- **THEN** the switcher opens, lists the currencies and changes the currency

#### Scenario: Mini cart in a header on a plugin page

- **WHEN** a store owner puts the mini cart shortcode in the header and a visitor adds a product to the cart
- **THEN** the item count in the header updates

#### Scenario: Unsafe markup is still removed

- **WHEN** header markup contains an inline event handler such as `onclick` or a `<script>` tag
- **THEN** the handler and the tag are removed from the printed header

### Requirement: The convention is documented

The long-form rule SHALL be written in the PHP coding standards and in the release package notes, and the Alpine usage examples in the storefront component source comments SHALL use the long form.

#### Scenario: A developer reads the standards

- **WHEN** a developer reads the PHP standards before writing a view
- **THEN** they find the rule and the reason (HTML filtering drops attribute names that start with `@` or `:`)

#### Scenario: A developer copies a component example

- **WHEN** a developer copies the usage example from a storefront component's source comment
- **THEN** the example already uses the long form

### Requirement: The convention is enforced by an automated check

An automated test SHALL fail when markup under `resources/views/**` or `app/**` contains an Alpine shorthand attribute, and its failure message SHALL name the file and line.

#### Scenario: A shorthand attribute is added

- **WHEN** a developer adds `@click="open()"` to a view and runs the test suite
- **THEN** the check fails and names the view file and the line

#### Scenario: The codebase is compliant

- **WHEN** every view uses the long form
- **THEN** the check passes
