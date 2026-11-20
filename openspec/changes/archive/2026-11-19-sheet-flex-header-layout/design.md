## Context

`components/ui/sheet.tsx` is a Radix Dialog wrapper. `useSheetFloat` (in
`components/ui/use-sheet-float.ts`) owns the drag, dock, clamp and localStorage
logic, and the Sheet root shares it through `SheetFloatContext`. Today:

- The Sheet root takes `floatable?: { storageKey: string }` and calls
  `useSheetFloat(floatable?.storageKey)`.
- SheetContent renders the dock button (`PanelRight`) and the close button
  (`X`) with `position: absolute`.
- SheetHeader renders the `Move` icon with `position: absolute`, and adds
  `paddingLeft: spacing[12]` / `paddingRight: spacing[12] * 2` to make room.
- Header and footer have `16px 24px` padding and a border. Callers
  (`customize-home-sheet.tsx`, `customize-sheet.tsx`) pad their own body `div`
  with `16px 24px`.
- The floating style uses `maxHeight: calc(100vh - FLOAT_MARGIN * 2)`.

Only two features and `sheet.test.tsx` use the Sheet.

## Goals / Non-Goals

**Goals:**
- Header buttons and the move icon laid out by flex, with no absolute position.
- One place for the panel padding (SheetContent), and one part for the lines.

**Non-Goals:**
- No change to `useSheetFloat` behavior (drag threshold, clamp, storage shape).
- No new icons: the dock button keeps `PanelRight`, the handle keeps `Move`.
- No new `SheetBody` part. Callers keep their own scrolling body `div`.

## Decisions

### 1. `floating` boolean plus `storageKey`

`<Sheet floating storageKey="...">`. The root calls
`useSheetFloat(floating ? storageKey : undefined)` and provides the context
only when `floating` is true, so the hook keeps its current input.
`storageKey` is required when `floating` is true; use a discriminated union
type (`{ floating: true; storageKey: string } | { floating?: false; storageKey?: never }`)
so TypeScript rejects `floating` without a key.

- Alternative: always-floating or controlled mode. Rejected in the grill:
  the current drag-to-float and remembered state stay.

### 2. SheetHeader renders the action group

SheetHeader renders:

```
<div header (flex, space-between, align start)>
  <div title group (flex, gap, minWidth 0)>
    {float.enabled && <Move/>}
    <div (flex column, rowGap 4px)>{children}</div>
  </div>
  <div action group (flex, gap, flexShrink 0)>
    {float.floating && <Button "Dock to the right" PanelRight/>}
    <SheetPrimitive.Close asChild><Button "Close" X/></SheetPrimitive.Close>
  </div>
</div>
```

The children keep their current column layout (title above description), so
the title group wraps it in a column. SheetHeader reads `floating` and `dock`
from `SheetFloatContext`, which it already reads for `startDrag`.
`startDrag` already ignores pointer-downs on buttons
(`INTERACTIVE_SELECTOR`), so the buttons inside the draggable header still
work.

SheetContent stops rendering both buttons. The `floating` value that
SheetContent computes (`float.floating && side === 'right'`) must also gate the
dock button in the header; put that combined value in the context consumer, or
compute it in SheetHeader the same way, so a non-right floating sheet never
shows a dock button.

- Alternative: keep X in SheetContent when there is no header. Rejected in
  the grill: it needs extra state to detect a header, and all sheets have one.

### 3. Padding and gap on SheetContent

`styles.content` gets `padding: spacing[4]` and `gap: spacing[4]`. Header and
footer styles drop their padding, `paddingRight` and border. The draggable
header drops its padding overrides. The floating style keeps
`overflow: hidden`; the body `div` scrolls with `flex: 1 1 auto`,
`minHeight: 0`, `overflowY: auto`.

### 4. `SheetSeparator`

```tsx
const SheetSeparator = (props: SheetSeparatorProps) => (
  <Separator negativeMargin={16} {...props} />
);
```

Typed from `ComponentPropsWithoutRef<typeof Separator>` without
`negativeMargin`. The `16` matches `spacing[4]`; the existing Separator takes a
number of pixels. With the content gap, no margins are needed.

- Alternative: separators built into SheetHeader and SheetFooter. Rejected in
  the grill: callers place them.

### 5. Floating max height

`maxHeight: min(720px, calc(100vh - ${FLOAT_MARGIN * 2}px))`. Put `720` in a
named constant next to the styles.

## Risks / Trade-offs

- [A body with negative-margin children or a full-bleed list now sits inside
  16px padding] → Only two callers exist; both get updated and checked.
- [The scrolling body's scrollbar now sits 16px from the panel edge, not at the
  edge] → Accepted; this is what the 16px content padding means. The user
  should check this visually.
- [A sheet without SheetHeader has no close button] → All current sheets have
  a header; Escape and the overlay still close it. The spec states it.
- [`sheet.test.tsx` "follows a controlled open state" renders no SheetHeader
  and selects "Close"] → Update the test to wrap its title in a SheetHeader.
- [The header test helper `dragHeader` uses `getByText(...).parentElement` as
  the header] → The title is now nested one level deeper; update the helper to
  find the `[data-draggable]` element, or the drag lands on the wrong node.
