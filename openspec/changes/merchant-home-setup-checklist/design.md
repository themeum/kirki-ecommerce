## Context

- `RouteConfig.Home` (`/`) exists, but `routes.tsx` maps it to
  `<Navigate to="/products">` inside `OnboardingGate`. `app/Menu/Home.php` points at
  `kirki-ecommerce#/products` and hides itself with an inline `admin_head` style
  marked `@todo: will be removed after the home menu is back`.
- The data each step reads already lives in settings groups or tables:
  - products: the products table (`Product` model);
  - payments: `Payment::get_all_providers()`, where each `PaymentProvider` exposes
    `is_enabled`;
  - tax: `tax.tax_regions[]` and `general.is_tax_calculation_enabled`;
  - shipping: `shipping.shipping_zones[]`, each zone with `is_enabled`.
- Plain options are written through the framework `Option` facade with keys from
  `OptionKeys`, as `Onboarding::mark_completed()` does with
  `ONBOARDING_COMPLETED_AT`.
- `StoreSetupService::setup()` runs once per store. `apply_presets()` is an empty
  seam that will later seed tax regions and shipping zones.
- Reusable UI: `components/ui/accordion.tsx` (Radix-style
  `Accordion`/`AccordionItem`/`AccordionTrigger`/`AccordionContent`), `Card`,
  `Button`, `Skeleton`, `Image` (falls back to `assets/placeholder.svg`).
  `components/ui/progressbar.tsx` is an interactive slider, so the checklist
  draws its own read-only `role="progressbar"` track.
- Requirements are in `specs/store-setup-checklist/spec.md`,
  `specs/merchant-home-page/spec.md` and `specs/onboarding-seed-data/spec.md`.

## Goals / Non-Goals

**Goals:**
- One server-side source of truth for step state. The React app only renders what
  the server returns and never re-implements completion rules.
- Sticky completion that costs one option read on the hot path once a step is done.

**Non-Goals:**
- Defining step 3's completion rule or CTAs.
- A dismiss or "all done" state for the checklist. When every step is completed,
  the checklist stays on Home at 100%.
- Real template data or a template API. The gallery is a bundled placeholder list.
- Highlighting the current wp-admin submenu item from the hash route.
- A CSV product import.

## Decisions

### 1. Evaluate lazily on read, on the server

`GET /setup-checklist` loads the stored state. For each visible, not-yet-completed
step it runs that step's rule, saves any newly met steps in one `Option::set`, and
returns the steps.

- **Why not hooks on product/settings save?** That would need listeners in products,
  payments, tax settings and shipping settings, and the Home page would still need
  the read path. Lazy evaluation keeps the logic in one service, and nobody can see
  the checklist without opening Home anyway.
- **Why on the server?** Rules like "enabled payment method" depend on the provider
  registry, including addon providers, which the client can't see reliably.

### 2. Storage: a single option holding all checklist state

New key `OptionKeys::SETUP_CHECKLIST = 'setup_checklist'` stores:

```php
[
    'completed'     => ['products' => 1727850000, ...], // step id => completed-at timestamp
    'preconfigured' => ['shipping'],                     // step ids, written once at store setup
]
```

