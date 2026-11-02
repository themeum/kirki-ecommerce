## MODIFIED Requirements

### Requirement: Chart tooltips

Hovering or focusing a chart point SHALL show the point's span label, its value
and, when there is a comparison, the comparison point's span label and value.

#### Scenario: Hover a day

- **WHEN** the merchant hovers the Oct 3 point of Total sales over time in a 7-day range with Previous period comparison
- **THEN** the tooltip shows "Oct 3, 2026" with its Total sales and the matching comparison day with its Total sales

#### Scenario: Hover a week

- **WHEN** the merchant hovers the last point of Total sales over time for Jul 21 to Oct 18, 2026, with weeks starting on Monday
- **THEN** the tooltip shows "Oct 12 – Oct 18, 2026" with the Total sales of that week

### Requirement: Chart axes

The over-time charts (Total sales, Average order value, Orders, and New vs
returning customers) SHALL draw at the pixel width of their card, so text keeps
its shape and dots are circles at every card width.

The y-axis SHALL show 5 values at round steps from 0, one on each grid line, in
a short form: values under 1,000 as whole numbers, and larger values with K, M or
B and at most 1 decimal, with no trailing ".0". Money values SHALL use the base
currency symbol in the same position as in the chart tooltips. Count values SHALL have no symbol.

The x-axis SHALL label every Nth point, starting with the first point, where
N = ceil(number of points / 12). The chart SHALL show all points, also the
points with no label. When the labels do not fit the card width, N SHALL become
larger until they fit. The steps between labels SHALL always be equal, so the
last point MAY have no label. Labels SHALL be horizontal and SHALL NOT overlap or
be cut.

#### Scenario: Money y-axis

- **WHEN** the highest Total sales point is 700.00 USD
- **THEN** the y-axis shows "$0", "$250", "$500", "$750" and "$1K"

#### Scenario: Large money values

- **WHEN** the highest Total sales point is 98,000.00 USD
- **THEN** the y-axis shows "$0", "$25K", "$50K", "$75K" and "$100K"

#### Scenario: Count y-axis

- **WHEN** the highest Orders point is 1,150
- **THEN** the y-axis shows "0", "500", "1K", "1.5K" and "2K"

#### Scenario: 7 daily points

- **WHEN** the range is Last 7 days on a wide card
- **THEN** the x-axis shows 7 labels, one for each day

#### Scenario: 30 daily points

- **WHEN** the range is Last 30 days on a wide card
- **THEN** the chart shows 30 points and the x-axis shows 10 labels, on the 1st, 4th, 7th and every 3rd point after that

#### Scenario: 13 weekly points

- **WHEN** the range is Last 90 days, the chart has 13 points and the card is wide
- **THEN** the x-axis shows 7 labels, on every 2nd week from the first

#### Scenario: 12 monthly points

- **WHEN** the range has 12 monthly points on a wide card
- **THEN** the x-axis shows 12 labels, one for each month

#### Scenario: 24 monthly points

- **WHEN** a custom range has 24 monthly points on a wide card
- **THEN** the chart shows 24 points and the x-axis shows 12 labels, on every 2nd month from the first

#### Scenario: Narrow card

- **WHEN** a half card has a 280px wide plot area and the chart has 30 points
- **THEN** the x-axis labels every 8th point (4 labels), none tilted, overlapping or cut

#### Scenario: Round dot

- **WHEN** the merchant hovers a point of a line chart on a full-width card
- **THEN** the dot on the point is a circle
