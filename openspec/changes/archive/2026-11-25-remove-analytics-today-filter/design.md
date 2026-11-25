## Context

Code always gets the resolver from the container:
`AnalyticsQueryService::__construct(AnalyticsRangeResolver $range_resolver, ...)`
(autowired) and `AnalyticsMetricRequest` (`app()->make(AnalyticsRangeResolver::class)`).
Neither service is a singleton. `Container::resolve()` returns
`$this->instances[$name]` first, so an instance bound with `app()->instance()`
reaches both callers.

Six test classes use `SeedsAnalyticsData`. Their `setUp()` calls
`reset_analytics_state()`, which calls `freeze_today()`. Four tests call
`freeze_today()` again with a different date.

## Decisions

**1. A fixed-date subclass in the trait.** `freeze_today($date)` binds an
anonymous subclass of `AnalyticsRangeResolver` whose `today()` returns
`$date`. It is the same seam as the filter, but only test code can use it.
- *Alternative: inject a clock into the resolver.* That is more code for one
  call site. Rejected.

**2. Remove the instance after each test.** WordPress test cases reset hooks
after each test, so the filter never stayed. A container instance stays until
someone removes it. The trait gets a `tearDown()` that calls
`app()->forget_instance(AnalyticsRangeResolver::class)` and then
`parent::tearDown()`. `AnalyticsMetricsTest` has its own `tearDown()`, which
hides the trait's method, so it calls `forget_instance` itself.

## Risks / Trade-offs

- [A future test class that uses the trait and has its own `tearDown()` keeps
  the fixed date.] → The `freeze_today()` docblock says to forget the
  instance in such a `tearDown()`.
