## 1. Remove the filter

- [x] 1.1 `app/Services/AnalyticsRangeResolver.php`: make `today()` return `Date::now(client_timezone())->to_date_string()` only, remove the filter line from its docblock, and remove the `FilterHook` import
- [x] 1.2 `tests/Support/SeedsAnalyticsData.php`: make `freeze_today()` bind a fixed-date subclass with `app()->instance(AnalyticsRangeResolver::class, ...)`, add a `tearDown()` that forgets the instance, and change the class docblock
- [x] 1.3 `tests/Integration/AnalyticsMetricsTest.php`: add `app()->forget_instance(AnalyticsRangeResolver::class)` to its `tearDown()`
- [x] 1.4 `docs/analytics.md`: remove the developer note about the filter
- [x] 1.5 Verify: `grep -rn analytics_today app tests docs` finds nothing; run the six analytics test classes, then `bash kirki-ecommerce-test integration`; run `composer phpcs:docblocks` and the `phpcs:hooks` sniff on the changed `app/` file; then `npm run typecheck && npm test` in `resources/app/`
