## Why

The Essentials step holds too much when the merchant collects tax: currency, the tax
answer, the price mode and the Tax ID all share one card. The new design moves tax to
its own step and changes the completion screen. The completion screen sends the
merchant to their first product, and loading sample data opens the products list so
the merchant sees the new products.

## What Changes

- The progress label shows "Step N" only. The "of 3" text is removed. The bar fill
  counts the steps already done against the real number of steps (4 when the
  merchant collects tax, 3 when they do not). Step 1 is 0%. The bar is full only on
  the completion screen, after "Create Store".
- New conditional step **Store Tax** (card title "Tax Info"). It shows only when
  "Collect sales tax?" is "Yes". It holds:
  - "Prices on your products", a radio with "Including tax" and "Excluding Tax".
    "Excluding Tax" is the default.
  - The optional Tax ID field.
  These fields move off the Essentials step.
- Essentials shows "Continue" when tax is "Yes" and "Create Store" when tax is "No".
- The "Shop, Cart, Checkout and Account pages will be created" note shows only on the
  screen that has "Create Store".
- Completion screen:
  - No step number in the header.
  - The title is always "Your store is almost ready".
  - The summary rows finish one by one. Before, all rows changed state together.
  - The rows do not change: Location, Currency, Store pages, and Tax when tax is "Yes".
  - Two buttons side by side: "Add your first product" opens the create-product page,
    and "Go to Dashboard" opens home.
  - The 5-second minimum progress time is replaced by the row stagger.
- **BREAKING (UX)**: "Load sample data" is no longer a button in the card, and it no
  longer moves the merchant to the dashboard. It becomes the link "Click here to load
  sample data!" below the card. The link uses the same phased import as the home
  checklist ("Downloading product sample..." then "Creating products..."), with a
  spinner and no progress bar. When the import is done, the merchant goes to the
  products list page instead of the dashboard.
- The `useLoadSampleDataMutation` in onboarding is removed. Onboarding uses the
  `useSampleDataImport` hook from the home feature through a new
  `features/home/index.ts` public API.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `store-onboarding-wizard`: changes to the wizard layout (step label, step count),
  the Essentials step (tax fields moved, CTA label, pages note), and the completion
  screen (title, row progress, actions). Adds a conditional Store Tax step.

## Impact

- **Frontend only.** There are no PHP, REST, or payload changes. `POST /onboarding`
  and `POST /onboarding/sample-data` are used as they are.
- `resources/app/features/onboarding/`: `lib/steps.ts`, `components/onboarding-wizard.tsx`,
  `components/onboarding-shell.tsx`, `components/essentials-step.tsx`,
  `components/setup-complete-step.tsx`, `services/onboarding.ts`, a new
  `components/store-tax-step.tsx`, and their tests.
- `resources/app/features/home/`: new `index.ts` public API that exports
  `useSampleDataImport`.
- Saved wizard drafts in session storage: the step index meaning changes (the
  completion index moves). A draft that points to the Tax step when tax is "No" must
  fall back to Essentials.
