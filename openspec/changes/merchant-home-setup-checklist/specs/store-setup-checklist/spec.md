## Purpose

Guides a newly onboarded merchant through the setup tasks a store needs before it
can sell. It tracks each task's completion durably and shows progress on the
Home page.

## ADDED Requirements

### Requirement: Checklist steps and their order

The checklist SHALL consist of the following steps, in this order. Each step has
an identifier, a title, a time estimate, a description and call-to-action
buttons.

| # | Id | Title | Time | Description |
|---|----|-------|------|-------------|
| 1 | `products` | List your products | 3 min | Start selling by adding products or services to your store. |
| 2 | `payments` | Set up payments | 2 min | Choose how customers pay you, such as cards, wallets, or cash on delivery. |
| 3 | `tax` | Collect sales tax | 1 min | Set your tax rates so customers are charged the right amount at checkout. |
| 4 | `shipping` | Add shipping method | 3 min | Decide where you ship and what it costs. Offer flat rate, free shipping, or local pickup. |

#### Scenario: All steps visible

- **WHEN** tax calculation is enabled in general settings
- **THEN** the checklist lists List your products, Set up payments, Collect sales tax and Add shipping method, in that order

### Requirement: Sales tax step visibility

The `tax` step SHALL be shown only while tax calculation is enabled in general
settings. While it is hidden, it SHALL NOT count toward the total or the
completed count. Its stored completion SHALL be kept, so it reappears in the same
state if tax calculation is enabled again.

#### Scenario: Tax collection off

- **WHEN** tax calculation is disabled in general settings
- **THEN** the `tax` step is not shown and the header reads "X out of 3 complete"

#### Scenario: Tax re-enabled after completion

- **WHEN** the `tax` step was completed, tax calculation was later disabled, and is now enabled again
- **THEN** the `tax` step is shown as completed

### Requirement: Steps are numbered by position

Each visible step SHALL be numbered by its position among the visible steps,
starting at 1, so the numbering has no gaps when a step is hidden.

#### Scenario: Numbering without the tax step

- **WHEN** the `tax` step is hidden
- **THEN** Add shipping method is numbered 3

### Requirement: Progress header

The checklist SHALL show "X out of N complete" and a percentage with a matching
progress bar. N is the number of visible steps, X is the number of visible
completed steps, and the percentage is X / N × 100 rounded to the nearest whole
number.

#### Scenario: Fresh store

- **WHEN** no visible step is completed
- **THEN** the header reads "0 out of N complete" with "0%" and an empty bar

#### Scenario: Partial progress

- **WHEN** 2 of 4 visible steps are completed
- **THEN** the header reads "2 out of 4 complete" with "50%" and the bar is 50% filled

### Requirement: Step completion rules

A step SHALL be considered met by store data as follows:

- `products`: at least one product exists.
- `payments`: at least one payment method, online or offline, is enabled and set
  up. A method is set up when every admin settings field that the method marks
  as required has a non-empty value. A method with no required fields (for
  example Cash on Delivery or Direct bank transfer) is set up when it is enabled.
- `tax`: at least one enabled tax region has a product tax rate above 0, and the
  step is not preconfigured. A general region has a rate when its central
  product tax is above 0 while central tax is on, or, while central tax is off,
  when at least one of its states has a product tax rate above 0. An EU region
  has a rate when at least one member country has a rate above 0.
- `shipping`: at least one enabled shipping zone contains at least one enabled
  shipping method, and the step is not preconfigured. Shipping carriers do not
  count as shipping methods.

A preconfigured `tax` or `shipping` step SHALL complete only when the merchant
clicks its "Update …" button.

#### Scenario: First product added

- **WHEN** the store has no products, the merchant creates one, then opens Home
- **THEN** List your products is shown as completed

#### Scenario: Only disabled payment methods exist

- **WHEN** every payment method in the store is disabled
- **THEN** Set up payments is not completed

#### Scenario: A payment method is enabled

