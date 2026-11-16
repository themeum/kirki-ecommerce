## Context

See proposal.md - Why. All paths are below `resources/app/`.

Observed current state:

- `features/settings/shipping/pages/shipping-delivery-method.tsx` is a routed page. It reads
  `useSettingsQuery('shipping')`, finds the zone and the method from the URL params, and
  saves through the settings floating bar (`useSettingsPageActions`). After a save it stays
  open.
- Two lists navigate to it:
  - `components/shipping-method/shipping-method.tsx` (zone screen): **Add** navigates with a
    new `uuid()` as `method_id`; **Edit** navigates with the method id.
  - `hooks/use-shipping-settings.ts` `handleEditMethod` (Shipping settings page): navigates
    inside `confirmAction` (the unsaved-changes guard).
- `components/shipping-method/shipping-rules/shipping-rules.tsx` and
  `shipping-rule-form-card.tsx` read `zone_id` from `useParams`, read the settings query,
  and each call `updateSettings` themselves. The page renders them only when the method is
  already stored, because their save maps over stored methods.
- `lib/shipping-rules/helper.ts` `resolveDestinationRegion` finds the zone by `methodID`
  when one is given, else by `activeZoneId` (strict `===`).
- `components/shipping-box/shipping-box-dialog.tsx` is the existing form-dialog pattern
  (`Dialog`, `DialogContent`, `DialogCloseButton`, `DialogHeader`, `DialogBody`,
  `DialogFooter`, own `Form`).
- `Form` (`components/ui/form.tsx`) is only a `FormProvider`; it renders no `<form>`
  element. A dialog with its own `Form` inside the zone screen's `Form` is safe.
- The route `ShippingDeliveryMethod` is in `config/route-config.ts` and is asserted in
  `libs/route.test.ts`.

## Goals / Non-Goals

**Goals:**

- One dialog component for add and edit, used by the two lists.
- The dialog gets its data by props. It has no settings query of its own.
- Rules are plain local state in the dialog and are part of the one save.
- The existing form fields, schema (`ShippingMethodFormSchema`), type sub-forms, toasts,
  and server-error mapping are reused without change.

**Non-Goals:**

- No change to `ShippingMethodFormSchema`, `ShippingRuleFormSchema`, or to their tests.
- No change to the backend, the REST payload, or the stored shape.
- No redesign of the rule form or of the method lists.
- No redirect for the removed URL.

## Decisions

### D1. Dialog props carry the method and the zones

```ts
type ShippingMethodDialogProps = {
  isOpen: boolean;
  zoneId: string | number;
  method?: ShippingMethodData | null; // null or undefined = add
  shippingZones: ShippingZone[];
  onClose: () => void;
  onSaved?: (zones: ShippingZone[]) => void;
};
```

File: `features/settings/shipping/components/shipping-method/shipping-method-dialog.tsx`.

- On open, the form resets to `pickFormValues(ShippingMethodFormSchema, method)` (edit) or
  `getDefaults(ShippingMethodFormSchema)` (add), and the rules state resets to
  `method?.shipping_rules ?? []`.
- The method id is `method?.id ?? uuid()`, held in a ref for one open session.
- Save builds the new zones from `shippingZones`: replace the method by id when `method`
  is given, else append to the zone whose id matches `zoneId` (compare with `String()`),
  with `zoneId`, `is_enabled: method?.is_enabled ?? true`, and `shipping_rules: rules`.
  Then `updateSettings({ key: 'shipping', data: { shipping_zones } })`, invalidate
  `settingsKeys.section('shipping')`, the same toasts as the page, `onSaved(zones)`, close.
- On error: the same `applyServerErrors` call with the
  `data.shipping_zones.<zone>.shipping_methods.<method>.` `stripPrefix`; the dialog stays
  open.
- The Save button shows `loading` while the request runs.

*Alternative considered:* keep `useSettingsQuery` in the dialog (the query is cached). Not
used, because the lists hold local zone state that can be newer than the cache (the zone
screen keeps `shippingZonesObj`), and the request was to pass the listed values.

### D2. Rules components become controlled

- `ShippingRules` props: `{ zoneId, rules, onChange }`. It removes `useParams`, its local
  rules state and sync effect, and `saveShippingZones`. Delete (after the existing
  confirmation) calls `onChange(rules.filter(...))`. Add and edit call
  `onChange(mergeRuleIntoMethodRules(rules, payload, ruleIndex))` (existing function in
  `lib/shipping-rules/rule-form.ts`). The label lookups (categories, profiles, countries,
  product settings) stay.
