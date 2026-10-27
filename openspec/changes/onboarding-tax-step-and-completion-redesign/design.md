## Context

See proposal.md (Why) and specs/store-onboarding-wizard/spec.md for the behaviour.

The wizard today (`resources/app/features/onboarding/`):

- `lib/steps.ts` uses fixed step indices: `0 | 1 | 2 | 3`, `FORM_STEP_COUNT = 3`,
  `COMPLETION_STEP = 3`, and `STEP_FIELDS` keyed by index.
- `components/onboarding-wizard.tsx` keeps `step` in state, validates with
  `form.trigger(STEP_FIELDS[step])`, and moves with `step + 1` / `step - 1`.
- `components/onboarding-shell.tsx` gets `step` and builds "Step N of 3" and the bar.
- `components/setup-complete-step.tsx` gets one `status` for every row.
- `services/onboarding.ts` wraps `POST /onboarding` in `withMinimumDuration(…, 300)`
  and has its own `useLoadSampleDataMutation`.
- `lib/onboarding-draft.ts` stores `{ step: 0 | 1 | 2, values }` in sessionStorage.

The home feature has `hooks/use-sample-data-import.ts` (phases `idle → downloading →
creating → done`, then `onLoaded` after 1 s). The home feature has no `index.ts` yet.
ESLint `kirki/feature-boundary-*` blocks deep imports into another feature.

The main spec says the in-progress state lasts 5 s or more. The code uses 300 ms. The
row stagger in this change replaces both.

## Goals / Non-Goals

**Goals:**
- Add the conditional Store Tax step and keep index-based navigation simple.
- Make each completion row have its own state, driven by the client.
- Reuse the home sample-data hook without a deep import.

**Non-Goals:**
- No backend, REST, or payload change. `OnboardingFormSchema` and its transform do
  not change.
- No change to the home checklist UI or to `useSampleDataImport` behaviour.
- No shared "stepper" abstraction for other features.

## Decisions

### D1. Step indices: add index 3 for Store Tax, completion moves to 4

`OnboardingStep = 0 | 1 | 2 | 3 | 4`, `TAX_STEP = 3`, `COMPLETION_STEP = 4`.
`STEP_FIELDS` gets `3: ['is_tax_inclusive_price', 'store_tax_id']` and Essentials
(index 2) keeps only `['currency', 'is_tax_collected']`.

Add one pure helper in `lib/steps.ts`: `getFormStepCount(isTaxCollected: boolean)`,
which returns 4 or 3. No "next step" helper is needed: Essentials shows "Continue"
only when tax is collected, so `step + 1` from 2 is always the Store Tax step. The
Create Store path calls submit instead.

`goToPreviousStep` stays `step - 1`. Back from 3 goes to 2. Back from 2 cannot reach 3.

*Alternative:* a dynamic array of step ids (`['basics', 'business', 'essentials',
'tax']`) filtered by the tax answer. Rejected: it changes every index-based caller and
the draft format for one optional step.

### D2. Essentials decides "Continue" or "Create Store" from the watched value

`EssentialsStep` already watches `is_tax_collected`. It gets two callbacks,
`onContinue` and `onCreateStore`, and shows one button with the pages note only on the
Create Store path. The new `StoreTaxStep` always shows the note and "Create Store".

The pages note is used on two screens, so it moves to a small local component
`components/store-pages-note.tsx`. That is the only extraction.

### D3. Price mode radio is a boolean field

`RadioGroupField` (`components/form/`) takes string values, and
`is_tax_inclusive_price` is a boolean. `ChoiceButtonsField` already maps
boolean ↔ `'true' | 'false'`, but it renders as buttons.

Decision: add `components/fields/boolean-radio-field.tsx` in the onboarding feature.
It renders `RadioGroup` + `RadioGroupItem` in a row, with the same boolean mapping as
`ChoiceButtonsField`. Options: `{ value: true, label: 'Including tax' }`,
`{ value: false, label: 'Excluding Tax' }`. The schema default stays `false`.

*Alternative:* add a `variant="radio"` prop to `ChoiceButtonsField`. Rejected: it mixes
two visual components into one file for one call site.

### D4. Shell gets the count, not the tax answer

`OnboardingShell` gets `step` and `stepCount`. It shows `Step {step + 1}` for form
steps, and nothing on the left for `COMPLETION_STEP`. The bar is
`step / stepCount * 100` (steps already done), so step 1 is 0%, and 100 only at
completion. The wizard computes `stepCount`
from `useWatch('is_tax_collected')`. The completion title becomes "Setup Complete".

