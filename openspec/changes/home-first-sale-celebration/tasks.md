## 1. Backend: state, service and routes

- [x] 1.1 Add `OptionKeys::FIRST_SALE = 'first_sale'` in `app/Constants/OptionKeys.php`
- [x] 1.2 Create `app/Services/FirstSaleService.php` with `get_state(int $user_id)`, `celebrate(int $user_id)`, `dismiss(int $user_id)`, `fulfill()` and the oldest non-archived order query (design D1, D2, D3). Read/write through the `Option` facade with autoload off; tolerate a missing or malformed option; keep the first stored time on repeat calls
- [x] 1.3 Create `app/Http/Controllers/Api/FirstSaleController.php` returning `{ data, message }` with `OrderListResource` order fields; get the current user id through the framework if it wraps it (CLAUDE.md §2a)
- [x] 1.4 Register `GET /home/first-sale` and `POST /home/first-sale/{celebrated,dismiss,fulfill}` in the admin group of `routes/api.php`
- [x] 1.5 Add `tests/Integration/FirstSaleApiTest.php`: first-order choice (archived skipped, ties by id, deleted order falls back), visibility per admin, dismiss only affects one admin, fulfill clears all dismisses and hides for all, celebrated kept once, `should_celebrate` false when not visible, non-admin refused
- [x] 1.6 Verify: run the PHP integration tests and phpcs with the docker runner (see memory reference), then `npm run typecheck && npm test` in `resources/app/`

## 2. Admin app: data layer

- [x] 2.1 Add `HOME_FIRST_SALE*` endpoints in `resources/app/config/endpoints.ts`
- [x] 2.2 Add `features/home/schemas/catalog/first-sale.ts` (Zod v3) and a schema test under `features/home/tests/schemas/catalog/`
- [x] 2.3 Add `features/home/services/first-sale.ts`: `useFirstSaleQuery` and the celebrated, dismiss and fulfill mutations that write the returned state into the query cache (dismiss hides at once and stays hidden on error with a toast)
- [x] 2.4 Verify: `npm run typecheck && npm test` in `resources/app/`

## 3. Admin app: confetti port

- [x] 3.1 Port the design's `confetti()` to `features/home/lib/confetti.ts` as `playConfetti({ cardEl, otherCardEls }) => stop` with the same constants (150 pieces, six colors, gravity .32, drag .985, terminal 2.6, fixed 60 Hz steps, landers aimed by bisection, rest 3.2–5.6 s then tip), the fixed canvas (`pointer-events: none`, `aria-hidden`), resize handling and self-removal; no reduced-motion skip
- [x] 3.2 Unit test the pure parts (flight simulation / aim search) and that `stop()` removes the canvas and the resize listener (mock `getContext`)
- [x] 3.3 Verify: `npm run typecheck && npm test` in `resources/app/`

## 4. Admin app: card and celebration

- [x] 4.1 Add `features/home/components/first-sale-card.tsx`: squircle bag icon with the red dot pop (once on mount, again on hover), title, text with bold name and total and an order link, Fulfill order and Close buttons, `role="status"` and `aria-label="Your first sale"`; Fulfill fires the mutation and navigates to `OrderDetail` whether it succeeds or not (toast on error)
- [x] 4.2 Add `features/home/hooks/use-first-sale-celebration.ts`: when `should_celebrate`, start `playConfetti` after the card mounts, fire the celebrated mutation once (ref guard), stop on unmount; pass one other visible Home card as a landing spot via a data attribute
- [x] 4.3 Render `<FirstSaleCard />` first inside `PageContent` in both modes of `pages/home.tsx`
- [x] 4.4 Tests in `features/home/tests/`: card renders the copy and link; Close hides it and calls dismiss; Fulfill calls fulfill and navigates; no card when `is_visible` is false; celebration hook calls `playConfetti` and the celebrated mutation once, not when `should_celebrate` is false, and stops on unmount
- [x] 4.5 Verify: `npm run typecheck && npm run lint && npm test` in `resources/app/`

## 5. Docs

- [x] 5.1 Update `docs/home.md`: a "First sale" section (rules, card, celebration), the new option in Storage, the four routes and response in REST API, `wp option delete kirki_ecommerce_first_sale` in the development reset section, and "Where this differs from WooCommerce" notes (WooCommerce has no such card; old stores celebrate their oldest order; confetti ignores "Reduce motion")
- [x] 5.2 Verify: `npm run typecheck && npm test` in `resources/app/`, and ask the user to check the animation visually (no browser verification per CLAUDE.md §0)
