## Purpose

The merchant-facing onboarding wizard. Over three short steps it collects store name,
industry, location, currency and tax stance. It then shows what was set up and offers
to load sample data.

## ADDED Requirements

### Requirement: Wizard layout

Every wizard screen SHALL render full-screen without the WordPress admin menu. Each
screen SHALL show, from top to bottom:

- the Kirki eCommerce logo at 20px height;
- a progress bar with a "Step N of 3" label and the current step's name;
- a card holding the step's content and its actions.

The steps SHALL be named "Store Basics", "Business Info" and "Essentials". The
completion screen SHALL show a full progress bar labelled "Setup complete".

#### Scenario: Step one header

- **WHEN** the merchant opens the wizard
- **THEN** the logo, a progress bar one third full, "Step 1 of 3", and "Store Basics" are shown above the card

#### Scenario: Completion header

- **WHEN** the merchant reaches the completion screen
- **THEN** the progress bar is full and labelled "Setup complete"

### Requirement: Store basics step

The first step SHALL collect a store name and an industry. The store name SHALL be
required. The industry SHALL be chosen from a searchable list:

- Clothing and accessories
- Food and drink
- Electronics and computers
- Health and beauty
- Education and learning
- Home, furniture and garden
- Arts and crafts
- Sports and recreation
- Other

When no industry is chosen, "Other" SHALL be used. The step SHALL offer only a
Continue action.

#### Scenario: Missing store name

- **WHEN** the merchant clicks Continue with an empty or whitespace-only store name
- **THEN** the step does not advance and the store name field shows a required error

#### Scenario: Industry left empty

- **WHEN** the merchant enters a store name, chooses no industry, and clicks Continue
- **THEN** the wizard advances to step two with "Other" as the industry

#### Scenario: Searching industries

- **WHEN** the merchant types "food" into the industry search
- **THEN** the list narrows to "Food and drink"

### Requirement: Business info step

The second step SHALL collect the store's country, which SHALL be required. On first
entry, the country SHALL be preselected from the browser's time zone. When the time
zone gives no country, it SHALL fall back to the region of the browser's preferred
language. When neither gives a known country, the field SHALL be left empty.

Country detection SHALL NOT request geolocation permission or send any request off
the site.

An "Add address" action SHALL reveal optional fields for address line 1, address
line 2, city, postcode and state/province. The address SHALL NOT have its own country
field, because it uses the selected country. Every revealed address field SHALL be
optional. The step SHALL offer Back and Continue actions. Back SHALL be an icon
button with a left chevron beside the step title. Continue SHALL fill the full width
of the card.

#### Scenario: Back beside the title

- **WHEN** the merchant is on step two or step three
- **THEN** a Back icon button shows beside the step title, and the footer shows only the full-width primary action

#### Scenario: Back from step two

- **WHEN** the merchant clicks the Back icon button on step two
- **THEN** the wizard returns to step one

#### Scenario: Country detected from time zone

- **WHEN** the browser's time zone is "Asia/Dhaka" and the merchant reaches step two for the first time
- **THEN** Bangladesh is preselected

#### Scenario: Time zone is not specific

- **WHEN** the browser's time zone is "UTC" and its preferred language is "en-GB"
- **THEN** United Kingdom is preselected

#### Scenario: Nothing detectable

- **WHEN** neither the time zone nor the preferred language identifies a known country
- **THEN** the country field is empty and Continue is not allowed until a country is chosen

#### Scenario: Merchant overrides the detected country

- **WHEN** the merchant changes the preselected country, goes Back, and returns to step two
- **THEN** their chosen country is kept rather than re-detected

#### Scenario: Address revealed but left blank

- **WHEN** the merchant reveals the address fields, leaves them all empty, and clicks Continue
- **THEN** the wizard advances to step three

#### Scenario: State list follows the country

- **WHEN** the merchant has selected a country that has states and reveals the address fields
- **THEN** the state field offers that country's states

### Requirement: Essentials step

