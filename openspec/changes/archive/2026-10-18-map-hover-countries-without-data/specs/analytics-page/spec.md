## MODIFIED Requirements

### Requirement: Sales by location map

The Sales by location card SHALL show a world map at the left and, at the
right, a "Sales", "Orders" and "Customers" tab list with Sales selected first.
On a card narrower than 720px, the tab list and the list SHALL show below the
map. The map SHALL use geometry that is in the plugin bundle and SHALL NOT
load any file from another site.

The map SHALL color each country by its value for the selected tab. The
lowest value SHALL be a light purple, the highest value SHALL be a dark
purple, and a value between them SHALL mix the two colors by the square root
of its share between the lowest and the highest value. A country with no value
for the selected tab SHALL be gray. Below the map, the legend SHALL show the
tab name, the lowest value, a gradient, the highest value, and a gray swatch
with "None".

Hovering or focusing a country with a value SHALL show a border around that
country and a tooltip with the country name, the value and the change.
Hovering a country with no value SHALL also show a border around that country
and a tooltip with the country name and "No data". A country with no value
SHALL keep the default cursor, SHALL do nothing on a click, and SHALL NOT be
reachable with the keyboard. The map SHALL NOT zoom on the mouse wheel and SHALL NOT
pan on a drag. Each country with a value SHALL be reachable with the keyboard,
and its accessible name SHALL be the tooltip text.

With no country selected, the list SHALL show the top 5 countries by the
selected tab. Each row SHALL show the country name, the value, the change as
colored text, and a bar whose length is the value relative to the first row.

A click on a country with a value, Enter or Space on a focused country, or a
click on a country row SHALL select that country. The map SHALL then zoom with
an animation so that the country fits in the center of the map, and the other
countries SHALL fade. The list SHALL show "<Country> by region", a
"← All countries" link, and the top 5 regions of that country by the selected
tab, in the same row style. When the map has no shape for the selected
country (a small country that the bundled geometry leaves out), the map SHALL
NOT zoom and the list SHALL still show its regions. While the regions load, the list SHALL show
skeleton rows. When the regions request fails, the list SHALL show an error
with a retry action. A click on "← All countries", Escape, or a click on the
sea SHALL clear the selection and zoom the map back out.

When the range or the comparison changes, a selected country that still has
a value SHALL stay selected and its regions SHALL load for the new range. A
selected country with no value in the new range SHALL be cleared. The selected
country SHALL NOT be in the URL.

When the comparison is None, no row and no tooltip SHALL show a change. When
no country has a value, the card SHALL show the empty state.

#### Scenario: Color by tab

- **WHEN** the Customers tab is selected, the United States has 207 customers and Bangladesh has 12, and no country has fewer than 12 or more than 207
- **THEN** the United States is the dark purple, Bangladesh is the light purple, and the legend reads "Customers 12 … 207" and "None"

#### Scenario: Top countries

- **WHEN** no country is selected and the Sales tab is selected
- **THEN** the list shows the 5 countries with the highest Net sales, the first with a full bar

#### Scenario: Hover a country

- **WHEN** the merchant hovers Germany, which has Sales 5672.15 and a change of 111.2
- **THEN** Germany shows a border and the tooltip shows "Germany", "$5,672.15" and "111.2%" in green with an up icon

#### Scenario: Hover a country with no value

- **WHEN** the merchant hovers France, which has no value for the selected tab
- **THEN** France shows a border and the tooltip shows "France" and "No data", the cursor stays the default cursor, and a click does nothing

#### Scenario: Select a country

- **WHEN** the merchant clicks the United States
- **THEN** the map zooms so the United States fits in the center, the other countries fade, and the list shows "United States by region", "← All countries" and the top 5 regions by the selected tab

#### Scenario: Change tab in a country

- **WHEN** the United States is selected and the merchant selects the Orders tab
- **THEN** the list shows the top 5 regions by orders without a new request, and the map colors follow Orders

#### Scenario: Back to all countries

- **WHEN** the United States is selected and the merchant presses Escape
- **THEN** the map zooms back out and the list shows the top 5 countries

#### Scenario: Range change keeps the country

- **WHEN** the United States is selected and the merchant changes the range to Last 90 days, and the United States has orders in that range
- **THEN** the United States stays selected and its regions load for Last 90 days

#### Scenario: Range change clears the country

- **WHEN** Bangladesh is selected and the merchant changes the range to one in which Bangladesh has no value
- **THEN** the card shows All countries
