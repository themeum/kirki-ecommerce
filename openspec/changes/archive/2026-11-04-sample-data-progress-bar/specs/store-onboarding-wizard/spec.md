## MODIFIED Requirements

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
every summary row is completed. Clicking it SHALL send the sample data request at
once, and SHALL show, in place of the link, a progress bar 80 px wide, centered, with
the text "Downloading sample data..." below it. No spinner SHALL be shown. The text
SHALL NOT change while the request runs, and the bar SHALL cover the whole import,
the download and the record creation.

The server reports no progress, so the bar SHALL move by time:

- The bar SHALL move from 0% to 95% in 10 seconds, fast at the start and slower near
  95%.
- After 10 seconds, the bar SHALL move slowly from 95% toward 99%, and SHALL NOT
  reach 100% before the request succeeds.

The bar SHALL never move backward while the request runs. When the request succeeds,
the bar SHALL go to 100%, also when this is before 10 seconds.

From the click until the request succeeds or fails, "Add your first product" and
"Go to Dashboard" SHALL be disabled, and the progress bar SHALL ignore clicks.

- When the import succeeds, the bar SHALL show 100%, both buttons SHALL be usable
  again, and after a short pause the merchant SHALL be taken to the products list
  page. The wizard SHALL NOT stay in the browser's back history.
- When the import fails, the merchant SHALL see an error, the bar SHALL go away, the
  link SHALL show again and be usable, and both buttons SHALL be usable again.

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
- **THEN** the sample data request is sent at once, a progress bar with "Downloading sample data..." shows in place of the link, and the merchant is then taken to the products list page, where the sample products are listed

#### Scenario: Bar fills 95% in 10 seconds

- **WHEN** the sample data request is still running 10 seconds after the click
- **THEN** the bar shows 95%, and the text is still "Downloading sample data..."

#### Scenario: Slow request does not complete the bar

- **WHEN** the sample data request is still running more than 10 seconds after the click
- **THEN** the bar moves toward 99% but stays below 100%, and the text is still "Downloading sample data..."

#### Scenario: Fast request completes the bar

- **WHEN** the sample data request succeeds 4 seconds after the click
- **THEN** the bar goes to 100% at once, and the merchant is then taken to the products list page

#### Scenario: Buttons disabled during the import

- **WHEN** the sample data import is running
- **THEN** "Add your first product" and "Go to Dashboard" cannot be clicked

#### Scenario: Buttons usable after the import

- **WHEN** the sample data request succeeds and the bar shows 100%
- **THEN** "Add your first product" and "Go to Dashboard" can be clicked again before the products list page opens

#### Scenario: Sample data fails

- **WHEN** the sample data request returns an error
- **THEN** an error is shown, the merchant stays on the completion screen, the progress bar goes away, the link "Click here to load sample data!" is usable again, and "Add your first product" and "Go to Dashboard" can be clicked
