## MODIFIED Requirements

### Requirement: Key metrics row

The page SHALL show the key metrics Gross sales, Orders, Average order value and
Returning customer rate, in this order. Each key metric SHALL show its label, its
value for the range, its change against the comparison and a sparkline of the
range at the chart granularity, with the comparison series as a second line. The
change and the sparkline SHALL be on one row under the value, the change on the
left and the sparkline on the right. When there is no comparison, the change
SHALL read "No comparison". A key metric SHALL NOT be a link.

#### Scenario: Change colors

- **WHEN** Gross sales went up by 12.3%
- **THEN** the change shows "12.3%" with a trending-up icon in the success text color, with no background

#### Scenario: Decrease

- **WHEN** Orders went down by 4.0%
- **THEN** the change shows "4.0%" with a trending-down icon in the critical text color, with no background

### Requirement: Chart tooltips

Hovering or focusing a chart point SHALL show the point's span label, its value
and, when there is a comparison, the comparison point's span label and value.

#### Scenario: Hover a day

- **WHEN** the merchant hovers the Oct 3 point of Total sales over time in a 7-day range with Previous period comparison
- **THEN** the tooltip shows "Oct 3, 2026" with its Total sales and the matching comparison day with its Total sales

#### Scenario: Hover a 3-day group

- **WHEN** the merchant hovers the first point of Total sales over time for Sep 19 to Oct 18, 2026
- **THEN** the tooltip shows "Sep 19 – Sep 21, 2026" with the Total sales of those 3 days

## ADDED Requirements

### Requirement: Change shown as colored text

Every change against the comparison on the page (key metrics, card headlines,
Total sales breakdown rows and Sales by product rows) SHALL show as the percent
with a trending-up icon in the success text color when it went up, a
trending-down icon in the critical text color when it went down, and a flat
icon in the subdued text color when it did not change. A change SHALL NOT have a
background. Status badges, such as the stock badge, SHALL keep their background.

#### Scenario: Card headline

- **WHEN** Total sales went up by 85.4%
- **THEN** the Total sales over time headline shows "85.4%" with a trending-up icon in the success text color next to the value

#### Scenario: Breakdown row

- **WHEN** Discounts went down by 4.0%
- **THEN** the Discounts row shows "4.0%" with a trending-down icon in the critical text color, with no background

### Requirement: Chart axes

The over-time charts (Total sales, Average order value, Orders, and New vs
returning customers) SHALL draw at the pixel width of their card, so text keeps
its shape and dots are circles at every card width.

The y-axis SHALL show 5 values at round steps from 0, one on each grid line, in
a short form: values under 1,000 as whole numbers, and larger values with K, M or
B and at most 1 decimal, with no trailing ".0". Money values SHALL use the base
currency symbol in the same position as in the chart tooltips. Count values SHALL have no symbol.

The x-axis SHALL show at most 12 point labels, evenly spaced, always with the
first and the last point. When the labels do not fit the card width, the axis
SHALL show fewer labels, as many as fit. Labels SHALL be horizontal and SHALL NOT
overlap or be cut.

#### Scenario: Money y-axis

- **WHEN** the highest Total sales point is 700.00 USD
- **THEN** the y-axis shows "$0", "$250", "$500", "$750" and "$1K"

#### Scenario: Large money values

- **WHEN** the highest Total sales point is 98,000.00 USD
- **THEN** the y-axis shows "$0", "$25K", "$50K", "$75K" and "$100K"

#### Scenario: Count y-axis

- **WHEN** the highest Orders point is 1,150
- **THEN** the y-axis shows "0", "500", "1K", "1.5K" and "2K"

#### Scenario: 14 weekly points

- **WHEN** the range is Last 90 days and the chart has 14 points on a wide card
- **THEN** the x-axis shows at most 12 labels, including the first and the last point

#### Scenario: Narrow card

- **WHEN** a half card is 320px wide and the chart has 10 points
- **THEN** the x-axis shows fewer than 10 labels, none tilted, overlapping or cut

#### Scenario: Round dot

- **WHEN** the merchant hovers a point of a line chart on a full-width card
- **THEN** the dot on the point is a circle

### Requirement: Line chart area and last point

A line chart SHALL fill the area between the current-period line and the zero
line with a light tint of the line color, and SHALL show a dot on the last point
of the current-period line. The comparison line SHALL have no fill.

#### Scenario: Total sales over time

- **WHEN** Total sales over time shows a range with a comparison
- **THEN** the area under the current line is filled, the dashed comparison line is not, and the last current point has a dot

### Requirement: Comparison legend

The Total sales, Average order value and Orders over-time charts SHALL show a
legend under the chart with the current range span and, when there is a
comparison, the comparison range span, each with a sample of its line or bar
style. When there is no comparison, the legend SHALL show only the current
range.

#### Scenario: With comparison

- **WHEN** the range is Oct 8 to Oct 14, 2026 and the comparison is Previous year
- **THEN** the legend shows "Oct 8 – 14, 2026" with a solid sample and "Oct 8 – 14, 2025" with a dashed sample

#### Scenario: No comparison

- **WHEN** Compare is None
- **THEN** the legend shows only the current range