- One option means one read and one autoloaded row.
- Timestamps cost nothing, and they help with support questions ("when did they
  enable payments?").
- **Alternative:** one option per step. Rejected because it means more rows and more
  reads for no benefit.

### 3. Step catalogue on the server, copy on the client

`SetupChecklistService` owns the step ids, their order and their rules:
`products`, `payments`, `customize`, `tax`, `shipping`. The response is
data only:

```json
{ "data": { "steps": [
  { "id": "products", "is_completed": true,  "is_preconfigured": false, "has_data": true },
  { "id": "payments", "is_completed": false, "is_preconfigured": false, "has_data": false },
  ...
]}}
```

- Hidden steps (`tax` when tax calculation is off) are left out of the response.
- `has_data` tells the client whether to show "Update …" or "Add …".
- Titles, descriptions, time estimates and CTA routes live in a typed client-side
  table (`features/home/lib/steps.ts`), keyed by id, because they are pure
  presentation and translated with `__()`.
- The client renders the server's order and computes numbering, N, X and the
  percentage from the returned list.
- **Alternative:** have the server return the copy. Rejected because translation and
  routes both belong to the SPA, and it would split one card's text between two
  places.

### 4. Preconfigured snapshot written by `StoreSetupService`

After `apply_presets()`, `setup()` calls
`SetupChecklistService::record_preconfigured()`. That method runs the `tax` and
`shipping` data checks and stores the ids that pass.

- It runs at the end of setup, so it captures whatever presets seeded, and future
  preset code needs no extra step.
- Stores onboarded before this change have no `preconfigured` key, so they are
  treated as having no preconfigured steps.
- `has_data` for a preconfigured step is still computed live. This is the generic
  rule from the grilling: "Update" whenever qualifying data exists.

### 5. Click-to-complete endpoint

`POST /setup-checklist/{step}/complete`:

- Allows only `tax` and `shipping` (otherwise `422`). It is idempotent: an existing
  timestamp is kept.
- Returns the same payload as `GET`.
- The client awaits the mutation, updates the query cache, then navigates. If the
  request fails, it shows the error toast and still navigates, because the merchant
  asked to go to settings. The step simply stays incomplete.
- The client only calls the endpoint when the step `is_preconfigured` and is not
  completed. A plain "Update …" click on an already-completed step just navigates.

Both routes go in the existing authenticated admin group in `routes/api.php`, so
they get the same capability and nonce checks as the other settings endpoints.

### 6. Payment seed: two disabled offline methods

`SettingsSeeder::get_offline_payments()` returns `cod` and a new `bank_transfer`
entry ("Direct bank transfer" with transfer instructions), both with
`'is_enabled' => false`. Seeding still only writes when the payment group is
unconfigured, so existing stores are untouched.

### 7. Front-end structure

```
resources/app/features/home/
  routes.tsx                 # { path: RouteConfig.Home.template, element: withSuspense(Home) }
  pages/home.tsx             # header + <SetupChecklist/> + <TemplateGallery/>
  components/
    setup-checklist.tsx      # Card, progress header, Accordion (type="single" collapsible)
    setup-checklist-step.tsx # indicator, header (title / time / chevron), content + CTAs
    step-indicator.tsx       # number | tinted number | green check
    sample-data-progress.tsx # message + bar shown inside the sample-data button (decision 9)
    template-gallery.tsx
  hooks/use-sample-data-import.ts  # phase + bar value for "Load sample data"
  lib/steps.ts               # per-id copy, time estimates, CTA labels/routes
  lib/templates.ts           # static placeholder template list
  services/setup-checklist.ts# useSetupChecklistQuery, useCompleteSetupStepMutation
  services/sample-data.ts    # useImportSampleDataMutation
  schemas/catalog/setup-checklist.ts  # zod schema for the GET/POST payload
  tests/schemas/catalog/setup-checklist.test.ts
  tests/lib/steps.test.ts
```

- The accordion is controlled (`value`/`onValueChange`). Its initial value is the
  first incomplete step id, computed once when the data first arrives so that
  refetches don't move the open item.
- `routes.tsx` replaces the `Navigate` element with `...homeRoutes`.
- "View Live Site" reads the existing `site_url` boot config value.
- Template entries use `image: null`, so `Image` shows its placeholder. Links
  are `#`, with a `TODO` comment.

### 8. Home submenu

`Home::$menu_slug` becomes `kirki-ecommerce#/`. The `render()` override that hides
the first submenu item is deleted.

### 9. Load sample data on step 1

The button reuses `POST /onboarding/sample-data` (`SampleDataImporter`, which
seeds the bundled demo products and does nothing when products exist). The
backend does not change. The remote download is not built yet, so the client
fakes the download phase.

- **Action shape.** `SetupStepAction` drops `hasAddIcon` and gets
  `icon?: LucideIcon`. The component renders `<Icon size={16} aria-hidden />`.
  A component type, not a `ReactNode`, keeps `lib/steps.ts` a plain `.ts` file
  and keeps the icon size in one place. The action becomes a discriminated union:
  `kind: 'link'` (has `to`, optional `completesStep`) or `kind: 'sample-data'`
  (no route).
- **Visibility.** `getSetupStepDefinition(step)` adds the sample-data action
  only when `!step.has_data`. The refetch after the import makes `has_data`
  true, so the button goes away without extra state.
- **Flow hook.** `hooks/use-sample-data-import.ts` owns the phase
  (`idle | downloading | creating | done`) and the bar value:
  1. `downloading`: a timer moves the value from 0 to 70 over 2.5 s.
  2. `creating`: it calls the import mutation. A timer moves the value slowly
     toward 95 and never past it.
  3. On success it awaits `queryClient.invalidateQueries()` (the checklist
     refetches and other screens see the new products). Then it sets the value
     to 100 and the phase to `done`.
  4. On failure, the mutation shows `toastMutationError`, and the hook returns
     to `idle`.
  The durations are module constants, so tests can drive them with fake
  timers. The hook clears its timers on unmount.
- **Where the state lives.** The hook runs in `SetupChecklistStep`. That
  component stays mounted when its accordion content collapses, so the
  "Completed" state survives the collapse. About 1 s after `done`, the step calls
  `onSampleDataLoaded()`. `SetupChecklistSteps` then opens the first incomplete
  step from the latest query data. The hook owns this 1 s timer.
- **Progress in the button.** While the import runs, the "Load sample data"
  button's content is `components/sample-data-progress.tsx`: the phase message
  and a 3px brand-colored bar along the button's bottom edge (the button is
  `position: relative`, the override adds `overflow: hidden`). The button does
  not use `disabled`, because that sets opacity to 0.5. It uses
  `pointer-events: none`, `aria-disabled` and `aria-busy` instead. The message
  is the button's accessible name, so screen readers hear the phase.
