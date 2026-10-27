## MODIFIED Requirements

### Requirement: Wizard layout

Every wizard screen SHALL render full-screen without the WordPress admin menu. Each
screen SHALL show, from top to bottom:

- the Kirki eCommerce logo at 20px height;
- a progress bar with a "Step N" label and the current step's name;
- a card holding the step's content and its actions.

The step label SHALL NOT show the total number of steps.

The steps SHALL be named "Store Basics", "Business Info", "Essentials" and "Store
Tax". The "Store Tax" step SHALL exist only when the merchant answered "Yes" to
"Collect sales tax?". The progress bar fill SHALL be the number of steps already
done (the current step number minus one) divided by the number of steps that apply:
4 when the merchant collects tax, 3 when they do not. On step one the bar SHALL be
empty.

The progress bar SHALL become full only on the completion screen, which opens when
the merchant clicks "Create Store".

The completion screen SHALL show a full progress bar labelled "Setup Complete" and
SHALL NOT show a step number.

#### Scenario: Step one header

- **WHEN** the merchant opens the wizard with "Collect sales tax?" not answered "Yes"
- **THEN** the logo, an empty progress bar, "Step 1", and "Store Basics" are shown above the card

#### Scenario: Header when collecting tax

- **WHEN** the merchant has answered "Yes" to "Collect sales tax?" and is on step two
- **THEN** the label reads "Step 2" and the progress bar is one quarter full

#### Scenario: Store Tax header

- **WHEN** the merchant is on the Store Tax step
- **THEN** the label reads "Step 4", the step name reads "Store Tax", and the progress bar is three quarters full

#### Scenario: Last step without tax

- **WHEN** the merchant has not answered "Yes" to "Collect sales tax?" and is on step three
- **THEN** the label reads "Step 3" and the progress bar is two thirds full

#### Scenario: Completion header

- **WHEN** the merchant reaches the completion screen
- **THEN** the progress bar is full, it is labelled "Setup Complete", and no step number is shown

### Requirement: Essentials step

The third step SHALL collect a currency, which SHALL be required. The currency SHALL
be chosen from a searchable list in which each currency shows its flag, code, name and
symbol. On first entry, the currency SHALL be preselected from the selected country's
currency when that currency is in the list. Otherwise it SHALL be left empty.

The step SHALL ask "Collect sales tax?" with the choices "Yes" and "No, not yet",
defaulting to "No, not yet". The step SHALL NOT show the price mode or the Tax ID
field; those belong to the Store Tax step.

The step SHALL offer Back and a primary action. Back SHALL be an icon button with a
left chevron beside the step title. The primary action SHALL fill the full width of
the card. Its label SHALL be:

- "Continue" when "Yes" is selected; it moves to the Store Tax step;
- "Create Store" when "No, not yet" is selected; it starts store setup.

The step SHALL state that the Shop, Cart, Checkout and Account pages will be created
only while its primary action is "Create Store".

#### Scenario: Currency follows the country

- **WHEN** the merchant selected Japan in step two and reaches step three for the first time
- **THEN** the Japanese Yen is preselected

#### Scenario: Country's currency is unknown

- **WHEN** the selected country's currency is not in the currency list
- **THEN** no currency is preselected and the primary action is not allowed until one is chosen

#### Scenario: Country changed after currency was chosen

- **WHEN** the merchant has already been through step three and goes back to change the country
- **THEN** the currency they had chosen is kept

#### Scenario: Default tax answer

- **WHEN** the merchant reaches step three
- **THEN** "No, not yet" is selected, the primary action reads "Create Store", and the pages note is shown

#### Scenario: Turning tax on

- **WHEN** the merchant selects "Yes"
- **THEN** the primary action reads "Continue", the pages note is hidden, and no pricing or Tax ID field is shown on this step

#### Scenario: Continue to Store Tax

- **WHEN** the merchant has selected "Yes" and a currency, and clicks "Continue"
- **THEN** the wizard moves to the Store Tax step and store setup is not started

#### Scenario: Currency without a matching region flag

- **WHEN** a currency's code does not correspond to a flag
- **THEN** the currency is listed without a flag

### Requirement: Wizard draft survives a refresh

The wizard's entered values and current step SHALL persist across a browser refresh
within the same browser tab session. The draft SHALL be cleared when store setup
succeeds. Moving Back SHALL keep every value the merchant entered.

When a restored draft points to the Store Tax step but its tax answer is not "Yes",
the wizard SHALL reopen on the Essentials step.

#### Scenario: Refresh mid-wizard

- **WHEN** the merchant is on step three with values entered in steps one to three and refreshes the page
- **THEN** the wizard reopens on step three with the same values

#### Scenario: Refresh on Store Tax

- **WHEN** the merchant is on the Store Tax step with a Tax ID entered and refreshes the page
- **THEN** the wizard reopens on the Store Tax step with the same Tax ID and price mode

#### Scenario: New browser session

- **WHEN** the merchant closes the tab and opens the wizard in a new tab later
- **THEN** the wizard starts from step one with empty fields

#### Scenario: Back keeps values

- **WHEN** the merchant goes from step three back to step one
- **THEN** the store name and industry they entered are still filled in

#### Scenario: Back from Store Tax keeps tax values

- **WHEN** the merchant enters a Tax ID on the Store Tax step, goes Back to Essentials, and clicks Continue again
- **THEN** the Tax ID and price mode they entered are still filled in

