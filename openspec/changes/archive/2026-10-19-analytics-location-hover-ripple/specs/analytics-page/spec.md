## ADDED Requirements

### Requirement: Sales by location row ripple

When no country is selected, a mouse hover or a keyboard focus on a country row
in the Sales by location list SHALL show one ring on the map at the center of
that country's largest land part. The ring SHALL use the map ping purple. It
SHALL grow and fade one time in approximately 800 ms, and it SHALL NOT repeat
while the row keeps the hover or the focus. Each new hover or focus on a row
SHALL play the ripple again. The ring SHALL go when the hover or the focus goes.

The ring SHALL NOT receive pointer events and SHALL be hidden from assistive
technology. A row hover SHALL NOT show the country border or the map tooltip.
When the map has no shape for the country, no ring SHALL show. A region row
SHALL NOT show a ring, because the map has no region shapes. When the user asks
for reduced motion, the ring SHALL show at its full size with no animation while
the row has the hover or the focus.

#### Scenario: Hover a country row

- **WHEN** no country is selected and the merchant moves the mouse onto the Germany row
- **THEN** a purple ring shows at the center of Germany on the map, grows and fades one time, and Germany shows no border and no tooltip

#### Scenario: Hover the same row again

- **WHEN** the merchant moves the mouse off the Germany row and then onto it again
- **THEN** the ripple plays again on Germany

#### Scenario: Move to another row

- **WHEN** the Germany row has the hover and the merchant moves the mouse onto the United States row
- **THEN** the ring on Germany goes and a new ripple plays on the United States

#### Scenario: Keyboard focus on a country row

- **WHEN** the merchant moves the focus onto the Germany row with Tab
- **THEN** the ripple plays on Germany, and the ring goes when the focus leaves the row

#### Scenario: Country with no map shape

- **WHEN** the merchant hovers the Singapore row and the bundled map has no shape for Singapore
- **THEN** no ring shows

#### Scenario: Region row

- **WHEN** the United States is selected and the merchant hovers the California row
- **THEN** no ring shows

#### Scenario: Reduced motion ring

- **WHEN** the user asks for reduced motion and the merchant hovers the Germany row
- **THEN** a static purple ring shows at the center of Germany until the hover goes
