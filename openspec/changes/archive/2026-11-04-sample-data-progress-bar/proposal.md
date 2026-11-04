## Why

After a click on "Click here to load sample data!", the onboarding completion screen
shows a spinner. The spinner gives no feeling of progress for an import of about
10 seconds. Also, the "Downloading product sample..." phase is a 2.5 second timer
that sends no request: the real download happens in the "Creating products..."
phase. The labels do not match the work, and the merchant can leave the screen
while the import runs.

## What Changes

- The onboarding completion screen shows a small progress bar (80 px wide,
  centered) with the text "Downloading sample data..." below the card, in place of
  the spinner.
- The progress uses one time-based curve, because the server gives no progress:
  - The sample data request starts on the click. The 2.5 second wait before the
    request is removed.
  - One phase covers the whole import (download and record creation), with one
    text. The bar eases out from 0% to 95% in 10 seconds, then creeps from 95%
    toward 99%, and goes to 100% when the request succeeds.
  - When the request succeeds before 10 seconds, the bar goes to 100% at once.
- The texts "Downloading product sample..." and "Creating products..." are replaced
  by one text, "Downloading sample data...".
- "Add your first product" and "Go to Dashboard" are disabled from the click until
  the import succeeds or fails. **BREAKING** for the old rule that kept them usable
  during the import.
- The home setup checklist uses the same hook and label, so it gets the same timing
  and the new text. Its button layout does not change.
- The backend and `POST /onboarding/sample-data` do not change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `store-onboarding-wizard`: the requirement "Completion actions" changes. The
  import shows a progress bar (not a spinner) with one text,
  and the two buttons are disabled while the import runs.

## Impact

- `resources/app/features/home/hooks/use-sample-data-import.ts`: new progress curve
  and timing, with one phase. The request starts on the click.
- `resources/app/features/onboarding/components/sample-data-link.tsx`: a progress bar
  in place of the spinner.
- `resources/app/features/onboarding/components/onboarding-wizard.tsx` and
  `setup-complete-step.tsx`: the buttons are disabled during the import.
- `resources/app/features/home/components/sample-data-progress.tsx`: the new text.
- Tests in `features/home/tests/` and `features/onboarding/tests/`.
- `docs/onboarding.md` §5 and `docs/home.md` §6 and its "Where this differs" list.
- No PHP, REST or data change.
