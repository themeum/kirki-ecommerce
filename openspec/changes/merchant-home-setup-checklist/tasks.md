## 1. Onboarding payment seed

- [x] 1.1 In `database/seeders/OnBoarding/SettingsSeeder.php::get_offline_payments()`, set `cod` to `is_enabled => false` and add a `bank_transfer` entry ("Direct bank transfer", translated transfer instructions, no icon, disabled)
- [x] 1.2 Update the seeder's docblocks and any test asserting COD is enabled; add/adjust a test that a fresh seed yields both methods, both disabled

## 2. Checklist state service (PHP)

- [x] 2.1 Add `OptionKeys::SETUP_CHECKLIST = 'setup_checklist'`
- [x] 2.2 Create `app/Services/SetupChecklistService.php` with the step ids/order, visibility (`tax` only when `general.is_tax_calculation_enabled`), and per-step `has_data` checks (product exists; any provider `is_enabled`; never for `customize`; enabled `tax.tax_regions`; enabled `shipping.shipping_zones`)
- [x] 2.3 Implement `get_state()`: read the option, evaluate uncompleted visible steps (skip `tax`/`shipping` auto-completion when preconfigured), persist newly met steps in one write, return `steps[]` with `id`, `is_completed`, `is_preconfigured`, `has_data`
- [x] 2.4 Implement `complete(string $step)`: allow only `tax`/`shipping`, keep an existing timestamp, return the state
- [x] 2.5 Implement `record_preconfigured()` and call it at the end of `StoreSetupService::setup()` after `apply_presets()`
- [x] 2.6 Integration tests: sticky completion survives data removal; disabled payments/zones/regions don't count; preconfigured steps don't auto-complete but complete via `complete()`; hidden `tax` step is omitted and keeps its stored completion; stores without a `preconfigured` key treat nothing as preconfigured

## 3. REST endpoints

