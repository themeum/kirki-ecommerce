## ADDED Requirements

### Requirement: Date range control

The date range control SHALL be a button with a calendar icon, the preset name,
the dates of the applied range, and a chevron. It SHALL open a panel with:

- a preset list on the left: Today, Yesterday, Last 7 days, Last 30 days, Last
  90 days, Last 12 months, Month to date, Year to date, Custom;
- read-only Start and End fields that show the pending range;
- a calendar with two months;
- a footer with the number of days in the pending range and Cancel and Apply
  buttons.

A click on a preset or on calendar days SHALL change only the pending range.
Apply SHALL apply the pending range and close the panel. Cancel, Escape, or a
click outside the panel SHALL close the panel and discard the pending range.
Apply SHALL be disabled until the pending range has a start and an end. The
calendar SHALL NOT allow a day after today. The "Custom" item SHALL be active
when the pending range matches no preset, and a click on it SHALL NOT change the
pending range. When the applied range matches no preset, the trigger SHALL show
"Custom" with the dates.

#### Scenario: Apply a preset

- **WHEN** today is Oct 14, 2026, the merchant opens the date control, selects Last 7 days, and selects Apply
- **THEN** the trigger shows "Last 7 days" and "Oct 8 – 14, 2026", and every key metric and every card except Inventory health shows values for that range

#### Scenario: Cancel discards the pending range

- **WHEN** the applied range is Last 30 days, and the merchant selects Last 7 days and then Cancel
- **THEN** the panel closes and the applied range stays Last 30 days

#### Scenario: Custom days

- **WHEN** the merchant selects Sep 7 and then Sep 15 in the calendar
- **THEN** the Start field shows "Sep 7, 2026", the End field shows "Sep 15, 2026", the footer shows "9 days", and the Custom item is active

#### Scenario: Future day

- **WHEN** today is Oct 14, 2026
- **THEN** Oct 15, 2026 and later days cannot be selected

### Requirement: Comparison control

The comparison control SHALL be a button that shows "Compare:" and the dates of
the applied comparison range, or "No comparison" when comparison is off. It SHALL
open a panel with the options Previous period, Previous year, Custom, and No
comparison. Previous period and Previous year SHALL show their dates, resolved
from the applied date range, under the option name. The footer SHALL show
"Compared with" and the pending comparison range (nothing when the pending
option is No comparison), with Cancel and Apply buttons.

A click on an option SHALL change only the pending option. Apply SHALL apply it
and close the panel. Cancel, Escape, or a click outside the panel SHALL close the
panel and discard the pending option. When Custom is the pending option, the
panel SHALL show read-only Start and End fields and a calendar with two months
next to the options. The first time Custom is selected, its range SHALL start as
the previous period. Apply SHALL be disabled while the Custom range has no start
or no end. The calendar SHALL NOT allow a day after today.

#### Scenario: Apply previous period

- **WHEN** the applied range is Oct 8 – 14, 2026, and the merchant selects Previous period and Apply
- **THEN** the trigger shows "Compare: Oct 1 – 7, 2026"

#### Scenario: Option dates

- **WHEN** the applied range is Oct 8 – 14, 2026 and the merchant opens the comparison control
- **THEN** Previous period shows "Oct 1 – 7, 2026" and Previous year shows "Oct 8 – 14, 2025"

#### Scenario: Custom comparison

- **WHEN** the merchant selects Custom, selects Sep 7 and Sep 15, and selects Apply
- **THEN** the trigger shows "Compare: Sep 7 – 15, 2026" and the footer showed "Compared with Sep 7 – 15, 2026" before Apply

#### Scenario: No comparison

- **WHEN** the merchant selects No comparison and Apply
- **THEN** the trigger shows "No comparison" and every key metric change reads "No comparison"

### Requirement: Customize button

The controls row SHALL show a "Customize" button with a sliders icon on the
right side. The button SHALL be enabled and SHALL NOT do anything when selected.

#### Scenario: Select Customize

- **WHEN** the merchant selects Customize
- **THEN** nothing on the page changes

### Requirement: Analytics colors only in graphs

The analytics color tokens SHALL be used only in graphs: charts, sparklines,
bars, maps, heatmaps, gauges, and their legends. Controls, buttons, selected
items, panels, and text SHALL use the design-system color tokens. Control
triggers SHALL use the design-system white background.

#### Scenario: Selected preset

- **WHEN** a preset or comparison option is selected in a control panel
- **THEN** its highlight uses the design-system selected-item colors, not an analytics token

#### Scenario: Trigger background

- **WHEN** the controls row is shown on the grey page background
- **THEN** the date and comparison triggers have a white background

## MODIFIED Requirements

### Requirement: Date, comparison and currency controls

Below the heading, the page SHALL show a controls row with the date range
control and the comparison control on the left and the Customize button on the
right. The defaults SHALL be Last 30 days and Previous period. Applying a new
value in a control SHALL reload every metric and card with the new values. The
applied values SHALL be kept in the URL query, so a reload or a shared link
keeps them. The page SHALL NOT show a currency control.

#### Scenario: Change the range

- **WHEN** the merchant applies Last 7 days
- **THEN** every key metric and every card except Inventory health shows values for the last 7 days

#### Scenario: No currency control

- **WHEN** the store has orders in more than one currency
- **THEN** the page shows no currency control

#### Scenario: Reload keeps the selection

- **WHEN** the merchant applies Year to date and No comparison, and reloads the page
- **THEN** the page shows Year to date with no comparison

#### Scenario: Custom ranges in the URL

- **WHEN** the merchant applies a custom range Sep 1 – 30, 2026 and a custom comparison Aug 1 – 31, 2026, and reloads the page
- **THEN** the page shows both custom ranges

## REMOVED Requirements

### Requirement: Currency-filtered breakdown note

**Reason**: The currency filter is removed, so the breakdown never shows
amounts converted per order.

**Migration**: None. The breakdown card always uses base-currency amounts and
shows no rounding note.
