## MODIFIED Requirements

### Requirement: Cart merges reconcile line items deterministically
When an anonymous cart is merged into an owned cart, each line item SHALL be reconciled by variant identity. Matching variants MUST produce one line in the owned cart whose quantity is the anonymous cart's quantity for that variant. Every merged line quantity MUST then be capped to the largest quantity that available stock and the variant's per-order limit allow. The merge MUST NOT fail because of a stock or limit problem.

#### Scenario: Distinct variants are carried forward
- **WHEN** an anonymous cart and an owned cart contain different variants
- **THEN** all line items from both carts appear in the owned cart after merge

#### Scenario: Duplicate variant uses the anonymous cart's quantity
- **WHEN** an anonymous cart contains a variant at quantity 4 and the owned cart contains the same variant at quantity 3, and stock and the per-order limit allow 4
- **THEN** the merged owned cart contains one line for that variant
- **AND** that line quantity is 4
- **AND** quantities are not summed

#### Scenario: Duplicate variant quantity is capped to available stock
- **WHEN** an anonymous cart contains a variant at quantity 9, the owned cart contains the same variant at quantity 3, and only 5 units are available
- **THEN** the merged owned cart contains one line for that variant
- **AND** that line quantity is 5

#### Scenario: Duplicate variant quantity is capped to the per-order limit
- **WHEN** an anonymous cart contains a variant at quantity 9, the owned cart contains the same variant at quantity 3, and the variant has a per-order limit of 6
- **THEN** that line quantity in the merged owned cart is 6

#### Scenario: Carried-forward line is capped
- **WHEN** an anonymous cart contains a variant that is not in the owned cart, at a quantity above available stock
- **THEN** the line is carried into the owned cart at the available stock quantity

#### Scenario: Back-ordered or untracked variants are not capped by stock
- **WHEN** an anonymous cart contains a variant that allows back orders or does not track inventory, at any quantity within its per-order limit
- **THEN** the merged line keeps the anonymous cart's quantity

#### Scenario: Capping never blocks the merge
- **WHEN** a merged line exceeds stock or the per-order limit
- **THEN** the merge completes
- **AND** the anonymous cart is no longer active
- **AND** the owned cart is returned

## ADDED Requirements

### Requirement: Cart merges carry coupons forward
When an anonymous cart is merged into an owned cart, the coupons applied to the anonymous cart SHALL be applied to the owned cart. A coupon already applied to the owned cart MUST NOT be applied twice. Eligibility of carried coupons SHALL be decided by the normal cart pricing rules, which remove a coupon that no longer applies.

#### Scenario: Guest coupon survives the merge
- **WHEN** an anonymous cart with an applied coupon is merged into an owned cart that has no coupons
- **THEN** the owned cart has that coupon applied after the merge

#### Scenario: Coupons from both carts are kept
- **WHEN** the anonymous cart and the owned cart have different coupons applied
- **THEN** the owned cart has both coupons applied after the merge

#### Scenario: Shared coupon is applied once
- **WHEN** the anonymous cart and the owned cart both have the same coupon applied
- **THEN** the owned cart has that coupon applied exactly once after the merge

#### Scenario: Carried coupon that no longer applies is dropped by pricing
- **WHEN** a coupon carried from the anonymous cart is not valid for the merged owned cart
- **THEN** the next cart pricing removes that coupon from the owned cart
- **AND** the other coupons on the cart are kept
