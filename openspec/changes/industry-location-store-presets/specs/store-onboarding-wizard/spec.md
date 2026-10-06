## MODIFIED Requirements

### Requirement: Store creation and completion screen

Clicking "Create Store" SHALL move to the completion screen and start store setup.
While setup is running, each summary row SHALL show an in-progress state. The
in-progress state SHALL last at least 5 seconds, or as long as setup actually takes
when that is longer. When setup succeeds, each row SHALL show a completed state. The completion screen SHALL be titled
"Your store is almost ready" with the subtitle "Here's what we set up for you". It
SHALL list these rows:

- Location, with the country name only;
- Currency, as code and symbol, e.g. "USD ($)";
- Store pages: Shop, Cart, Checkout, Account;
- Tax, as "Added at checkout" or "Included in price" — only when "Yes" was chosen;
- Configurations, as "Essentials, Shipping, Tax, Legal pages" — "Tax" only when
  "Yes" was chosen.

Store setup applies the presets in the same request, so the Configurations row
SHALL follow the same in-progress and completed states as the other rows. The
wizard SHALL NOT send a separate presets request.

If setup fails, the screen SHALL show the failure and offer a retry that resubmits the
same values. Repeated clicks on "Create Store" SHALL NOT submit setup more than once.

#### Scenario: Successful setup without tax

- **WHEN** the merchant clicks Create Store with "No, not yet" selected and setup succeeds
- **THEN** the Location, Currency, Store pages and Configurations rows show as completed, no Tax row is shown, and the Configurations row reads "Essentials, Shipping, Legal pages"

#### Scenario: Successful setup with tax

- **WHEN** the merchant clicks Create Store with "Yes" and "Tax included in price" selected and setup succeeds
- **THEN** a Tax row reading "Included in price" is shown alongside the other rows, and the Configurations row reads "Essentials, Shipping, Tax, Legal pages"

#### Scenario: Configurations row while setup runs

- **WHEN** store setup is still running
- **THEN** the Configurations row shows the in-progress state together with the other rows, and only one setup request is sent

#### Scenario: Setup finishes quickly

- **WHEN** store setup succeeds in under 5 seconds
- **THEN** the rows keep showing progress until 5 seconds have passed since Create Store was clicked, then show as completed

#### Scenario: Setup takes longer than the minimum

- **WHEN** store setup takes longer than 5 seconds
- **THEN** the rows show progress until setup finishes

#### Scenario: Setup fails

- **WHEN** store setup returns an error
- **THEN** the rows stop showing progress, the error is shown without waiting out the 5-second minimum, and a retry action is offered

#### Scenario: Retry after failure

- **WHEN** the merchant clicks retry after a failure
- **THEN** store setup is submitted again with the same values
