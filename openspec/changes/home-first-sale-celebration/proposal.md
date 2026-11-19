## Why

A merchant's first order is the most important moment of a new store, but Home
shows it only as one more row in Recent orders. The design file
("Kirki Analytics & Reports") marks the moment with a one-time confetti
celebration and a "You made your first sale!" card that leads the merchant to
fulfil the order. Each admin must see it once, and the team must be able to
end it for everyone when somebody starts to fulfil the order.

## What Changes

- New **first-sale card** at the top of the Home page content, in both Home
  modes (above the setup checklist, and above the overview sections). It shows
  when the store has at least one non-archived order. It names the oldest
  non-archived order (any payment or fulfillment status): customer name, total
  and order number, with a **Fulfill order** button and a **Close** (X) button.
- New **confetti celebration**: a full-screen canvas burst, ported exactly from
  the design file. It plays together with the card, once for each admin user.
  It plays also when the OS "Reduce motion" setting is on.
- **Close** hides the card for the admin who clicks it only.
- **Fulfill order** ends the feature for the store: the card hides for all
  admins, all close records are cleared, and the order detail page opens.
  Fulfilling the order from another page does not hide the card.
- The "celebrated" record is written when the confetti starts.
- New REST endpoints under `/home/first-sale` to read the state and to record
  "celebrated", "dismissed" and "fulfill clicked".
- New option `kirki_ecommerce_first_sale` (autoload off) that keeps the store
  state and the per-admin state.
- Stores that already have orders when they update to this version also show
  the card and the celebration once for each admin. This is a decided
  behavior change for existing stores (see Impact).
- Out of scope: the design's "before the first sale" card for stores with 0
  orders.

## Capabilities

### New Capabilities

- `home-first-sale`: the first-sale card, its per-admin and store-level
  visibility rules, the one-time confetti celebration, the storage of that
  state, and the REST endpoints that read and write it.

### Modified Capabilities

<!-- None. The card is added above the existing Home content; the existing
     merchant-home-page and merchant-home-dashboard requirements do not change. -->

## Impact

- **Backend:** new service, controller and routes (admin-only, same middleware
  as `/dashboard/*`); new `OptionKeys` constant; new integration test.
- **Admin app:** new components, service and schema in
  `resources/app/features/home/`; `pages/home.tsx` renders the card in both
  modes; new endpoint constants; new tests.
- **Docs:** `docs/home.md` gets a first-sale section, storage, REST and a
  development reset command.
- **Stored data (decided in the grill):** one new option,
  `kirki_ecommerce_first_sale`. No table or migration.
- **Default behavior for existing stores (decided in the grill):** after the
  update, every admin of a store that already has orders sees the card and the
  confetti once, and the card names the store's oldest non-archived order.
- **Backward compatibility:** no released surface is changed or removed. The
  routes, option and components are new.
