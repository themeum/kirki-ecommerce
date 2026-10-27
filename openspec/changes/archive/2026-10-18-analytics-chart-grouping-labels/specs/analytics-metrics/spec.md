## MODIFIED Requirements

### Requirement: Chart granularity

Chart points SHALL be grouped by the number of days in the range:

| Days in the range | One chart point |
|---|---|
| 1 to 31 | one day |
| 32 to 186 | one week |
| more than 186 | one month |

Weeks SHALL start on the site's start-of-week day, and months on day 1. The
first and last point MAY be partial, and each point SHALL cover only days inside
the range. The response SHALL give the granularity (day, week or month). Every
point SHALL be one day, one week or one month; the chart SHALL NOT group 2 or
more days or months into one point.

The comparison series SHALL use the same granularity and SHALL be matched to the
current series by position.

Each point SHALL have a label with the first day of the point ("Oct 8" for days
and weeks; "Oct 2026" for months) and a span label with the first and last day
of the point ("Oct 5 – Oct 11, 2026"). A one-day point SHALL have a span label
with the day and year ("Oct 8, 2026"). Comparison points SHALL have the same two
labels.

#### Scenario: 7-day range

- **WHEN** the range is Last 7 days
- **THEN** the chart has 7 points, one for each day

#### Scenario: 30-day range

- **WHEN** the range is Sep 19 to Oct 18, 2026
- **THEN** the chart has 30 points, one for each day, the first with the label "Sep 19" and the span label "Sep 19, 2026"

#### Scenario: 31-day range

- **WHEN** a custom range is Oct 1 to Oct 31, 2026
- **THEN** the chart has 31 points, one for each day

#### Scenario: 32-day range

- **WHEN** a custom range has 32 days
- **THEN** each chart point is one week

#### Scenario: 90-day range

- **WHEN** the range is Jul 21 to Oct 18, 2026 and weeks start on Monday
- **THEN** the chart has 13 points of one week, the first covering Jul 21 to Jul 26, 2026

#### Scenario: Partial first week

- **WHEN** weeks start on Monday and a weekly range starts on a Wednesday
- **THEN** the first point covers Wednesday to Sunday

#### Scenario: 12-month range

- **WHEN** the range is Last 12 months
- **THEN** each chart point is one month, with the label "Oct 2026" for October 2026

#### Scenario: Two-year range

- **WHEN** a custom range is Jan 1, 2025 to Dec 31, 2026
- **THEN** the chart has 24 points, one for each month, the first covering Jan 1 to Jan 31, 2025

#### Scenario: Comparison points

- **WHEN** the range is Sep 19 to Oct 18, 2026 and the comparison is Previous year
- **THEN** the comparison has 30 daily points, the first for Sep 19, 2025
