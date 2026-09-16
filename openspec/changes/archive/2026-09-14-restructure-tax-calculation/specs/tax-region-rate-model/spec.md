## MODIFIED Requirements

### Requirement: Checkout matches a shopper to a region, rate, and rule set by address

At checkout the system SHALL match the shopper's shipping address to an enabled
tax region by country (EU member countries resolving to the EU region). Within a
matched general region: in country-wide mode the country-wide rates and the
region-level rules apply; in per-state mode the state whose stored id equals the
address's state supplies the rates and the rules, a state with no configured rate
is taxed at zero, and the region-level rules do NOT apply. For a general region,
the region's configured shipping tax rate applies to the shipping charge, applied
uniformly regardless of the item tax rates present in the cart. Within the
matched EU region the member country whose code equals the address's country
supplies the VAT rate(s) that apply to product tax; the region-level rules
apply. The EU region's shipping tax is derived from the distribution of tax
rates actually applied across the cart's items rather than always being the
member country's single configured rate reused verbatim — when every item in
the cart resolves to the same rate, that is also the rate applied to shipping.
A disabled region SHALL NOT match.

#### Scenario: Per-state match

- **WHEN** a shopper's address country has an enabled per-state region and the
  address's state matches a configured state
- **THEN** that state's product and shipping rates are used, and that state's
  rules are evaluated

#### Scenario: Per-state address with no configured rate

- **WHEN** a shopper's address state has no configured rate in the matched region
- **THEN** product and shipping tax for that shopper are zero

#### Scenario: Country-wide match

- **WHEN** a shopper's address country has an enabled country-wide region
- **THEN** the region's country-wide product rate is used for items and its
  shipping rate is applied uniformly to the shipping charge, and the
  region-level rules are evaluated, regardless of the address's state

#### Scenario: EU member country match, uniform rate

- **WHEN** a shopper's address country is an EU member with a configured rate in
  the EU region, and every item in the cart resolves to that same rate
- **THEN** that rate is applied to both the items and the shipping charge, and
  the EU region-level rules are evaluated

#### Scenario: EU member country match, mixed item rates

- **WHEN** a shopper's address country is an EU member and the cart's items
  resolve to more than one effective tax rate (e.g. a per-tax-profile rule
  overrides the member country's rate for some items)
- **THEN** the shipping charge's tax is derived from the distribution of those
  item rates across the cart rather than a single reused rate

#### Scenario: Region disabled

- **WHEN** the region matching a shopper's country is disabled
- **THEN** no region tax applies to that shopper
