## Why

`AnalyticsRangeResolver::today()` runs the `kirki_ecommerce_analytics_today`
filter. Only the analytics tests use it, to set a fixed "today". It has no use
for stores: the Custom range already shows any past period. Also, any plugin
can use it to change "today" for the analytics of the whole site.

## What Changes

- Remove the filter from `AnalyticsRangeResolver::today()`. "Today" is always
  the current date in the time zone of the browser.
- `SeedsAnalyticsData::freeze_today()` puts a resolver with a fixed date into
  the container (`app()->instance()`), not a filter.
- Remove the developer note about the filter from `docs/analytics.md`.

The owner accepts that this removes a released filter without a deprecation,
because no store or extension uses it.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None. No main spec names the filter, so `skip_specs: true`.

## Impact

- `app/Services/AnalyticsRangeResolver.php`
- `tests/Support/SeedsAnalyticsData.php`, `tests/Integration/AnalyticsMetricsTest.php`
- `docs/analytics.md`