- **WHEN** the merchant enables Cash on Delivery and opens Home
- **THEN** Set up payments is shown as completed

#### Scenario: Gateway enabled without its credentials

- **WHEN** PayPal is enabled, its client secret is empty, and no other payment method is enabled
- **THEN** Set up payments is not completed

#### Scenario: Merchant adds a tax region with a rate

- **WHEN** the `tax` step is not preconfigured, the merchant saves an enabled tax region with a product tax rate above 0, then opens Home
- **THEN** Collect sales tax is shown as completed

#### Scenario: Tax region without a rate

- **WHEN** the only enabled tax region has no product tax rate above 0
- **THEN** Collect sales tax is not completed

#### Scenario: Disabled shipping zone only

- **WHEN** the only shipping zone is disabled
- **THEN** Add shipping method is not completed

#### Scenario: Shipping zone without an enabled method

- **WHEN** the only enabled shipping zone has no shipping method, or only disabled ones
- **THEN** Add shipping method is not completed

#### Scenario: Preconfigured tax data is not auto-completed

- **WHEN** the `tax` step is preconfigured and an enabled tax region with a product tax rate above 0 exists
- **THEN** Collect sales tax is not completed until the merchant clicks "Update tax rate"

### Requirement: Completion is sticky and persisted

Once a step is completed, the completion SHALL be recorded in the WordPress
options table and SHALL NOT revert, even if the data that satisfied it is later
removed. Each time the checklist state is read, the server SHALL check the
completion rules for steps not yet completed and record any that are now met.

#### Scenario: Product deleted after completion

- **WHEN** List your products was completed and the merchant deletes every product
- **THEN** List your products is still shown as completed

#### Scenario: Completion survives reload

- **WHEN** a step was completed and the merchant reloads Home
- **THEN** the step is still completed without re-checking its data

### Requirement: Preconfigured steps are recorded at store setup

At the end of store setup, after any industry and location presets are applied,
the system SHALL record which of the `tax` and `shipping` steps already have
qualifying data, using the data rules of the "Step completion rules" requirement. Those
steps are preconfigured. Stores that completed onboarding before this record
existed SHALL be treated as having no preconfigured steps.

#### Scenario: Presets seed a shipping zone

- **WHEN** store setup ends with an enabled shipping zone that has an enabled shipping method
- **THEN** the `shipping` step is recorded as preconfigured

#### Scenario: Nothing seeded

- **WHEN** store setup ends with no tax regions and no shipping zones
- **THEN** neither step is preconfigured

### Requirement: Step call-to-action buttons

Each step SHALL offer the buttons below. A button labelled "Update …" SHALL
replace its "Add …" counterpart whenever the step's data rule from "Step
completion rules" is currently met.

| Step | Primary | Secondary | Destination |
|------|---------|-----------|-------------|
| `products` | Add products | Load sample data (only while no product exists) | Create product page / none (runs the import in place) |
| `payments` | Add payment / Update payment | Cash on delivery | Payment settings (both) |
| `tax` | Add tax rate / Update tax rate | — | Tax settings |
| `shipping` | Add shipping / Update shipping rate | — | Shipping settings |

#### Scenario: Adding products

- **WHEN** the merchant clicks "Add products"
- **THEN** the create product page opens

#### Scenario: Cash on delivery shortcut

- **WHEN** the merchant clicks "Cash on delivery" in Set up payments
- **THEN** the Payment settings page opens and nothing is enabled automatically

### Requirement: Load sample data from the checklist

The `products` step SHALL offer a "Load sample data" button with a shirt icon,
next to "Add products", while the store has no products. A click SHALL run two
phases and SHALL show their progress inside that button: the button's content
SHALL change to the phase message, with a progress bar along the button's bottom
edge. The button SHALL have no close control.

1. **Downloading.** The card reads "Downloading product sample...". This phase is
   simulated: the bar fills from 0% to 70% in about 2.5 seconds, and no request
   is sent.