The third step SHALL collect a currency, which SHALL be required. The currency SHALL
be chosen from a searchable list in which each currency shows its flag, code, name and
symbol. On first entry, the currency SHALL be preselected from the selected country's
currency when that currency is in the list. Otherwise it SHALL be left empty.

The step SHALL ask "Collect sales tax?" with the choices "Yes" and "No, not yet",
defaulting to "No, not yet". When "Yes" is chosen, the step SHALL also show:

- "Prices on your storefront", with the choices "Tax added at checkout" (the default)
  and "Tax included in price";
- an optional "Tax ID" field, with a note that the Tax ID prints on invoices.

The step SHALL state that the Shop, Cart, Checkout and Account pages will be created.
The step SHALL offer Back and "Create Store" actions. Back SHALL be an icon button
with a left chevron beside the step title. "Create Store" SHALL fill the full width
of the card.

#### Scenario: Currency follows the country

- **WHEN** the merchant selected Japan in step two and reaches step three for the first time
- **THEN** the Japanese Yen is preselected

#### Scenario: Country's currency is unknown

- **WHEN** the selected country's currency is not in the currency list
- **THEN** no currency is preselected and Create Store is not allowed until one is chosen

#### Scenario: Country changed after currency was chosen

- **WHEN** the merchant has already been through step three and goes back to change the country
- **THEN** the currency they had chosen is kept

#### Scenario: Default tax answer

- **WHEN** the merchant reaches step three
- **THEN** "No, not yet" is selected and the pricing and Tax ID fields are hidden

#### Scenario: Turning tax on

- **WHEN** the merchant selects "Yes"
- **THEN** "Tax added at checkout" is selected and an empty Tax ID field is shown

#### Scenario: Currency without a matching region flag

- **WHEN** a currency's code does not correspond to a flag
- **THEN** the currency is listed without a flag

### Requirement: Wizard draft survives a refresh

The wizard's entered values and current step SHALL persist across a browser refresh
within the same browser tab session. The draft SHALL be cleared when store setup
succeeds. Moving Back SHALL keep every value the merchant entered.

#### Scenario: Refresh mid-wizard

- **WHEN** the merchant is on step three with values entered in steps one to three and refreshes the page
- **THEN** the wizard reopens on step three with the same values

#### Scenario: New browser session

- **WHEN** the merchant closes the tab and opens the wizard in a new tab later
- **THEN** the wizard starts from step one with empty fields

#### Scenario: Back keeps values

- **WHEN** the merchant goes from step three back to step one
- **THEN** the store name and industry they entered are still filled in

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
- Tax, as "Added at checkout" or "Included in price" — only when "Yes" was chosen.

If setup fails, the screen SHALL show the failure and offer a retry that resubmits the
same values. Repeated clicks on "Create Store" SHALL NOT submit setup more than once.

#### Scenario: Successful setup without tax

- **WHEN** the merchant clicks Create Store with "No, not yet" selected and setup succeeds
- **THEN** the Location, Currency, and Store pages rows show as completed and no Tax row is shown

#### Scenario: Successful setup with tax

- **WHEN** the merchant clicks Create Store with "Yes" and "Tax included in price" selected and setup succeeds
- **THEN** a Tax row reading "Included in price" is shown alongside the other rows

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

### Requirement: Completion actions

After setup succeeds, the completion screen SHALL offer "Go to dashboard" and "Load
sample data", with the note "Explore with demo products, orders & settings." under
the latter.

- "Go to dashboard" SHALL navigate to the plugin's home route.
- "Load sample data" SHALL request sample data loading, show a loading state while
  it runs, and navigate to the plugin's home route when it finishes.
- If sample data loading fails, the merchant SHALL see an error and stay on the
  completion screen.

#### Scenario: Go to dashboard

- **WHEN** the merchant clicks "Go to dashboard"
- **THEN** they are taken to the plugin's home route

#### Scenario: Load sample data

- **WHEN** the merchant clicks "Load sample data" and loading succeeds
- **THEN** a loading state is shown until it finishes and the merchant is then taken to the plugin's home route

#### Scenario: Actions disabled during setup

- **WHEN** store setup is still running
- **THEN** neither completion action can be used
