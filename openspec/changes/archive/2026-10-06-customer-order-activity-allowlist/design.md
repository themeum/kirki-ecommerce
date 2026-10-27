## Context

Customer-facing activity reads go through `OrderActivityService`:

- `get_order_activity()` feeds the account order details page and the order
  tracking page. It hides two types with hardcoded `!=` checks.
- `all_for_order()` and `paginated_for_order()` feed `Site\OrderActivityController`
  (`GET /account/orders/{id}/activities`). They are the admin queries. That
  controller also uses the admin `OrderActivityResource`, so customers get
  `description`, `author_name`, `created_by` and `notify_customer`.

See proposal.md for the scope and the type list.

## Goals / Non-Goals

**Goals:**
- One list that controls what customers see. Changing it is a one-line edit.
- Every customer path uses it.

**Non-Goals:**
- No change to admin endpoints or the admin UI.
- No per-activity "private" flag or column (the old todo). The type list is enough.
- No change to who gets emails (the order-note email is separate).

## Decisions

**1. Allow-list on `OrderActivityType::customer_visible()`.**
The constants class already owns the type names, so the list sits next to them.
An allow-list means a new type is hidden until someone adds it.
Alternative: a block-list. Rejected, because a forgotten new type would leak to
customers.

**2. One customer query in the service, used by all paths.**
Add a protected `customer_list_query()` that is `list_query()` plus
`where_in('activity_type', customer_visible())`. Then:
- `get_order_activity()` uses it (keeps its two-column select).
- New `customer_paginated_for_order()` and `customer_all_for_order()` wrap it
  for the REST controller.
Alternative: a filter argument on the existing admin methods. Rejected, because
it makes it easy to forget the argument on a customer path.

**3. REST controller keeps the admin shape, minus `notify_customer`.**
Add `Resources\Site\Order\OrderActivityListResource`. It extends the admin
`OrderActivityResource`, calls `parent::to_array()` and removes `notify_customer`.
The REST queries select all columns, because `description` needs `metadata`.
The admin resource is unchanged: the admin timeline and `OrderNoteEmailTest`
use `notify_customer`.
Alternative: remove the field from the admin resource. Rejected, because it
breaks the admin UI.
The existing slim `Site\Order\OrderActivityResource` stays for the PHP pages.

**4. Order-placed stays visible; archived and refund types stay hidden.**
Order-placed starts the timeline. Archived is an admin action. Refund types are
payment-related. These follow the request to hide payment-related activity.
To change this, edit the list only.

## Risks / Trade-offs

- [The REST response loses rows and `notify_customer`] → Only the customer REST
  endpoint changes. A search found no consumer in this repo.
- [`author_name` and `created_by` still show the admin on fulfillment
  activities] → Kept on purpose to keep the shape. Remove them later if
  customers should not see staff names.
- [A customer loses sight of refund status] → Add the types to the list when
  wanted. No other change is needed.
- [Existing customer test expects a comment] → Update the test to expect it
  hidden.

## Migration Plan

No data migration. Deploy the code. Rollback is a revert.
