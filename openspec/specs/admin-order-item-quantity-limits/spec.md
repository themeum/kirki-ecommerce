# admin-order-item-quantity-limits Specification

## Purpose

Defines how the admin order-create screen validates a line's quantity against the variant's available stock when a merchant is building a manual order.

## Requirements

### Requirement: A line's quantity control is capped at the variant's available stock

When a merchant is building a manual order, the quantity control for a line SHALL prevent increasing that line's quantity beyond the variant's available stock quantity. It SHALL NOT reject the increase after the fact server-side only — the control itself SHALL refuse to produce a quantity above the variant's available stock.

#### Scenario: Increasing quantity within available stock

- **WHEN** a merchant increases a line's quantity while it remains below the variant's available stock
- **THEN** the increase is applied and the control remains able to increase further, up to the available stock

#### Scenario: Increasing quantity at the available stock limit

- **WHEN** a line's quantity equals the variant's available stock
- **THEN** the control that increases quantity is disabled, and typing a value above the available stock into the quantity field is clamped down to the available stock

#### Scenario: A variant with no available-stock ceiling on record

- **WHEN** a line's variant selection carries no available-stock figure
- **THEN** the quantity control is not capped and behaves as it did before this change (bounded only by the existing minimum-quantity-of-one rule)

### Requirement: Decreasing quantity is never blocked by the stock ceiling

The variant's available-stock ceiling SHALL only constrain increasing a line's quantity. Decreasing a line's quantity SHALL remain governed solely by the existing minimum-quantity rule, unaffected by the stock ceiling.

#### Scenario: Decreasing a line already at its stock ceiling

- **WHEN** a merchant decreases a line's quantity while it is at the variant's available stock
- **THEN** the decrease is applied normally
