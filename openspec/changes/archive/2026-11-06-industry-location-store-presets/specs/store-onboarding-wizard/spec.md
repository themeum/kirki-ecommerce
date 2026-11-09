## MODIFIED Requirements

### Requirement: Store creation and completion screen

Clicking "Create Store" SHALL move to the completion screen and start store setup.
Store setup SHALL be submitted once per click, as one request. Store setup applies
the presets in the same request, so the wizard SHALL NOT send a separate presets
request.

The completion screen SHALL be titled "Your store is almost ready" in every state. The
subtitle SHALL be "Here's what we set up for you". It SHALL list these rows, in this
order:

- Location, with the country name only;
- Currency, as code and symbol, e.g. "USD ($)";
- Store pages: Shop, Cart, Checkout, Account;
- Tax, as "Added at checkout" or "Included in price" — only when "Yes" was chosen;
- Configurations, as "Essentials, Shipping, Tax, Legal pages" — "Tax" only when
  "Yes" was chosen.

Each row SHALL show one of three states: waiting, in progress, or completed. The rows
SHALL complete one at a time, in order:

- When the screen opens, the first row SHALL be in progress and the others waiting.
- Each row except the last SHALL complete about 400 ms after it went in progress, and
  the next row SHALL then go in progress.
- The last row SHALL complete only when that delay has passed and store setup has
  succeeded.

If setup fails, every row not yet completed SHALL stop showing progress. The screen
SHALL show the failure and offer a retry that resubmits the same values. A retry SHALL
restart the row sequence from the first row. Repeated clicks on "Create Store" SHALL
NOT submit setup more than once.

#### Scenario: Rows complete in order

- **WHEN** the merchant clicks Create Store and setup succeeds after 2 seconds
- **THEN** Location completes first, then Currency, then the following rows in order, and the last row completes when setup succeeds

#### Scenario: Setup finishes before the rows

- **WHEN** store setup succeeds before the rows have finished their sequence
- **THEN** the rows keep completing one at a time and the last row completes after its own delay

#### Scenario: Title stays the same

- **WHEN** the last row completes
- **THEN** the title still reads "Your store is almost ready"

#### Scenario: Successful setup without tax

- **WHEN** the merchant clicks Create Store with "No, not yet" selected and setup succeeds
- **THEN** the Location, Currency, Store pages and Configurations rows show as completed, no Tax row is shown, and the Configurations row reads "Essentials, Shipping, Legal pages"

#### Scenario: Successful setup with tax

- **WHEN** the merchant clicks Create Store on the Store Tax step with "Including tax" selected and setup succeeds
- **THEN** a Tax row reading "Included in price" is shown alongside the other rows, and the Configurations row reads "Essentials, Shipping, Tax, Legal pages"

#### Scenario: Configurations row while setup runs

- **WHEN** store setup is still running after the rows before it have completed
- **THEN** the Configurations row stays in progress until setup succeeds, and only one setup request is sent

#### Scenario: Setup fails

- **WHEN** store setup returns an error while the third row is in progress
- **THEN** the first two rows stay completed, the remaining rows stop showing progress, the error is shown, and a retry action is offered

#### Scenario: Retry after failure

- **WHEN** the merchant clicks retry after a failure
- **THEN** store setup is submitted again with the same values and the rows restart from the first row
