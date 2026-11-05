## 1. Progress curve in the shared hook

- [x] 1.1 In `features/home/hooks/use-sample-data-import.ts`, start the request on the click, and replace the 2.5 s timer and the 70%/95% values with the design curve: ease-out cubic from 0% to 95% in 10 000 ms (`'downloading'`), then a creep toward 99% at 0.02 for each 100 ms tick (`'creating'`), then 100% at `'done'`. A response before 10 s goes to `'done'` at once. A failure resets to 0% and `'idle'`.
- [x] 1.2 Rewrite `features/home/tests/hooks/use-sample-data-import.test.tsx` with fake timers: the request is sent on the click; about 95% and `'creating'` at 10 s; below 100% and still moving at 20 s; 100% and `'done'` for a response at 4 s with no `'creating'` phase; `isImporting` is `false` at `'done'`; reset after a failure; `onLoaded` after the 1 s pause.
- [x] 1.3 Run `npm run typecheck && npm test` in `resources/app/`.

## 2. Onboarding progress bar and disabled buttons

- [x] 2.1 In `features/onboarding/components/sample-data-link.tsx`, add a `progress` prop, and replace the spinner with the track and fill (160 px × 4 px, `role="progressbar"` with the `aria-*` values) and the phase text below it. Use "Creating product sample..." for `'creating'`, and keep the bar at 100% for `'done'`. Give the root a `minHeight` that fits both states, so the layout does not move.
- [x] 2.2 In `features/onboarding/components/setup-complete-step.tsx`, add an `isActionDisabled` prop that disables "Add your first product" and "Go to Dashboard" in the `'default'` footer.
- [x] 2.3 In `features/onboarding/components/onboarding-wizard.tsx`, pass `sampleData.progress` to `SampleDataLink` and `sampleData.isImporting` to `SetupCompleteStep`.
- [x] 2.4 In `features/home/components/sample-data-progress.tsx`, change "Creating products..." to "Creating product sample...".
- [x] 2.5 Update the onboarding tests (`features/onboarding/tests/`): a progress bar with its value and the phase text shows in place of the link; no spinner; both buttons are disabled while importing and enabled at `'done'` and after a failure. Update the home tests that expect "Creating products...".
- [x] 2.6 Run `npm run typecheck && npm test` in `resources/app/`.

## 3. Docs

- [x] 3.1 Update `docs/onboarding.md` §5: the progress bar, the time-based 95%/5% split over 10 s, the new text, and the disabled buttons. Also say that the phases are time-based and do not report the server work.
- [x] 3.2 Update `docs/home.md` §6 and its "Where this differs" entry about the simulated download: the request starts on the click, the new curve, and the new text.
- [x] 3.3 Run `npm run typecheck && npm test` in `resources/app/`.