2. **Creating.** The card reads "Creating products...". The system SHALL call the
   existing sample-data import endpoint. The bar SHALL advance slowly from 70%
   but SHALL stay below 100% while the request runs.

While the import runs, "Add products" SHALL be disabled and "Load sample data"
SHALL ignore clicks. The merchant can still expand other steps.

When the import succeeds:

- the checklist SHALL be refreshed, so the `products` step shows as completed;
- the "Load sample data" button SHALL be removed;
- no success toast SHALL be shown;
- after a pause of about 1 second, the `products` step SHALL collapse and the
  first visible incomplete step SHALL expand.

When the import fails, the system SHALL show the standard error toast, and the
"Load sample data" button SHALL show its label again. Both buttons SHALL work
again.

#### Scenario: Loading sample data on an empty store

- **WHEN** the store has no products and the merchant clicks "Load sample data"
- **THEN** the button reads "Downloading product sample...", then "Creating products...", and the import runs
- **AND** the button is removed, List your products is completed, it collapses, and Set up payments expands

#### Scenario: Buttons locked during the import

- **WHEN** the import is running
- **THEN** "Add products" is disabled and "Load sample data" ignores clicks

#### Scenario: Import fails

- **WHEN** the import request fails
- **THEN** an error toast is shown, the button reads "Load sample data" again, and both buttons work

#### Scenario: Store already has products

- **WHEN** the merchant opens Home and the store has at least one product
- **THEN** the `products` step shows "Add products" only

### Requirement: Clicking Update completes a preconfigured step

Clicking "Update tax rate" or "Update shipping rate" on a step that is not yet
completed SHALL record that step as completed before opening its settings page.
The completion endpoint SHALL accept only the `tax` and `shipping` steps, SHALL
succeed without change for an already completed step, and SHALL be restricted to
authenticated users who can manage the store with a valid request nonce.

#### Scenario: Confirming preconfigured tax

- **WHEN** the `tax` step is preconfigured and not completed, and the merchant clicks "Update tax rate"
- **THEN** the step is recorded as completed and Tax settings opens

#### Scenario: Completing a data-driven step by request

- **WHEN** a client asks the completion endpoint to complete `products`
- **THEN** the request is rejected and nothing is recorded

#### Scenario: Unauthorized completion

- **WHEN** a logged-in user without the store management capability calls the completion endpoint
- **THEN** the request is rejected and nothing is recorded

### Requirement: Accordion behaviour

The steps SHALL be shown as an accordion in which at most one step is expanded at
a time. When the checklist loads, the first visible incomplete step SHALL be
expanded. If every visible step is completed, all steps start collapsed. Any
step, including a completed one, SHALL be expandable and collapsible by clicking
its header.

An expanded step SHALL show its subtitle (if any), description and buttons, and
SHALL hide its time estimate. A collapsed step SHALL show its time estimate (if
any) and a chevron.

#### Scenario: Default expanded step

- **WHEN** List your products is completed and Set up payments is not
- **THEN** Set up payments is expanded on load and every other step is collapsed

#### Scenario: Expanding another step

- **WHEN** Set up payments is expanded and the merchant clicks Add shipping method
- **THEN** Add shipping method expands and Set up payments collapses

#### Scenario: Collapsing the open step

- **WHEN** the merchant clicks the header of the expanded step
- **THEN** it collapses and no step is expanded

### Requirement: Step indicator states

Each step SHALL show a circular indicator at the start of its header:

- incomplete and collapsed: the step's number on a neutral circle with a border;
- incomplete and expanded: the step's number on a tinted (primary-light) circle;
- completed: a green check mark instead of the number, whether expanded or not.

#### Scenario: Completed step indicator

- **WHEN** List your products is completed
- **THEN** its indicator shows a green check mark and no number

#### Scenario: Expanded step indicator

- **WHEN** an incomplete step is expanded
- **THEN** its number circle uses the tinted background
