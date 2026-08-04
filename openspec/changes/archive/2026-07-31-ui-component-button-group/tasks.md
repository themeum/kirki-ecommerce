## 1. data-slot prerequisites

- [x] 1.1 Add `data-slot="button"` to native `<button>` render path in `resources/app/components/ui/button.tsx`
- [x] 1.2 Add `data-slot="button"` to `<Slot>` render path in `resources/app/components/ui/button.tsx` (asChild branch)
- [x] 1.3 Add `data-slot="select-trigger"` to `SelectPrimitive.Trigger` in `resources/app/components/ui/select.tsx`

## 2. ButtonGroup compound component

- [x] 2.1 Create `resources/app/components/ui/button-group.tsx` with `ButtonGroup` — forwardRef, `role="group"`, `data-slot="button-group"`, `orientation` prop, `cssOverride`, horizontal/vertical style maps
- [x] 2.2 Implement border/radius merge child selectors for buttons, inputs, text slots, and select triggers
- [x] 2.3 Implement nested group gap, input flex-1, focus z-index stacking, and select-trigger fit-content rules
- [x] 2.4 Add `ButtonGroupText` — forwardRef, `data-slot="button-group-text"`, `asChild` via Radix Slot, muted label styles
- [x] 2.5 Add `ButtonGroupSeparator` — wraps existing Separator with `data-slot="button-group-separator"`, default vertical orientation
- [x] 2.6 Export `{ ButtonGroup, ButtonGroupSeparator, ButtonGroupText }` and TypeScript prop types; set `displayName` on each

## 3. Verify

- [x] 3.1 Run linter on `button-group.tsx`, `button.tsx`, and `select.tsx` — fix any issues
- [x] 3.2 Manual spot-check: horizontal outline buttons merge borders/radii; vertical orientation stacks correctly; separator renders between split buttons