- `ShippingRuleFormCard` props: `methodId` is replaced by `zoneId` and
  `onSubmit: (rule: ShippingRuleFormPayload) => void`. It removes `useParams`,
  `updateSettings`, the query invalidation, the toast, and the server-error branch.
  `handleSave` becomes `onSubmit(payload); onSaved();`.
- It calls `resolveDestinationRegion` with `activeZoneId: zoneId` and no `methodID`, so the
  regions resolve for a method that is not stored yet. Callers pass the zone's own id (not
  a URL string), so the helper's strict compare holds; the dialog resolves the zone with
  `String()` and passes `zone.id`.

*Alternative considered:* keep per-rule saves and show the Rules card only after the first
save. Rejected by the user: the design shows Rules in the Add dialog, and a dialog with
Cancel/Save must not store part of its content early.

### D3. Each list owns the open state

- `shipping-method.tsx`: `dialogState: { method: ShippingMethodData | null } | null`. Add
  sets `{ method: null }`, Edit sets `{ method: item }`. It passes
  `shippingZones={shippingZonesObj}` and `onSaved={setShippingZonesObj}`. `useNavigate`,
  `RouteConfig`, `uuid`, and `ShippingMethodRoute` are removed from this file.
- `use-shipping-settings.ts`: `handleEditMethod` keeps `confirmAction`; its action sets
  `editingMethod` and does not navigate. The hook returns `editingMethod` and
  `closeMethodDialog`. `shipping-settings.tsx` renders the dialog next to `RegionsDialog`.
  The list refreshes through the existing invalidation and the hook's `form.reset` effect.

### D4. Remove the route completely

Remove the route object, the lazy import, and the skeleton import from
`features/settings/routes.tsx`; remove `ShippingDeliveryMethod` from
`config/route-config.ts` (`ShippingZone` becomes a leaf); remove its two assertions from
`libs/route.test.ts`; delete the page and `shipping-delivery-method-skeleton.tsx`.

*Alternative considered:* keep the route and redirect to the zone screen. Not done: the
route is an admin SPA hash route, not a public surface (CLAUDE.md 4.3), and the request was
to remove it.

### D5. Test at the dialog level

New `features/settings/shipping/tests/components/shipping-method/shipping-method-dialog.test.tsx`,
in the style of `tests/pages/shipping-carrier.test.tsx`. It covers: edit shows the prop
values; add + save sends the zone with the method appended; a rule added in the dialog is
in the saved `shipping_rules`; Cancel sends nothing.

## Risks / Trade-offs

- [Rules are lost on Cancel, where they were stored immediately before] → This is the
  chosen behaviour; it is stated in the proposal and in the spec.
- [Old bookmarks to the method URL show not-found] → Accepted; admin-only route.
- [The dialog saves from the list's zone state, so a stale list can overwrite a concurrent
  change to another method] → Same exposure as the page, which also sent the full
  `shipping_zones`. No new risk.
- [Nested dialogs: the destination picker (`SelectDestinationPopup`) and the delete
  confirmation open above the method dialog] → Radix dialogs stack; confirm in the user's
  visual check.
- [The body can be tall (rate-by-weight rows + rules)] → `DialogBody` already scrolls
  (`overflowY: auto`, content `maxHeight: 85%`).
- [No browser verification in this project] → typecheck, lint, Vitest; the user does the
  visual check against the screenshot.

## Correction during implementation

- **No `isOpen` prop and no reset effect (D1).** The two lists mount the dialog only while
  it is open (the same pattern as `RegionsDialog` on the Shipping settings page). The form
  default values, the rules state, and the method id are set once at mount, so Cancel
  discards all input by unmount. The cost: the dialog has no close animation.
- **`ruleIndex` prop removed from the rule form card (D2).** The rules list knows the index
  and merges the rule itself; the card only returns the rule through `onSubmit`.
- **Rule test edits a rule (D5).** A new rule needs choices in the custom select controls,
  which are not practical to drive in jsdom. The test edits the value of an existing rule,
  confirms that no request is sent on the rule's Update, and confirms that the changed rule
  is in the request sent on Save. "Rules card shows for a new method" has its own test. A
  rule added from an empty form is not covered by an automated test.
- **Route test (D4).** The second removed assertion was replaced by a `buildLink` assertion
  for `ShippingZone`, to keep a nested `buildLink` case in `libs/route.test.ts`.

## Migration Plan

Frontend only; ships with the normal plugin build. Rollback is a revert of the change. No
data migration.
