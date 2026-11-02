## MODIFIED Requirements

### Requirement: Chart granularity

Chart points SHALL be grouped by the number of days in the range:

| Days in the range | One chart point |
|---|---|
| 1 to 14 | one day |
| 15 to 45 | 3 days |
| 46 to 186 | one week |
| 187 to 366 | one month |
| more than 366 | N months, with N = ceil(months in the range / 12) |

3-day groups SHALL start on the first day of the range. N-month groups SHALL
start on the first day of the month of the first day of the range. Weeks SHALL
start on the site's start-of-week day, and months on day 1. The first and last
point MAY be partial, and each point SHALL cover only days inside the range. The
response SHALL give the granularity (day, week or month) and the group
size (3 for 3-day groups, N for N-month groups, else 1).

The comparison series SHALL use the same granularity and group size, with its
groups starting on the first day of the comparison range, and SHALL be matched
to the current series by position.

Each point SHALL have a label with the first day of the point ("Oct 8" for days,
3-day groups and weeks; "Oct 2026" for months and N-month groups) and a span
label with the first and last day of the point ("Oct 8 – Oct 10, 2026"). A
one-day point SHALL have a span label with the day and year ("Oct 8, 2026").
Comparison points SHALL have the same two labels.

#### Scenario: 7-day range

- **WHEN** the range is Last 7 days
- **THEN** the chart has 7 points, one for each day

#### Scenario: 30-day range

- **WHEN** the range is Sep 19 to Oct 18, 2026
- **THEN** the chart has 10 points of 3 days, the first covering Sep 19 to Sep 21 with the label "Sep 19" and the span label "Sep 19 – Sep 21, 2026"

#### Scenario: Partial last 3-day group

- **WHEN** the range has 31 days
- **THEN** the chart has 11 points and the last point covers 1 day

#### Scenario: 90-day range

- **WHEN** the range is Last 90 days
- **THEN** each chart point is one week

#### Scenario: Partial first week

- **WHEN** weeks start on Monday and a weekly range starts on a Wednesday
- **THEN** the first point covers Wednesday to Sunday

#### Scenario: 12-month range

- **WHEN** the range is Last 12 months
- **THEN** each chart point is one month, with the label "Oct 2026" for October 2026

#### Scenario: Two-year range

- **WHEN** a custom range is Jan 1, 2025 to Dec 31, 2026
- **THEN** each chart point is 2 months, the first covering Jan 1 to Feb 28, 2025, and the chart has 12 points

#### Scenario: Comparison groups

- **WHEN** the range is Sep 19 to Oct 18, 2026 and the comparison is Previous year
- **THEN** the comparison points are 3-day groups starting on Sep 19, 2025