### Requirement: Store creation and completion screen

Clicking "Create Store" SHALL move to the completion screen and start store setup.
Store setup SHALL be submitted once per click, as one request.

The completion screen SHALL be titled "Your store is almost ready" in every state. The
subtitle SHALL be "Here's what we set up for you". It SHALL list these rows, in this
order:

- Location, with the country name only;
- Currency, as code and symbol, e.g. "USD ($)";
- Store pages: Shop, Cart, Checkout, Account;
- Tax, as "Added at checkout" or "Included in price" — only when "Yes" was chosen.

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
- **THEN** the Location, Currency, and Store pages rows show as completed and no Tax row is shown

#### Scenario: Successful setup with tax

- **WHEN** the merchant clicks Create Store on the Store Tax step with "Including tax" selected and setup succeeds
- **THEN** a Tax row reading "Included in price" is shown alongside the other rows

#### Scenario: Setup fails

- **WHEN** store setup returns an error while the third row is in progress
- **THEN** the first two rows stay completed, the remaining rows stop showing progress, the error is shown, and a retry action is offered

#### Scenario: Retry after failure

- **WHEN** the merchant clicks retry after a failure
- **THEN** store setup is submitted again with the same values and the rows restart from the first row

### Requirement: Completion actions

The completion screen SHALL offer two buttons side by side inside the card:
"Add your first product" (primary) and "Go to Dashboard" (secondary). Both SHALL be
disabled until every summary row is completed.

- "Add your first product" SHALL navigate to the create-product page.
- "Go to Dashboard" SHALL navigate to the plugin's home route.
- Neither navigation SHALL leave the wizard in the browser's back history.

When setup fails, the retry action SHALL replace both buttons.

Below the card, outside it, the screen SHALL show a link "Click here to load sample
data!". The link SHALL be shown in every completion state, and SHALL be disabled until
every summary row is completed. Clicking it SHALL load the sample data in two visible
phases, each shown with a spinner and text in place of the link:

1. "Downloading product sample..."
2. "Creating products..." while the sample data request runs.

No progress bar SHALL be shown. While the import runs, the link SHALL ignore clicks,
and "Add your first product" and "Go to Dashboard" SHALL stay usable.

- When the import succeeds, the merchant SHALL be taken to the products list page,
  and the wizard SHALL NOT stay in the browser's back history.
- When the import fails, the merchant SHALL see an error, and the link SHALL show
  again and be usable.

#### Scenario: Add your first product

- **WHEN** the merchant clicks "Add your first product"
- **THEN** they are taken to the create-product page, and the browser's Back does not return to the wizard

#### Scenario: Go to Dashboard

- **WHEN** the merchant clicks "Go to Dashboard"
- **THEN** they are taken to the plugin's home route

#### Scenario: Actions disabled during setup

- **WHEN** any summary row is not yet completed
- **THEN** "Add your first product", "Go to Dashboard", and the sample data link cannot be used

#### Scenario: Load sample data

- **WHEN** the merchant clicks "Click here to load sample data!" and loading succeeds
- **THEN** a spinner with "Downloading product sample..." shows, then "Creating products...", and then the merchant is taken to the products list page, where the sample products are listed

#### Scenario: Leaving during the import

- **WHEN** the sample data import is running
- **THEN** "Add your first product" and "Go to Dashboard" can still be clicked

#### Scenario: Sample data fails

- **WHEN** the sample data request returns an error
- **THEN** an error is shown, the merchant stays on the completion screen, and the link "Click here to load sample data!" is usable again

## ADDED Requirements

### Requirement: Store Tax step

When the merchant answers "Yes" to "Collect sales tax?", the wizard SHALL show a
fourth step named "Store Tax", titled "Tax Info". It SHALL collect:

- "Prices on your products", a radio choice of "Including tax" and "Excluding Tax",
  defaulting to "Excluding Tax";
- an optional "Tax ID" field with the placeholder "Permit or VAT number" and a note
  that the Tax ID prints on invoices.

The step SHALL state that the Shop, Cart, Checkout and Account pages will be created.
The step SHALL offer Back and "Create Store" actions. Back SHALL be an icon button
with a left chevron beside the step title, and SHALL return to the Essentials step.
"Create Store" SHALL fill the full width of the card and start store setup.

The merchant's price mode and Tax ID SHALL be sent to store setup only when they
answered "Yes".

#### Scenario: Default price mode

- **WHEN** the merchant reaches the Store Tax step for the first time
- **THEN** "Excluding Tax" is selected and the Tax ID field is empty

#### Scenario: Create store with tax included

- **WHEN** the merchant selects "Including tax", enters a Tax ID, and clicks "Create Store"
- **THEN** store setup is started with tax collected, prices including tax, and that Tax ID

#### Scenario: Create store without a Tax ID

- **WHEN** the merchant leaves the Tax ID empty and clicks "Create Store"
- **THEN** store setup is started with no Tax ID

#### Scenario: Back to Essentials

- **WHEN** the merchant clicks the Back icon button on the Store Tax step
- **THEN** the wizard returns to the Essentials step with "Yes" still selected

#### Scenario: Tax turned off after visiting Store Tax

- **WHEN** the merchant entered a Tax ID on Store Tax, goes Back, selects "No, not yet", and clicks "Create Store"
- **THEN** store setup is started with tax not collected and no Tax ID
