## 1. Step model and draft

- [x] 1.1 In `features/onboarding/lib/steps.ts`: widen `OnboardingStep` to `0 | 1 | 2 | 3 | 4`, add `TAX_STEP = 3`, set `COMPLETION_STEP = 4`, remove `FORM_STEP_COUNT`, split `STEP_FIELDS` (2: `currency`, `is_tax_collected`; 3: `is_tax_inclusive_price`, `store_tax_id`), add `getFormStepCount(isTaxCollected)`, and add the "Store Tax" and "Setup Complete" titles (D1, D4)
- [x] 1.2 In `lib/onboarding-draft.ts`: allow draft step 3 (D8)
- [x] 1.3 In `onboarding-wizard.tsx`: when the draft step is `TAX_STEP` and `is_tax_collected` is not `true`, start on step 2 (D8)
- [x] 1.4 Add tests: `getFormStepCount`, the draft accepts step 3, and the tax-step fallback on restore → verify: `npm test` in `resources/app/`

## 2. Shell header

- [x] 2.1 `OnboardingShell` takes `stepCount` and an optional `afterCard` slot. It shows "Step N" (no total) on form steps and no number on completion. Bar fill = `(step + 1) / stepCount`, or 100% on completion (D4)
- [x] 2.2 In the wizard, compute `stepCount` from `useWatch('is_tax_collected')` and pass it to the shell

## 3. Essentials and Store Tax steps

- [x] 3.1 Extract the pages note into `components/store-pages-note.tsx` (D2)
- [x] 3.2 Add `components/fields/boolean-radio-field.tsx` (boolean ↔ RadioGroup, row layout) (D3)
- [x] 3.3 `EssentialsStep`: remove the price-mode and Tax ID fields. Take `onContinue` and `onCreateStore`. Show "Continue" when tax is Yes, or the pages note + "Create Store" when tax is No (D2)
- [x] 3.4 Add `components/store-tax-step.tsx`: title "Tax Info", Back, "Prices on your products" (Including tax / Excluding Tax), Tax ID with placeholder "Permit or VAT number" and info text "The Tax ID prints on your invoices.", pages note, and "Create Store"
- [x] 3.5 Wire the wizard: Essentials Continue validates step 2 and goes to `TAX_STEP`. Store Tax Create Store calls `handleCreateStore`. Back from Store Tax goes to step 2

## 4. Completion screen rows

- [x] 4.1 Add `hooks/use-staggered-rows.ts` (`ROW_STAGGER_MS = 400`; states waiting / in-progress / completed / stopped; reset on `runId`) (D5)
- [x] 4.2 Add tests for the hook with fake timers: rows complete in order, the last row waits for success, an error stops the remaining rows, and a new `runId` restarts → verify: `npm test`
- [x] 4.3 In `services/onboarding.ts`: remove `withMinimumDuration` / `MIN_STORE_SETUP_MS` from `createStore`. Delete `lib/with-minimum-duration.ts` and its test (D5)
- [x] 4.4 `SetupCompleteStep`: render each row's own state. Title is always "Your store is almost ready". The wizard increments `runId` on retry

## 5. Completion actions

- [x] 5.1 `SetupCompleteStep` footer: "Add your first product" (primary, to `RouteConfig.Products.CreateProduct` with replace) and "Go to Dashboard" (outline) side by side in a 2-column grid, disabled until every row is completed. "Try again" replaces both on error (D7)
- [x] 5.2 Remove the old "Load sample data" button and its note from the card

## 6. Sample data link

- [x] 6.1 Create `features/home/index.ts` that exports `useSampleDataImport` (D6)
- [x] 6.2 Add `features/onboarding/components/sample-data-link.tsx`: link "Click here to load sample data!" (disabled until setup is done), then a spinner + "Downloading product sample..." / "Creating products...", with no progress bar
- [x] 6.3 In the wizard, call `useSampleDataImport({ onLoaded })` with `onLoaded` = navigate to `RouteConfig.Products` with replace. The setup session ends in the wizard's unmount cleanup, so the onboarding page's redirect to Home cannot run before the navigation (covered by `tests/pages/onboarding.test.tsx`). Render the link through the shell's `afterCard` on the completion step only
- [x] 6.4 Delete `useLoadSampleDataMutation` / `loadSampleData` from `services/onboarding.ts`, and remove the now-unused imports

## 7. Tests and checks

- [x] 7.1 Update `tests/components/onboarding-wizard.test.tsx`: the Essentials CTA label switches on the tax answer; Store Tax shows only for Yes; the header shows "Step N" with no total; the final header has no number; the sample-data link is disabled during setup; the import success navigates to the products list; the two buttons navigate to create-product and home
- [x] 7.2 Run `npm run typecheck`, `npm run lint`, and `npm test` in `resources/app/`. All must pass (`knip` must report no new unused exports)
- [x] 7.3 Update `docs/onboarding.md` (steps, header, completion rows, actions, sample data link) and the button name in `docs/home.md`
- [x] 7.4 Ask the user to check the screens visually (no browser preview in this project)
