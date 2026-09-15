## Why

The shipping zones list presents every zone collapsed, so a merchant arriving at Shipping
settings sees only zone titles and must expand each one to learn which delivery methods it
offers — the thing they came to check. The same header also buries the common action (edit)
inside a three-dots menu while the rare one (activation) occupies the prime inline slot.

## What Changes

- Every shipping zone renders expanded on load. Collapsing stays available per zone, but is
  a view preference for the current visit only — it is not remembered across reloads.
- A zone's destinations are summarized as country flags in the zone header, capped at three
  with a `+N` overflow count. The destination badge card inside the expanded body is removed,
  so the body carries only the delivery methods.
- The zone header's enable/disable switch is removed. Activation moves into the three-dots
  menu as a single Activate/Deactivate item; that menu now holds exactly Activate/Deactivate
  and Delete.
- Edit becomes a direct control in the zone header, in the position the switch occupied. It
  is present on every zone regardless of enabled state, and its behavior — the unsaved-changes
  confirmation followed by navigation to the zone screen — is unchanged.
- The zone's delivery methods render through the shared row-stack primitive instead of this
  page's own bespoke row component, so they match the method list already shown on the zone
  detail screen. Each method keeps all three of its hover actions: delete, edit, and its own
  enable/disable switch.
- The page's private method-row component is deleted; the shared primitive replaces it.

No breaking changes: no request payload, schema, or stored settings shape is touched.

## Capabilities

### New Capabilities

None. This change modifies how an existing capability is presented; it introduces no new
capability.

### Modified Capabilities

- `shipping-settings`: adds requirements covering how zones are listed — that zones are
  listed expanded and can be collapsed, that a zone's destinations are summarized in its
  header rather than repeated in its body, and that a zone's edit action is reachable
  without opening a menu while activation and deletion live inside it.

`stacked-items` gains a new consumer but no new requirement: the primitive is used exactly
as specified, with alignment handled through its existing style-override prop rather than
by changing the primitive.

## Impact

All affected code is in the React admin UI (`resources/app/`); no PHP, REST, or database
change.

- `features/settings/shipping/pages/shipping-settings.tsx` — the zone list itself
- `features/settings/shipping/pages/shipping-zone-actions.tsx` — switch removed, edit
  exposed, menu reshaped
- `components/option-accordion.tsx` — gains one additive optional prop for the header
  adornment; its three other consumers (admin email, customer email, currency API config)
  are unaffected
- `features/settings/shipping/pages/shipping-method-row.tsx` — deleted (this page is its
  only consumer)

Reused as-is, with no modification: the `use-shipping-settings` hook and every handler it
already exposes, `getSelectedRegionTags`, `getShippingZoneSummary`,
`shippingMethodIconMap`, `getShippingMethodSubText`, `getShippingMethodRightText`, and the
`stacked-items` primitive.

Not covered by automated tests: this repo's Vitest suite is scoped to form schemas and lib
functions, and no schema changes here, so typecheck and lint are the automated gate and the
visual result needs a human look in wp-admin.