### D5. Row stagger lives in a small hook in the onboarding feature

`hooks/use-staggered-rows.ts`:

```
useStaggeredRows({ rowCount, setupStatus, runId }) → RowState[]
// RowState = 'waiting' | 'in-progress' | 'completed' | 'stopped'
```

- A counter `completedCount` goes up by 1 every `ROW_STAGGER_MS = 400` until it
  reaches `rowCount - 1`.
- The last row completes when `completedCount === rowCount - 1`, the delay for that
  row has passed, and `setupStatus === 'success'`.
- When `setupStatus === 'error'`, the timer stops and every row at or after
  `completedCount` is `'stopped'` (shown with the existing idle/minus icon).
- A new `runId` (incremented by `handleRetry`) resets the counter to 0.

The wizard derives `isSetupDone = rows.every(r => r === 'completed')` and passes it to
`SetupCompleteStep` for the title and to enable the buttons and link.

`withMinimumDuration` and `MIN_STORE_SETUP_MS` are removed from `createStore`: the
stagger gives the minimum visible time now. `lib/with-minimum-duration.ts` and its test
become unused and are deleted.

*Alternative:* keep `withMinimumDuration` and stagger only the icons. Rejected: two
timers for one effect.

### D6. Sample data: use the home hook through a new public API

Create `features/home/index.ts` with `export { useSampleDataImport } from
'./hooks/use-sample-data-import';`. The wizard calls it with
`onLoaded: () => leaveTo(RouteConfig.Products.template)`. `leaveTo(path)` only calls
`navigate(path, { replace: true })`.

The wizard ends the setup session in an unmount cleanup
(`useEffect(() => endSetupSession, [])`), not inside `leaveTo`. `RouterProvider`
applies a navigation in `startTransition`, but an `endSetupSession()` store update
renders at once. If the session ended before the navigation, the onboarding page
would render its `isOnboarded && !isSetupSessionActive` redirect first, and every
exit would land on Home. With the cleanup, the session ends only after the wizard has
left the screen.

The link and its status render in a new `components/sample-data-link.tsx`, placed in
`OnboardingShell` below the card. The shell gets an optional `afterCard` slot so the
shell does not know about sample data. States:

- `idle`: `Button variant="link"`, text "Click here to load sample data!", disabled
  until `isSetupDone`.
- `downloading` / `creating`: `Spinner` + the phase text, the same strings as
  `SampleDataProgress`.
- `done`: keep the spinner and "Creating products..." during the hook's 1 s pause,
  then navigation happens.
- On failure the hook returns to `idle`, and the home service's
  `toastMutationError` shows the error.

`useLoadSampleDataMutation` and `loadSampleData` in `services/onboarding.ts` are deleted.

*Alternative:* move the hook into onboarding (it calls `/onboarding/sample-data`).
Rejected by the user in favour of the smaller change.

### D7. Completion actions

`SetupCompleteStep` footer:
- error: one "Try again" button (unchanged);
- else: a two-column row with "Add your first product" (primary, opens
  `RouteConfig.Products.CreateProduct.template` with replace) and "Go to Dashboard"
  (outline, opens `RouteConfig.Home.template`). Both go through `leaveTo`. Both are
  disabled until `isSetupDone`, and they stay enabled while the sample data import runs.

The `StepLayout` footer forces `width: 100%` on buttons. The two buttons go in a
`Grid columns={2}` so each one fills its column.

### D8. Draft compatibility

`OnboardingDraft.step` becomes `0 | 1 | 2 | 3` (everything except completion).
`readDraft` accepts 3. The wizard's initial step: if the draft step is `TAX_STEP` and
`values.is_tax_collected !== true`, start at 2. Old drafts (0–2) keep the same meaning.

## Risks / Trade-offs

- [Merchant leaves during the sample import] → the hook unmounts and clears its
  timers, so no late navigation happens. The request still finishes on the server, and
  the home mutation's `onSuccess` invalidates queries.
- [Fast setup feels slower] → 3–4 rows × 400 ms is 1.2–1.6 s, less than the 5 s in
  the old spec and close to what designers asked for.
- [Tax values left from a visit to Store Tax when tax is later "No"] → the existing
  schema transform already sends `is_tax_inclusive_price: false` and
  `store_tax_id: null` when `is_tax_collected` is false. No change is needed.
- [Cross-feature hook import] → done through `@/features/home`, so the ESLint boundary
  rule stays green.

## Migration Plan

Frontend only, shipped with the plugin build. No data migration. Drafts in
sessionStorage keep working (D8). Rollback is reverting the change.
