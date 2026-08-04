## Why

The admin UI lacks a compound component for visually connected button groups (split buttons, segmented actions, input+button combos). shadcn v4 ships a `ButtonGroup` primitive, and the codebase already ports shadcn patterns with Emotion (see `input-group.tsx`). Adding `ButtonGroup` closes that gap without introducing Tailwind/CVA.

## What Changes

- Add `resources/app/components/ui/button-group.tsx` with three named exports: `ButtonGroup`, `ButtonGroupSeparator`, `ButtonGroupText`
- Implement shadcn v4 behavior in Emotion: orientation (horizontal/vertical), border/radius merging on adjacent children, nested group spacing, focus z-index stacking, input flex-1, select-trigger fit-content
- Add `data-slot="button"` to [`button.tsx`](resources/app/components/ui/button.tsx) (native button + Slot branch)
- Add `data-slot="select-trigger"` to [`select.tsx`](resources/app/components/ui/select.tsx) `SelectTrigger`
- No changes to existing [`action-group.tsx`](resources/app/components/ui/action-group.tsx) consumers — ActionGroup remains for spaced toolbar actions

## Capabilities

### New Capabilities

- `button-group`: Compound UI primitive for grouping related buttons and controls with merged borders/radii, following shadcn v4 API and Emotion styling conventions.

### Modified Capabilities

(none — no existing main specs cover this component)

## Impact

- **New file**: `resources/app/components/ui/button-group.tsx`
- **Minor edits**: `button.tsx`, `select.tsx` — additive `data-slot` attributes only
- **Dependencies**: Reuses existing `Separator`, `@radix-ui/react-slot`, theme tokens, `scopedMerge`/`defineStyles`
- **Unchanged**: ActionGroup, molecules exports, existing call sites (component-only delivery)
