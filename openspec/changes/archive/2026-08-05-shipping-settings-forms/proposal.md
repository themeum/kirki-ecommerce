# Improve the shipping settings pages

## Why

The `settings-layout-shell` change converted the three shipping route shells to the new
settings layout, and `zod-first-type-declarations` converted the shipping *dialogs* to the
canonical form-schema pattern — but the shipping **zone page**, the **method detail page**,
and its three method sub-forms were never migrated. They still hold merchant input in
untyped `useState<Record<string, unknown>>` mutated through `handleOnChange(value, key)`,
built from raw `<Input>`/`<Checkbox>`/`<Textarea>` rather than the shared form fields.

The consequence is not cosmetic: **a merchant can save a shipping method with no name, no
rate, and empty weight ranges, and no field ever reports an error.** Failures surface only
as a toast after the request round-trips. These are the last forms in the settings area
with no validation and no field-level error reporting.

## What Changes

- **Shipping method form gains validation.** A new `shipping-method-form.ts` schema models
  the three method types (`flat_rate`, `local_pickup`, `weight`) in one shape, with
  per-type conditional requirements via `requiredWhen()`. It replaces the ad-hoc
  `METHOD_SCHEMAS` / `sanitizeByMethodType` pair in `shipping-settings/utils.tsx`.
- **Shipping zone form gains validation.** A new `shipping-zone-form.ts` covers the zone
  title and its regions, replacing the hand-rolled `FormErrors` + `normalizeErrors` block.
- **Two new shared form fields.** `RegionsField` (type-to-search destination picker with
  chips and an empty state) and `WeightRangeField` (repeatable from/to/rate rows backed by
  `useFieldArray`) — both following the existing `components/form/*` field template.
- **The method pages and zone page are rebuilt on React Hook Form**, reading the shared
  field components from form context like every other migrated settings section.
- **The shipping rule builder moves from a modal to an inline card** on the method page,
  reusing the existing `ShippingRuleFormSchema` unchanged.
- **The saved rule list renders translated labels** instead of raw enum keys — merchants
  currently see `product_category` and `is` in the UI.
- **Five defects fixed**: the `product_categories` / `product_category` condition-key
  mismatch that leaves the Product Category dropdown permanently empty; the
  `has_fee || true` expression that prevents the pickup-fee checkbox from ever loading
  unchecked; `saveShippingZones` still spreading the whole settings blob into its PUT;
  the unreachable `shipping/delivery-method/:methodId/:zoneId` route; and an
  argument-less `sprintf` in the rule list.

Not in scope: the "Shipping Careers" section shown in the design (no API, no data model),
the Shipping Simulator, and the Shipping Solution section.

## Capabilities

### New Capabilities

- `shipping-settings`: how a merchant defines shipping zones, the delivery methods within
  a zone, and the conditional rules that adjust a method's price — covering what each form
  requires, how per-method-type validation behaves, and what reaches the server on save.

### Modified Capabilities

None. `form-schema-contract` already requires explicit payload declarations, conditional
validation, and a payload test per form; this change brings two more forms into compliance
with it rather than changing what it requires.

## Impact

**New files**
- `resources/app/components/form/regions-field.tsx`
- `resources/app/components/form/weight-range-field.tsx`
- `resources/app/schemas/forms/shipping-method-form.ts` + `.test.ts`
- `resources/app/schemas/forms/shipping-zone-form.ts` + `.test.ts`
- `resources/app/pages/settings/shipping-settings/shipping-method/shipping-rules/shipping-rule-form-card.tsx`

**Rewritten**
- `shipping-zone/shipping-zone.tsx`, `shipping-method/shipping-delivery-method.tsx`
- `shipping-method/flat-rate-settings.tsx`, `local-pickup-settings.tsx`, `rate-by-weight-settings.tsx`
- `shipping-method/shipping-rules/shipping-rules.tsx`

**Modified**
- `shipping-settings.tsx` (badge/subtext wiring, i18n fixes), `shipping-settings/utils.tsx`
  (condition key, `saveShippingZones` payload, `METHOD_SCHEMAS` removal), `routes.tsx`
  (dead route)

**Deleted**
- `shipping-method/shipping-rules/shipping-rule-dialog.tsx`, once the inline card replaces it

**Unchanged by design**
- `shipping-settings-form.ts` keeps `shipping_zones: z.array(z.record(z.any()))`. The
  zone/method/rule forms are standalone schemas whose payloads are written into that loose
  blob, exactly as `shipping-rule-form.ts` already does — preserving the decision recorded
  in `zod-first-type-declarations` task 4.6.
- No backend/PHP changes. The shipping settings REST contract is untouched; this is
  entirely admin-UI form modeling.
