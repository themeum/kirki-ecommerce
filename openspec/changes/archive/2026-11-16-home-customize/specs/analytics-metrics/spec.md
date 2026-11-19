## MODIFIED Requirements

### Requirement: Date range presets

The date range SHALL be one of: Today, Yesterday, Last 7 days, Last 30 days
(default), Last 90 days, Last 12 months, Month to date, Year to date, Week to
date, All time, or a custom start and end day. "Today" SHALL be today in the
request time zone. "Last N days" SHALL end today and include N days. "Last 12
months" SHALL start on the day after the same date one year ago. "Week to date"
(`week_to_date`) SHALL start on the first day of the current week, as set by the
site's `start_of_week` day, and SHALL end today. "All time" (`all_time`) SHALL
start on the day, in the request time zone, of the store's first order of any
status, and SHALL end today; when the store has no orders, it SHALL be today
only. For All time, the comparison SHALL be No comparison, whatever comparison
the request asks for. A custom range SHALL NOT end after today. The Analytics
page date control SHALL NOT offer Week to date or All time.

#### Scenario: Last 30 days

- **WHEN** today is Oct 14, 2026 and the preset is Last 30 days
- **THEN** the range is Sep 15 – Oct 14, 2026

#### Scenario: Last 12 months

- **WHEN** today is Oct 14, 2026 and the preset is Last 12 months
- **THEN** the range is Oct 15, 2025 – Oct 14, 2026

#### Scenario: Week to date with a Monday week start

- **WHEN** `start_of_week` is 1 (Monday), today is Wednesday Nov 18, 2026 and the preset is Week to date
- **THEN** the range is Nov 16 – Nov 18, 2026

#### Scenario: Week to date on the first day of the week

- **WHEN** `start_of_week` is 0 (Sunday), today is Sunday Nov 15, 2026 and the preset is Week to date
- **THEN** the range is Nov 15 – Nov 15, 2026

#### Scenario: All time

- **WHEN** the store's first order was created on Mar 3, 2025, today is Nov 18, 2026 and the preset is All time
- **THEN** the range is Mar 3, 2025 – Nov 18, 2026, and the response has no comparison

#### Scenario: All time with no orders

- **WHEN** the store has no orders and the preset is All time
- **THEN** the range is today only and every metric is 0
