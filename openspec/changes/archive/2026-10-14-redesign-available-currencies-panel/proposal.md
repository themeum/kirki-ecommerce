## Why

The Available Currencies panel does not match the new design: the header and status
sit outside the list in a grey card, rows show only the currency name, and the status
line appears only after a sync. Administrators cannot see at a glance whether automatic
updates are connected, off, or failing.

## What Changes

- The panel becomes one bordered stacked list (`StackedItems`, outline variant). The
  grey card wrapper is removed. Settings search attributes move to the list.
- The first row is a header: "Available Currencies" and, when there is more than one
  currency, a "Sync now" button.
- Currency rows show symbol, code, name and badges ("Base Currency", "Inactive"). The
  base row shows rate 1.00 with no actions. Inactive rows are subdued and hide the rate
  at rest. Hover behaviour (menu and inline rate input) does not change.
- The last row is a status footer, shown only when there is more than one currency. It
  shows one of five messages: no provider; provider without API key; connected with
  automatic updates off; connected with automatic updates on; last automatic sync
  failed.
- No change to save, discard, add currency, sync, or row actions. No backend change.
- Depends on `automatic-exchange-rate-sync` for the toggle, a true `next_sync_at`, and
  `last_sync_error` / `last_sync_error_at`. Apply that change first.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `multi-currency-settings`: The "Last synced indicator" requirement is replaced by a
  panel layout requirement and a sync status footer with five states.

## Impact

- React: `features/settings/multi-currency/pages/available-currency-list.tsx`,
  `hooks/use-available-currency-list.ts`, `lib/currency-list.tsx` (pure footer-state
  function), and a new test under `features/settings/multi-currency/tests/lib/`.
- New translatable strings for the footer messages.
- Docs: `docs/currencies.md` quick start.
