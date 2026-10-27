## MODIFIED Requirements

### Requirement: Page states

The page SHALL request the key metrics and each card separately, and SHALL
send all the requests at the same time. While the data of a part loads, that
part SHALL show its skeleton in its final position and size: four key metric
skeletons for the key metrics row, and one card skeleton for each card. When
the data of a part comes, that part SHALL show its data, and the parts that
still load SHALL keep their skeletons. When the request of one part fails,
only that part SHALL show an error with a retry action, and a retry SHALL
request only that part again. When the requests of all parts fail, the page
SHALL show the shared query error state with a retry action that requests all
parts again. When the store has no sales orders and no placed orders at all,
the page SHALL show the banner "Your store has no orders yet. Analytics fills
in as soon as customers start paying for orders." and each card SHALL show an
empty state instead of an empty chart. A card with no data in the range SHALL
show "No data for this date range".

#### Scenario: Empty store

- **WHEN** the store has no orders
- **THEN** the banner shows, the key metrics show 0 or an empty value, and each card except Inventory health shows its empty state

#### Scenario: Range without sales

- **WHEN** the store has orders but none in the selected range
- **THEN** the banner does not show, and the cards show "No data for this date range"

#### Scenario: Request fails

- **WHEN** the requests of all parts return a server error
- **THEN** the page shows the error state with a retry action

#### Scenario: One card loads first

- **WHEN** the Sales by coupon code data comes and the other requests still load
- **THEN** the Sales by coupon code card shows its data, and the key metrics row and the other cards show skeletons

#### Scenario: One card fails

- **WHEN** the Taxes collected by region request returns a server error and the other requests succeed
- **THEN** only the Taxes collected by region card shows an error with a retry action, and the other cards and the key metrics show their data

#### Scenario: Retry one card

- **WHEN** the merchant selects retry on the failed Taxes collected by region card
- **THEN** only the Taxes collected by region data is requested again, and the card shows a skeleton until it comes

#### Scenario: Range changes

- **WHEN** the merchant changes the date range
- **THEN** every part shows its skeleton and requests its data for the new range again
