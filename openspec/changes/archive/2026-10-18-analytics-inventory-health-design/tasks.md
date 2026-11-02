## 1. Backend

- [x] 1.1 In `app/Services/AnalyticsQueryService.php`, in `build_inventory_health()`, add a tracked variant to the lowest list only when its status is `out_of_stock` or `low_stock`.
- [x] 1.2 In `tests/Integration/AnalyticsMetricsTest.php`, add a test that a tracked in-stock variant with 1 available and threshold 0 is not in `lowest`, and that every item in `lowest` has status `out_of_stock` or `low_stock`.
- [x] 1.3 Run `php -l`, phpcs, phpcs-wporg and phpcs-docblocks on the changed PHP files.

## 2. Frontend

- [x] 2.1 In `resources/app/features/analytics/components/cards/inventory-health-card.tsx`, show the 3 counts as equal tiles with a light background, the count in bold with the tone color (default for in stock) and the subdued status name under it.
- [x] 2.2 Show the variant list in a bordered box with dividers. Each row shows the product name, the subdued variant name, and a `StatusBadge` with "Out of stock" or "Low stock". Remove the quantity.
- [x] 2.3 Show a green dot with a repeating ripple (Emotion `keyframes`) before the live note. The dot is `aria-hidden`. Stop the ripple under `prefers-reduced-motion: reduce`.
- [x] 2.4 In `resources/app/features/analytics/tests/pages/analytics.test.tsx`, add tests: the tiles show the counts and labels, a row shows the product, the variant and an "Out of stock" badge without the quantity, and the list box does not show when `lowest` is empty.
- [x] 2.5 Run `npm run typecheck && npm test` and lint on the changed files from `resources/app/`.

## 3. Docs

- [x] 3.1 In `docs/analytics.md`, update the Inventory health row of the Cards table.
- [x] 3.2 Run `openspec validate analytics-inventory-health-design`.