- [x] 3.1 Create `app/Http/Controllers/Api/SetupChecklistController.php` with `index` and `complete` (422 for steps other than `tax`/`shipping`)
- [x] 3.2 Register `GET /setup-checklist` and `POST /setup-checklist/{step}/complete` in the authenticated admin group of `routes/api.php`
- [x] 3.3 API tests: payload shape, 422 on `products`, rejection for a user without store-management capability (extend `AdminApiAccessTest` if that's where coverage lives)

## 4. Home menu

- [x] 4.1 In `app/Menu/Home.php`, set `$menu_slug = 'kirki-ecommerce#/'`, delete the `render()` override that hides the first submenu item, and update the class docblock

## 5. Front-end data layer

- [x] 5.1 Add `SETUP_CHECKLIST` endpoints to `resources/app/config/endpoints.ts`
- [x] 5.2 Create `features/home/schemas/catalog/setup-checklist.ts` (zod v3) and its payload test `setup-checklist.test.ts` *(placed in `features/home/tests/schemas/catalog/`, the feature-level `tests/` convention every other feature uses)*
- [x] 5.3 Create `features/home/services/setup-checklist.ts` with `useSetupChecklistQuery` and `useCompleteSetupStepMutation` (writes the returned state into the query cache; error toast on failure)

## 6. Front-end UI

- [x] 6.1 Create `features/home/lib/steps.ts`: per-id title, subtitle, time estimate, description, and CTAs (Add/Update labels + target routes) per the spec table
- [x] 6.2 Create `step-indicator.tsx` (bordered number / tinted number when expanded / green check when completed)
- [x] 6.3 Create `setup-checklist-step.tsx`: header with indicator, title, time estimate + chevron when collapsed; content with subtitle, description and CTAs when expanded; the "Update" click on a preconfigured, uncompleted step awaits the complete mutation before navigating
- [x] 6.4 Create `setup-checklist.tsx`: card with "X out of N complete", percentage and `Progressbar`; controlled single-collapsible `Accordion` whose initial value is the first incomplete step (computed once on first data); skeleton while loading and an error message on failure *(the progress bar is a small read-only `role="progressbar"` track: `components/ui/progressbar.tsx` is an interactive slider with `role="slider"` and a pointer cursor)*
- [x] 6.5 Create `lib/templates.ts` (three placeholder entries, `#` links marked TODO) ~~add placeholder images under `resources/app/assets/images/templates/`~~ *(not needed: entries use `image: null`, and `Image` already falls back to `assets/placeholder.svg`)*, and build `template-gallery.tsx` with the "Explore more" link (new tab)
- [x] 6.6 Create `pages/home.tsx` (heading, "View Live Site" from the `site_url` config opening in a new tab, checklist, gallery), `routes.tsx` ~~and `index.ts`~~ *(no `index.ts`: the feature exports nothing, and knip flags an empty barrel)*
- [x] 6.7 In `resources/app/routes.tsx`, replace the `Home → Navigate(/products)` entry with `...homeRoutes`

## 7. Docs & verification

- [x] 7.1 Write `docs/home.md` following the ~~`docs/cache.md`~~ `docs/onboarding.md` structure *(`docs/cache.md` does not exist; also updated `docs/onboarding.md` for the disabled payment seed and the snapshot)* (TOC, numbered sections: quick start, steps & completion rules, storage/option shape, preconfigured snapshot, REST endpoints)
- [x] 7.2 Run `npm run typecheck`, lint and `npm test` in `resources/app/`, plus PHPUnit and phpcs for the touched PHP; fix any failures *(the 3 remaining lint errors are pre-existing, in `components/ui/accordion.tsx` and `components/ui/text.tsx`)*
- [x] 7.3 Ask the user to visually check the Home page against the screenshots (no browser preview per project rules)

## 8. Load sample data on step 1

- [x] 8.1 In `lib/steps.ts`, replace `hasAddIcon` with `icon?: LucideIcon` (Plus on the "Add …" actions), make `SetupStepAction` a `kind: 'link' | 'sample-data'` union, and add the `Shirt` "Load sample data" action to `products` when `!step.has_data`. Update `steps.test.ts` *(first built with a "Completed" state; the user asked to remove the button after the import instead)*
- [x] 8.2 Add `services/sample-data.ts` with `useImportSampleDataMutation` (`POST endpoints.ONBOARDING_SAMPLE_DATA`, error toast, no success toast)
- [x] 8.3 Add `hooks/use-sample-data-import.ts`: phases `idle → downloading (0→70% in 2.5 s, faked) → creating (import, creep toward 95%) → done (await invalidate, 100%)`, back to `idle` on error, timers cleared on unmount. Test it with fake timers
- [x] 8.4 Add `components/sample-data-progress.tsx`: the phase message and a bottom-edge bar, rendered inside the "Load sample data" button *(first built as a separate card below the buttons; the user asked for it inside the button)*
- [x] 8.5 In `setup-checklist-step.tsx`, render the action icon, run the sample-data action through the hook, disable "Add products" and swap the sample-data button's content for the progress while it runs, and call `onSampleDataLoaded` about 1 s after `done`. In `setup-checklist.tsx`, open the first incomplete step from the latest data on that callback
- [x] 8.6 Update `docs/home.md` (step 1 time, buttons, sample-data flow)
- [x] 8.7 Run typecheck, lint and `npm test`. Ask the user to check the sample-data flow visually *(the 3 lint errors are the same pre-existing ones in `components/ui/accordion.tsx` and `components/ui/text.tsx`)*

## 9. Stricter completion rules

- [x] 9.1 In `SetupChecklistService::has_data()`: payments need an enabled provider whose required `admin_fields()` all have non-empty values in `settings()`; `customize` returns true; tax needs an enabled region with a product rate above 0 (EU `countries[].rate`, central `central_product_tax`, or `states[].product_tax_rate`); shipping needs an enabled zone with an enabled `shipping_methods[]` entry. Update the docblocks
- [x] 9.2 Update `tests/Integration/SetupChecklistApiTest.php` (and `OnboardingApiTest` preconfigured fixture): PayPal enabled without credentials does not count, with credentials counts; customize is completed on a fresh store; regions with no rate / rate 0 / disabled do not count, and each of EU, central and state rates counts; zones with no method, a disabled method or only carriers do not count
- [x] 9.3 Update `docs/home.md` (completion rules table, limitations: 100% is now possible, "Customize" no longer blocks it)
- [x] 9.4 Run PHPUnit (integration + unit), phpcs on the touched PHP, and the front-end tests *(PHP unit 400 and integration 672 pass; phpcs wporg and docblock sniffs are clean. 2 front-end tests fail because of the user's own edits made during this task: the removed "Cash on delivery" button (`steps.test.ts`) and the new store-name placeholder (`onboarding-wizard.test.tsx`))*

