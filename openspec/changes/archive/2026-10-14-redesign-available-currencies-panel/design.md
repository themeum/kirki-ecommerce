## Context

See proposal.md for motivation. Facts that shape the approach:

- `available-currency-list.tsx` wraps a header `Flex`, a `StackedItems` list and a status
  `Flex` in a grey `Card` (`cardStyles.innerCard`, `surfaceAlt` background).
- `StackedItem` (`components/ui/stacked-items.tsx`) gives each row `role="listitem"`, a
  fixed `height: 34px`, a hover background, a 28px size for every non-switch button,
  and the hover swap between `[data-right-text]` and `[data-action-group]`. It needs a
  unique `id`. Rows are separated by a bottom border on all but the last item.
- `useAvailableCurrencyList` already reads `last_sync_at` and `next_sync_at` from the
  form with `useWatch`. After `automatic-exchange-rate-sync`, the form also has
  `is_automatic_update_enabled`, `last_sync_error` and `last_sync_error_at`.
- `dateFormatter(value, 'relative')` uses `formatDistanceToNow(..., { addSuffix: true })`,
  so it returns "2 minutes ago" or "in 58 minutes".
- The provider name lives in `ApiConfig` (`useCurrencyExchangeProvidersQuery` + id
  lookup). The query is cached by TanStack Query, so a second consumer costs nothing.

## Goals / Non-Goals

**Goals:**
- Match the screenshot with existing components and theme tokens, with no layout shift
  on hover.
- Keep the footer-state choice in a pure, unit-tested function.

**Non-Goals:**
- Any change to `StackedItems` itself.
- Any behaviour change to rows, actions, saving or syncing.
- Changes to the Automatic Updates card (other than what change A does).

## Decisions

**Header and footer are `StackedItem`s with style overrides.**
- Use `id="header"` and `id="footer"`. Override with `cssOverride`: `height: 'auto'`,
  no hover background, header padding to align the title with row text.
- The "Sync now" button keeps `variant="ghost"`, gets the brand/link text color, and
  overrides the 28px button size from the row styles so the label fits.
- Footer text wraps; `height: auto` and `minHeight` equal to the row height avoid a
  jump when the message changes length.
- *Alternative rejected:* header and footer outside `StackedItems` with their own
  borders. The user asked for them as stacked items, and the component already draws
  the border and dividers.

**Row content.**
- `StackedItemMedia`: symbol. `StackedItemTitle`: code (`Text` small, medium weight),
  name (`Text` small, `color="secondary"`), then badges: base → `Badge variant="info"`
  with "Base Currency"; inactive → `Badge variant="destructive"` with "Inactive".
- Inactive row: `color="subdued"` on symbol, code and name. The rate `Text` is not
  rendered at rest; the `CurrencyRowActions` hover group still renders, so hover shows
  the menu and input as today.
- Base row: right-aligned "1.00" in primary text, no actions.

**Footer state is a pure function.**
- `getSyncStatus(input) → { tone: 'default' | 'warning', message: string }` in
  `lib/currency-list.tsx`. Input: `apiProvider`, `providerName`, `hasApiKey`,
  `isAutomaticUpdateEnabled`, `lastSyncAt`, `nextSyncAt`, `lastSyncError`,
  `lastSyncErrorAt`, and `now` for testable relative times.
- Order: no provider → no key → on + error → on → off + configured (spec order).
- Each message is built from separate translatable sentences joined with a space, so
  an empty time drops its sentence cleanly (for example
  `sprintf(__('Last sync: %s.'), relative)`).
- `useAvailableCurrencyList` calls it and returns `syncStatus` in place of
  `showApiProviderStatus`; it reads the provider name through
  `useCurrencyExchangeProvidersQuery`.
- *Alternative rejected:* inline conditionals in JSX. Five states with optional parts
  are hard to read and cannot be unit tested without rendering.

**Container.**
- `StackedItems` gets `data-search-id="currency.available-currencies"` and the existing
  `data-search-keywords`, so settings search keeps finding the panel.

## Risks / Trade-offs

- **[Risk]** The 28px button rule in `StackedItem` row styles squeezes "Sync now". →
  Override `width: 'auto'` and padding on that button only.
- **[Risk]** Relative times do not tick while the page stays open. → Same as today's
  indicator; the footer updates after any refetch.
- **[Risk]** Applying this change before `automatic-exchange-rate-sync` gives wrong
  states (toggle always false, no error keys). → Proposal states the order; tasks start
  with a check.
- **[Trade-off]** `formatDistanceToNow` output is English-only (no date-fns locale). →
  Same as today's indicator; out of scope.
