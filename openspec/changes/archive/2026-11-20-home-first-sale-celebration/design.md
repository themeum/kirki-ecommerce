## Context

See proposal.md for the motivation and specs/home-first-sale/spec.md for the
behavior. Facts from the code that shape the approach:

- Home (`resources/app/features/home/pages/home.tsx`) has two modes: the setup
  checklist and the overview (`HomeSections`). Both render inside one
  `PageContent`, so one insertion point covers both modes.
- Per-store Home state already lives in one option,
  `kirki_ecommerce_setup_checklist`, read and written by
  `SetupChecklistService` through the framework `Option` facade
  (`Option::get` / `Option::set($name, $value, $autoload)`, keys are prefixed).
- Admin routes are grouped in `routes/api.php` under `AuthMiddleware` +
  `AdminMiddleware` (`manage_options`), next to `/setup-checklist` and
  `/dashboard/*`.
- `OrderListResource` already gives `customer_name`, `order_number`,
  `base_total_money_object` (display string in the store base currency).
  Archived orders have `archived_at` set.
- No fulfil page exists. `RouteConfig.Orders.get('OrderDetail')` builds the
  order detail link.
- The design's effect is ~120 lines of plain canvas code
  (`confetti()` in the design file, lines ~4945–5036) plus a small amount of
  CSS. It reads card rectangles with `getBoundingClientRect()`.

## Goals / Non-Goals

**Goals:**

- One server read gives the card and the celebration flags, so the browser
  does not decide visibility.
- The confetti code is a faithful port of the design file: same constants,
  same physics, same landing behavior.

**Non-Goals:**

- No change to the setup checklist, overview sections or Customize sheet.
- No hook into order status changes (the card ends only on the button click).
- No library for the confetti.

## Decisions

### D1. Storage: one option with per-user maps

`kirki_ecommerce_first_sale` (new `OptionKeys::FIRST_SALE = 'first_sale'`),
autoload off, written through `Option::set(..., false)`:

```php
[
    'done_at'    => null,                         // int|null, set by "Fulfill order"
    'celebrated' => [1 => 1794900000],            // user id => Unix time, first write kept
    'dismissed'  => [5 => 1794903700],            // user id => Unix time, emptied by "Fulfill order"
]
```

A missing or malformed option reads as the empty state, the same way
`SetupChecklistService::read()` does. "Fulfill order" writes `done_at` and
`dismissed = []` in one `Option::set`. Decided in the grill over one option per
user (clearing needs a `LIKE` query) and user meta (user asked for the options
table).

### D2. Service + controller, same shape as the setup checklist

`App\Services\FirstSaleService` owns the rules: `get_state(int $user_id)`,
`celebrate(int $user_id)`, `dismiss(int $user_id)`, `fulfill()`, and a
protected `first_order()` that runs
`Order::query()->where_null('archived_at')->order_by('created_at', 'asc')->order_by('id', 'asc')->first()`.
`App\Http\Controllers\Api\FirstSaleController` maps the routes. The current
user id comes from the framework's auth/user wrapper if it has one; otherwise
`get_current_user_id()` (check `themeum/framework` first, per CLAUDE.md §2a).

### D3. REST shape

All under the admin group:

| Method | Route | Does |
|---|---|---|
| `GET` | `/home/first-sale` | State for the current user |
| `POST` | `/home/first-sale/celebrated` | Records the current user as celebrated (keeps the first time) |
| `POST` | `/home/first-sale/dismiss` | Records the current user's close |
| `POST` | `/home/first-sale/fulfill` | Sets `done_at` (keeps the first time), clears `dismissed` |

Each returns the same shape:

```json
{
  "data": {
    "is_visible": true,
    "should_celebrate": true,
    "order": {
      "id": 12,
      "order_number": "#2026-2236",
      "customer_name": "Ibrahim Fischer",
      "base_total_money_object": { "raw": 43.88, "display": "£43.88", "currency": { "code": "GBP", "symbol": "£" } }
    }
  },
  "message": "..."
}
```

