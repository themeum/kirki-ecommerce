## Why

The Sheet header places the move icon, the dock button and the close button
with absolute positions. The header then needs fixed side padding to make room
for them, and the title can go under the buttons. The floating option is also
an object (`floatable={{ storageKey }}`), although its only real input is the
storage key. A flex header and a simpler prop make the Sheet easier to read and
to reuse.

## What Changes

- **BREAKING (internal)**: The Sheet root takes a boolean `floating` prop and a
  separate `storageKey` prop, in place of `floatable={{ storageKey }}`. Drag to
  float, dock and the remembered position work as they do now.
- SheetHeader puts its content in two flex groups with space between them: a
  title group (move icon when floating is on, then the children) and an action
  group (dock button while the sheet floats, then the close button). No part of
  the header uses absolute position.
- SheetHeader renders the close button. SheetContent does not render buttons.
- SheetContent gets 16px padding and a 16px gap between its children.
  SheetHeader and SheetFooter have no padding and no border.
- A new `SheetSeparator` part draws a full-width line across the 16px content
  padding. Callers put it between the header and the body, and between the
  body and the footer.
- A floating sheet is at most 720px high, and never taller than the screen
  minus the float margin.
- The home and analytics customize sheets move to the new API and layout.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `sheet-primitive`: the parts list adds a separator; the close button moves
  into the header; the style requirement describes the padding, gap and flex
  header; the floating requirement gets the 720px height limit and the new
  header layout.

## Impact

- `resources/app/components/ui/sheet.tsx` (Sheet, SheetContent, SheetHeader,
  SheetFooter, new SheetSeparator, styles).
- `resources/app/components/ui/sheet.test.tsx` (new prop, close button now in
  the header).
- `resources/app/features/home/components/customize-home-sheet.tsx` and
  `resources/app/features/analytics/components/customize-sheet.tsx` (new prop,
  separators, body padding removed).
- No released public surface: the Sheet is an internal admin React component.
  No stored data changes; the localStorage keys and value shape stay the same.
