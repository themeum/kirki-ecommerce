## Purpose

Defines what a product's ribbon is made of — the badge text shown on its
storefront card and the colour that badge is drawn in — how that pair is
validated and persisted, and how it reaches the storefront, including the
cases where the store overrides it.

## ADDED Requirements

### Requirement: A ribbon carries a text and a colour

A product's ribbon SHALL consist of a single line of text and a colour. Either may be absent: a product with no ribbon text has no ribbon at all, and its colour is disregarded.

#### Scenario: Product without a ribbon

- **WHEN** a product has no ribbon text
- **THEN** no ribbon is shown for that product regardless of any stored colour

#### Scenario: Product with a ribbon

- **WHEN** a product has ribbon text and a colour
- **THEN** that text is shown as the product's ribbon, drawn in that colour

### Requirement: The ribbon colour offers a fixed set of defaults plus a custom choice

> Superseded post-implementation (see tasks.md §6 and design.md's Non-Goals):
> the original version of this requirement restricted the colour to
> exactly the five-entry palette, rejecting anything else. The sidebar now
> also offers a custom colour picker, so any valid hex colour is accepted;
> the five entries remain as the default, one-click swatches.

The colour SHALL default to one of a fixed, documented set of swatches, but a merchant MAY instead choose any custom colour via a colour picker. Any value the product is saved with, default or custom, is persisted as-is.

#### Scenario: A colour from the default swatches

- **WHEN** a product is saved with a ribbon colour drawn from the default swatches
- **THEN** the product is saved and the colour is persisted

#### Scenario: A custom colour

- **WHEN** a product is saved with a ribbon colour chosen through the custom colour picker
- **THEN** the product is saved and that exact colour is persisted

### Requirement: Ribbons saved before colours existed still render

A product whose ribbon predates the colour, and therefore has none stored, SHALL render its ribbon in the palette's first colour rather than being left unstyled or hidden.

#### Scenario: Upgraded site with existing ribbons

- **WHEN** a site that had ribbon text on its products is upgraded
- **THEN** every one of those ribbons still renders, in the palette's first colour
- **AND** no manual intervention is required to restore them

### Requirement: The storefront receives the ribbon's colour with its text

The storefront card's data SHALL carry the ribbon's colour alongside its text, so the card can draw the badge without looking the colour up separately.

#### Scenario: Card data for a product with a ribbon

- **WHEN** storefront card data is produced for a product with a ribbon
- **THEN** it carries both the ribbon's text and the colour to draw it in

### Requirement: Out of stock overrides the ribbon

An out-of-stock product SHALL show the out-of-stock label in place of any ribbon the merchant set, and MUST NOT draw it in the merchant's ribbon colour, so the stock warning is never disguised as a promotional badge.

#### Scenario: Out-of-stock product with a ribbon

- **WHEN** storefront card data is produced for an out-of-stock product that has a ribbon
- **THEN** the label shown is the out-of-stock label, not the merchant's ribbon text
- **AND** the merchant's ribbon colour is not applied to it

### Requirement: Duplicating a product carries its ribbon colour

Duplicating a product SHALL copy its ribbon colour along with its ribbon text, so the copy's badge looks like the original's.

#### Scenario: Duplicating a product with a coloured ribbon

- **WHEN** a merchant duplicates a product that has a ribbon
- **THEN** the copy has the same ribbon text and the same ribbon colour