- **Mutation.** `services/sample-data.ts` has a Home-owned
  `useImportSampleDataMutation`. It uses the same endpoint, with an error toast
  and no success toast. The onboarding hook keeps its toast and its
  `leaveToDashboard` flow.
- **Locking.** While the phase is `downloading` or `creating`, "Add products"
  is disabled and the sample-data button ignores clicks.

### 10. Stricter data rules

`SetupChecklistService::has_data()` holds every rule. The checklist, the "Add" or
"Update" label and the preconfigured snapshot all read it, so one change there
updates all three.

- **payments.** A provider counts when `enabled()` is true and every entry in
  `admin_fields()` with `'required' => true` has a non-empty value in
  `settings()` (after `trim`). Offline methods have no admin fields, so for them
  `enabled()` is enough. The rule reads the generic field list, so addon
  gateways need no extra code.
- **customize.** `has_data()` returns true. The step is recorded as completed
  on the first read, the same as other met steps, so the stored option shows it.
- **tax.** A region counts when `is_enabled` is true and it has a product rate
  above 0. The rate check follows the tax strategies:
  - EU region (`code` = `EU`): any `countries[].rate` > 0.
  - General region with `is_central_tax_enabled`: `central_product_tax` > 0.
  - General region without central tax: any `states[].product_tax_rate` > 0.
  Rates are compared as floats, because the settings store them as numbers or
  strings.
- **shipping.** A zone counts when `is_enabled` is true and any
  `shipping_methods[].is_enabled` is true. `shipping_carriers` are ignored.
- **Old completions.** Completion is sticky, so a step completed under the old
  rules stays completed. Pre-release dev stores can delete the option to see the
  new rules (`docs/home.md`, reset section).

## Risks / Trade-offs

- **Lazy evaluation misses completions the merchant never sees.**
  → Acceptable. The state only shows on Home, and it is evaluated whenever Home
  loads.
- **Sticky completion can be stale.** A step stays checked after its data is
  removed (e.g. all payments disabled).
  → This was chosen deliberately. The checklist is a guide, not a health monitor.
- **Fresh stores can't take orders until a payment method is enabled** (seed change).
  → Step 2 is the explicit nudge. This is pre-release, so no migration is needed.
- **Snapshot before presets exist.** Today the snapshot is always empty, so the
  Update/click path is only reachable once presets seed data.
  → It is covered by service tests with seeded settings rather than by a real
  preset.
- **Hidden-menu removal.** The first submenu item becomes visible again and points
  at a hash route.
  → This is the intended "home menu is back" state named in the `@todo`.

## Migration Plan

No data migration is needed. The new option is created on the first Home load.
Existing dev stores keep their enabled COD (the seed doesn't re-run), so step 2
completes for them on first load. To roll back, revert the change. The leftover
`setup_checklist` option is harmless.
