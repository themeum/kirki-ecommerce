## Purpose

Defines the MCP tool that tells which store setup steps are done and which are
open, so that an AI client can guide a new merchant to the first sale.

## ADDED Requirements

### Requirement: Setup status tool

`kirki-ecommerce-setup-status` SHALL take no arguments. It SHALL return the
setup steps that the Home page shows, in the same order. Each step SHALL have
its ID (`products`, `payments`, `tax`, `shipping`), whether it is completed,
whether it was preconfigured, and the admin page where the merchant does the
step. The result SHALL also say whether all steps are completed. A step SHALL
count as completed by the same rules as the Home page. The `kirki-ecommerce`
server SHALL list the tool.

#### Scenario: New store

- **WHEN** the store has no products and no enabled payment method
- **THEN** the `products` and `payments` steps are not completed and all steps completed is false

#### Scenario: Same state as the Home page

- **WHEN** the merchant adds a product and then calls the tool
- **THEN** the `products` step is completed, the same as on the Home page checklist
