## ADDED Requirements

### Requirement: An administrative endpoint requires a capability, not a session

Every endpoint that reads or writes store-wide data — products, variants,
collections, categories, brands, tags, attributes, coupons, customers,
orders, shipping, tax, currency, payment configuration, and settings —
SHALL verify that the requester holds the capability the action needs.

Being logged in SHALL NOT by itself grant access to any administrative
endpoint. A subscriber-level account is a logged-in account, so a check
that establishes only the presence of a session leaves every
administrative endpoint open to the lowest-privileged role on the site.

The check SHALL be enforced server-side on the request, independent of
whether the admin UI offers the action.

#### Scenario: Logged-in user without the capability

- **WHEN** a logged-in user who lacks the required capability requests an
  administrative endpoint
- **THEN** the request is rejected as unauthorized, and no store data is
  read or written

#### Scenario: Logged-in user with the capability

- **WHEN** a logged-in user holding the required capability requests an
  administrative endpoint
- **THEN** the request proceeds

#### Scenario: Unauthenticated request

- **WHEN** an administrative endpoint is requested with no session
- **THEN** the request is rejected as unauthorized

#### Scenario: A new administrative route

- **WHEN** an administrative route is added
- **THEN** it declares the capability it requires, and a route that
  declares none is treated as a defect rather than as public

### Requirement: Shopper endpoints are scoped to the requester's own records

An endpoint serving a shopper — cart, checkout, and account
self-service — SHALL resolve the records it acts on from the requester's
own identity, and SHALL NOT act on another customer's records because an
identifier was supplied in the request.

#### Scenario: Requesting another customer's record

- **WHEN** a shopper endpoint is asked to read or modify a record
  belonging to a different customer
- **THEN** the request is rejected, and the record is neither returned
  nor modified

#### Scenario: Guest cart access

- **WHEN** a guest requests a cart endpoint
- **THEN** the cart resolved is the one bound to that guest's own
  session, and no other cart is reachable by supplying its identifier

### Requirement: The package exposes no diagnostic or installer endpoints

The plugin SHALL NOT register endpoints that exist for development or
that install code, and SHALL NOT ship endpoints whose purpose is to
return diagnostic internals.

#### Scenario: Diagnostic endpoints

- **WHEN** the plugin's routes are registered in a production
  installation
- **THEN** no route returns query logs, backtraces, or other diagnostic
  internals

#### Scenario: Code installation endpoints

- **WHEN** the plugin's routes are registered
- **THEN** no route downloads, writes, or activates plugin code, and no
  route streams an archive assembled from a filesystem path derived from
  request input
