# cart-identity-sync Specification

## Purpose

Defines how the storefront resolves one active cart for a shopper across anonymous browsing, authenticated sessions, sign-in adoption, and guest/account cart merges.

## Requirements

### Requirement: Active carts have one owner identity
Every active cart SHALL resolve as either an anonymous cart identified by an opaque guest token or an owned cart identified by the authenticated shopper. The system MUST NOT expose or mutate a cart for a shopper whose active identity does not match that cart.

#### Scenario: Guest request resolves anonymous cart
- **WHEN** an unauthenticated shopper sends a valid guest cart token
- **THEN** the system resolves the anonymous cart associated with that token
- **AND** no owned cart is returned

#### Scenario: Authenticated request resolves owned cart
- **WHEN** an authenticated shopper requests their cart
- **THEN** the system resolves that shopper's active owned cart
- **AND** any guest token submitted by the client is used only for the explicit sync rules defined by this capability

#### Scenario: Forged or mismatched identity is rejected
- **WHEN** a shopper attempts to update, remove, coupon, or checkout a cart item that belongs to another active cart
- **THEN** the system rejects the mutation
- **AND** the other shopper's cart contents are not disclosed or changed

### Requirement: Guest cookie lifecycle is backend owned
Guest cart tokens SHALL be opaque identifiers stored in a backend-managed cookie and used only to locate anonymous carts. The backend SHALL read guest cart tokens from the request cookie channel and SHALL set, rotate, or clear the cookie through server response cookie handling.

#### Scenario: Missing guest cookie starts empty
- **WHEN** an unauthenticated shopper requests the cart without a guest cart cookie
- **THEN** the system returns an empty cart representation or creates an anonymous cart only when a cart mutation requires persistence

#### Scenario: Anonymous mutation issues cookie
- **WHEN** an unauthenticated shopper performs a cart mutation that creates an anonymous cart
- **THEN** the response sets a guest cart cookie for that anonymous cart
- **AND** the client does not need to persist the token manually in JavaScript

#### Scenario: Stale guest cookie is cleared
- **WHEN** an unauthenticated shopper sends a guest cart cookie that no longer maps to an active anonymous cart
- **THEN** the system does not error
- **AND** the stale cookie is cleared or replaced before subsequent cart mutations rely on it

#### Scenario: Owned cart responses do not continue anonymous identity
- **WHEN** an authenticated shopper's request resolves to an owned cart
- **THEN** the response path clears or invalidates the previous anonymous guest cookie for future cart mutations

#### Scenario: Header token is compatibility only
- **WHEN** a request includes both a guest cart cookie and a legacy guest cart token header
- **THEN** the backend uses the cookie as the canonical token source
- **AND** the header can be ignored or used only as a temporary fallback when the cookie is absent

### Requirement: Sign-in synchronizes anonymous and owned carts
When a shopper signs in with a guest cart cookie, the system SHALL resolve the anonymous cart for that token and the active owned cart for the authenticated shopper, then perform exactly one of the defined sync outcomes.

#### Scenario: Neither cart exists
- **WHEN** a shopper signs in without an active anonymous cart and without an active owned cart
- **THEN** no cart is created solely for sign-in
- **AND** any stale guest cart cookie is cleared

#### Scenario: Only owned cart exists
- **WHEN** a shopper signs in without an active anonymous cart but with an active owned cart
- **THEN** the owned cart remains the active cart
- **AND** any stale guest cart cookie is cleared

#### Scenario: Only anonymous cart exists
- **WHEN** a shopper signs in with an active anonymous cart and no active owned cart
- **THEN** the anonymous cart is adopted as the shopper's owned cart
- **AND** the anonymous cookie is removed or invalidated

#### Scenario: Anonymous and owned carts both exist
- **WHEN** a shopper signs in with an active anonymous cart and an active owned cart
- **THEN** the anonymous cart is merged into the owned cart
- **AND** the anonymous cart is no longer active after the merge
- **AND** the owned cart is returned as the canonical active cart

### Requirement: Cart merges reconcile line items deterministically
When an anonymous cart is merged into an owned cart, each line item SHALL be reconciled by variant identity. Matching variants MUST produce one line in the owned cart whose quantity is the anonymous cart's quantity for that variant.

#### Scenario: Distinct variants are carried forward
- **WHEN** an anonymous cart and an owned cart contain different variants
- **THEN** all line items from both carts appear in the owned cart after merge

#### Scenario: Duplicate variant uses the anonymous cart's quantity
- **WHEN** an anonymous cart contains a variant at quantity 9 and the owned cart contains the same variant at quantity 3
- **THEN** the merged owned cart contains one line for that variant
- **AND** that line quantity is 9
- **AND** quantities are not summed and are not capped to available stock

### Requirement: Cart API returns canonical cart after sync
Cart read and mutation APIs SHALL return the canonical active cart after identity resolution or sync completes. Visible merge/adoption notices are not part of this capability; a future change may add sync metadata to responses.

#### Scenario: Add item after sign-in returns owned cart
- **WHEN** a shopper signs in with an anonymous cart cookie and then adds an item
- **THEN** the add-item response returns the shopper's owned cart
- **AND** subsequent item updates can use the returned item identifiers without relying on the old guest cookie

#### Scenario: Coupon and address updates use resolved cart
- **WHEN** a shopper applies a coupon or updates cart addresses after sign-in sync
- **THEN** the mutation applies to the canonical owned cart
- **AND** no duplicate anonymous cart is created from the previous token

#### Scenario: Checkout uses resolved cart
- **WHEN** a shopper proceeds to checkout after sign-in sync
- **THEN** checkout uses the canonical owned cart and its reconciled line items
- **AND** the abandoned anonymous cart cannot be checked out separately with the old cookie or legacy token header
