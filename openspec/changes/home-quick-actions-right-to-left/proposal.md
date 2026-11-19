## Why

The Home header puts the main quick action at the right-most position, but it
puts the other checked actions from left to right in list order. With 3
checked actions [A, B, C], the header shows B, C, A. The order goes in 2
directions, so the sheet order and the header order do not agree.

## What Changes

- The Home header shows all checked quick actions in one direction: from right
  to left in list order. The first checked action (the main button) is the
  right-most button, the second checked action is to its left, and the third
  checked action is the left-most button. With [A, B, C], the header shows
  C, B, A.
- The primary and secondary button styles do not change.
- The sheet, the saved layout and the "Main button" note do not change.

## Capabilities

### New Capabilities

### Modified Capabilities
- `home-customize`: the "Quick actions" requirement changes the position of
  the secondary buttons from "in list order, to the left of it" to "from right
  to left in list order".

## Impact

- `resources/app/features/home/components/quick-actions.tsx`: the render order
  of the buttons.
- A new component test for the button order.
- No change to stored data, REST API or PHP. The quick actions are not on
  `origin/main`, thus no released surface changes.
