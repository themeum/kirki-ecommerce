## MODIFIED Requirements

### Requirement: Cards

The Cards table row for Inventory health SHALL be:

| Card | Size | Content |
|---|---|---|
| Inventory health | half | Counts of out-of-stock, low-stock and in-stock variants as tiles, up to 4 out-of-stock or low-stock variants with a status badge, and the note "Live, not affected by the date range" with a live indicator |

All other rows, the rule that no card opens another page, and the existing
scenarios SHALL stay as they are.

#### Scenario: Inventory health content

- **WHEN** the page shows the Inventory health card
- **THEN** it shows the 3 count tiles, the out-of-stock and low-stock variants with a status badge, and the live note with its indicator

## ADDED Requirements

### Requirement: Inventory health layout

The Inventory health card SHALL show 3 tiles of equal width with a light
background: Out of stock, Low stock and In stock. Each tile SHALL show the count
in bold and the status name under it in a subdued color. The Out of stock count
SHALL use the critical color, the Low stock count the warning color, and the In
stock count the default text color. Under the tiles, the card SHALL show the
variant list in a box with a border and a divider between rows. Each row SHALL
show the product name, the variant name under it in a subdued color when the
variant has one, and on the right a status badge: "Out of stock" in the
critical tone or "Low stock" in the warning tone. The row SHALL NOT show the
quantity. When the list is empty, the box SHALL NOT show. Under the list, the
card SHALL show the note "Live, not affected by the date range" after a green
dot. The dot SHALL show a ripple that repeats, and the ripple SHALL NOT animate
when the user asks for reduced motion.

#### Scenario: Count tiles

- **WHEN** the store has 1 out-of-stock, 2 low-stock and 30 in-stock variants
- **THEN** the tiles show "1" in the critical color over "Out of stock", "2" in the warning color over "Low stock", and "30" over "In stock"

#### Scenario: Variant row badge

- **WHEN** the list contains the out-of-stock variant Hoodie, Blue / M, with −2 available
- **THEN** its row shows "Hoodie", "Blue / M" under it and an "Out of stock" badge in the critical tone, and does not show "−2"

#### Scenario: No variant needs attention

- **WHEN** no variant is out of stock or low stock
- **THEN** the card shows the 3 tiles and the live note, and no list box

#### Scenario: Reduced motion

- **WHEN** the user asks for reduced motion
- **THEN** the live dot shows without the ripple animation