`is_visible` = order exists ∧ `done_at` null ∧ user not in `dismissed`.
`should_celebrate` = `is_visible` ∧ user not in `celebrated`. `order` is `null`
when no first order exists; when `is_visible` is false the order may still be
returned but the app ignores it. The order fields come from
`OrderListResource` so the money object matches Recent orders. A new
`/home/...` prefix is used rather than `/dashboard/...` because the card also
shows in checklist mode.

### D4. Admin app structure

- `features/home/schemas/catalog/first-sale.ts` – Zod schema for the response.
- `features/home/services/first-sale.ts` – `useFirstSaleQuery` plus three
  mutations. The mutations write the returned state into the query cache, so
  the card hides at once (optimistic set for dismiss; on error toast and keep
  it hidden, per spec).
- `features/home/components/first-sale-card.tsx` – the card (icon SVG and
  copy from the design's `firstWinCard()`), using the existing `Button`,
  `Text`, `Flex` and the card styles the overview cards use.
- `features/home/lib/confetti.ts` – the port of `confetti()`: a function
  `playConfetti({ cardEl, otherCardEls }): () => void` that returns a stop
  function. It creates the canvas, runs the loop, and removes itself. The
  "other card" pick uses elements marked with a data attribute on Home cards
  that are inside the viewport, as in the design.
- `features/home/hooks/use-first-sale-celebration.ts` – when the query says
  `should_celebrate`, after the card has mounted (one `requestAnimationFrame`
  so layout is ready, like the design's 60 ms delay), call
  `playConfetti`, then fire the `celebrated` mutation. A ref guards against a
  second start (React Strict Mode, refetch). The effect cleanup calls the stop
  function, which covers "leave Home" because the route unmounts Home.
- `pages/home.tsx` renders `<FirstSaleCard />` as the first child of
  `PageContent` in both modes.

The prototype's reduced-motion skip is **not** ported (grill decision: always
play). The CSS for the canvas and the badge pop goes in Emotion styles beside
the components.

### D5. Mark "celebrated" at start

The mutation fires right after `playConfetti` starts. If the request fails, the
celebration plays again on the next visit; no toast (it is not the merchant's
action).

## Risks / Trade-offs

- [Two admins write the option at the same moment and one write is lost] →
  The worst case is one admin seeing the confetti or the card once more. The
  write is a read-modify-write of a small array; accepted, no lock.
- [Existing stores with many orders get a "first sale" message about an old
  order] → Decided in the grill: everyone once. Documented in `docs/home.md`.
- [A deleted user stays in `celebrated` / `dismissed`] → Harmless; the maps
  stay small (admins only).
- [Confetti always plays with "Reduce motion" on] → Decided in the grill.
  Recorded in the doc's "Where this differs" section.
- [Canvas port drifts from the design] → Port the code with the same
  constants; keep the design's comments for the physics.
- [jsdom has no canvas] → Component and hook tests mock `playConfetti`; the
  physics helpers that are pure (`fly`, aim search) can be unit tested.

## Migration Plan

No migration. The option is created on the first write. Rollback: remove the
code; the leftover option is ignored. Development reset:
`wp option delete kirki_ecommerce_first_sale`.

## Corrections during implementation

- **Order number prefix.** The plan wrote the card text as `(#{order number})`.
  Stored order numbers already carry the store's order prefix (`#` by default,
  set in `StoreSetupService`), and Recent orders shows them as stored. The card
  does the same, so it never shows `##`. The spec text is updated.
- **Eager-load items.** `OrderListResource` reads `$this->items`, so the first
  order query loads `items` (`with('items')`), as `OrderService` does.
- **Current user id.** The framework `Http\Request::user_id()` wraps
  `get_current_user_id()`, so the controller type-hints the concrete request and
  uses it.
- **Landing cards.** The other landing spot is any element marked
  `data-home-card`: each overview section cell, and a wrapper around the setup
  checklist in checklist mode.
- **Canvas layer.** The canvas uses `theme.zIndex.fullscreen` (10000), which is
  above the WordPress admin menu, not the design's `90`.
- **Fulfill navigation.** The button sends the request and opens the order at
  once; it does not wait for the response. A failure still shows a toast.
- **Confetti test file.** The confetti test needs a DOM, so it is
  `tests/lib/confetti.test.tsx` (the `.test.ts` project runs in Node).

