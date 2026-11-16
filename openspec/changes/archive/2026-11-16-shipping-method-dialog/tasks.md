All paths are below `resources/app/`. Run commands from `resources/app/`.

## 1. Dialog and controlled rules

- [x] 1.1 Make `features/settings/shipping/components/shipping-method/shipping-rules/shipping-rule-form-card.tsx` controlled: replace the `methodId` prop with `zoneId` and `onSubmit(rule)`; remove `useParams`, `updateSettings`, the query invalidation, the toast, and the server-error branch; call `resolveDestinationRegion` with `activeZoneId: zoneId` and no `methodID`; remove imports that become unused (design D2)
- [x] 1.2 Make `features/settings/shipping/components/shipping-method/shipping-rules/shipping-rules.tsx` controlled: props `{ zoneId, rules, onChange }`; remove `useParams`, the local rules state and its sync effect, and `saveShippingZones`; add/edit through `mergeRuleIntoMethodRules`, delete through `onChange` after the existing confirmation (design D2)
- [x] 1.3 Create `features/settings/shipping/components/shipping-method/shipping-method-dialog.tsx` with the props, reset-on-open, rules state, save, error mapping, and Cancel behaviour of design D1; move the form fields, `methodTypeOptions`, and `methodSettingsByType` from `pages/shipping-delivery-method.tsx`; titles "Add Shipping Method" / "Edit Shipping Method"; footer Cancel (`outline`) and Save (`primary`, `loading`)
- [x] 1.4 Remove the page: delete `features/settings/shipping/pages/shipping-delivery-method.tsx` and `features/settings/shipping/skeletons/shipping-delivery-method-skeleton.tsx`; remove the route object, the lazy import, and the skeleton import from `features/settings/routes.tsx`
- [x] 1.5 Verify: `npm run typecheck && npm test`

## 2. Open the dialog from the lists and remove the route config

- [x] 2.1 `features/settings/shipping/components/shipping-method/shipping-method.tsx`: add the dialog open state, open it from Add and Edit, render `ShippingMethodDialog` with `onSaved={setShippingZonesObj}`; remove `useNavigate`, `RouteConfig`, `uuid`, and `ShippingMethodRoute` (design D3)
- [x] 2.2 `features/settings/shipping/hooks/use-shipping-settings.ts`: `handleEditMethod` sets `editingMethod` inside `confirmAction` and does not navigate; return `editingMethod` and `closeMethodDialog` (design D3)
- [x] 2.3 `features/settings/shipping/pages/shipping-settings.tsx`: render `ShippingMethodDialog` for `editingMethod` next to `RegionsDialog`
- [x] 2.4 Remove `ShippingDeliveryMethod` from `config/route-config.ts` and its two assertions from `libs/route.test.ts`; confirm with a search that no reference to `ShippingDeliveryMethod` or `shipping-delivery-method` remains
- [x] 2.5 Verify: `npm run typecheck && npm test`

## 3. Test and final checks

- [x] 3.1 Add `features/settings/shipping/tests/components/shipping-method/shipping-method-dialog.test.tsx`: edit shows the prop values; add + Save sends the zone with the new method appended; a rule added in the dialog is in the saved `shipping_rules`; Cancel sends no request (design D5) — the rule test edits an existing rule and does not add a new one (see design.md, Correction during implementation)
- [x] 3.2 Run `npm run lint` and correct each finding in the changed files
- [x] 3.3 Verify: `npm run typecheck && npm test`
- [x] 3.4 Tell the user which visual checks stay for them (no browser preview in this project): Add and Edit from the zone screen, Edit from the Shipping settings page, each method type, rule add / edit / delete, the destination picker above the dialog, Cancel discards
