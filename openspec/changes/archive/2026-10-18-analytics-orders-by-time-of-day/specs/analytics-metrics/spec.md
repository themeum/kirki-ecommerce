## ADDED Requirements

### Requirement: Orders by time of day

For a range, the system SHALL count the placed orders for each store-local
weekday (Monday to Sunday) and each store-local hour (0 to 23) of their order
date. The counts SHALL use the same placed orders as Orders, so the sum of all
the counts SHALL be equal to Orders for the same range. When a comparison
range is selected, the system SHALL also give the same counts for the
comparison range.

#### Scenario: Order late in the evening in a positive offset zone

- **WHEN** the site time zone is Asia/Dhaka (UTC+6) and an order is created at 2026-10-01 20:30 UTC, a Thursday in UTC
- **THEN** it counts under Friday at hour 2

#### Scenario: Half-hour offset

- **WHEN** the site time zone is Asia/Kolkata (UTC+5:30) and an order is created at 2026-10-05 12:45 UTC, a Monday
- **THEN** it counts under Monday at hour 18

#### Scenario: Failed order

- **WHEN** an order with payment status `failed` is created in the range
- **THEN** it does not count in any weekday or hour

#### Scenario: Comparison counts

- **WHEN** the comparison is Previous period, and one order is created in the comparison period on a Wednesday at 9:10 store time
- **THEN** the comparison count for Wednesday at hour 9 is 1
