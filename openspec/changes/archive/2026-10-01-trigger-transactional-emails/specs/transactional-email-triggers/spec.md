## Purpose

Defines which store events send which transactional notification email, who receives it, how duplicates are avoided, and how delivery happens in the background, so every template a merchant enables in the Email settings actually reaches its recipient.

## ADDED Requirements

### Requirement: Notification emails are delivered in the background
Every notification email covered by this capability SHALL be sent asynchronously, after the request that triggered it, so that the triggering admin action, checkout, registration, or payment webhook neither waits for email delivery nor fails because of it. Each recipient's email SHALL be delivered independently, so a retry after a failed send never re-sends to a recipient who already got it. A failed send SHALL be retried a bounded number of times.

#### Scenario: Triggering request does not wait for delivery
- **WHEN** an event that sends a notification occurs during a request
- **THEN** the request completes without waiting for the email to be delivered, and the email is sent afterwards in the background

#### Scenario: One recipient's failure does not resend to another
- **WHEN** an event notifies both the customer and the store admin and delivery to one of them fails
- **THEN** only the failed recipient's email is retried; the other recipient receives exactly one email

#### Scenario: Triggering operation rolled back
- **WHEN** the operation that would trigger a notification fails and its changes are rolled back
- **THEN** no notification for that operation is sent

### Requirement: Disabled notifications are never sent
A notification SHALL be sent only if its template is enabled in the Email settings when delivery happens. Disabling a template SHALL also stop any of its emails still waiting to be delivered.

#### Scenario: Template disabled before trigger
- **WHEN** a notification's template is disabled and its triggering event occurs
- **THEN** no email is sent for that notification

#### Scenario: Template disabled while an email is pending
- **WHEN** a notification has been triggered but not yet delivered, and the merchant disables its template in the meantime
- **THEN** the pending email is not sent

### Requirement: Store admin notifications go to the store email address
Admin notifications SHALL be sent to the store email address configured in the general settings. If none is configured, they SHALL go to the WordPress site admin email address.

#### Scenario: Store email configured
- **WHEN** an admin notification is triggered and a store email address is set
- **THEN** the email is sent to the store email address

#### Scenario: Store email not configured
- **WHEN** an admin notification is triggered and no store email address is set
- **THEN** the email is sent to the WordPress site admin email address

### Requirement: Placing an order notifies the customer and the admin
When an order is placed, the system SHALL send the customer "new order" notification to the order's customer email address and the admin "new order" notification to the store admin.

#### Scenario: Order placed
- **WHEN** an order is successfully placed
- **THEN** the customer receives the order-confirmation email and the store admin receives the new-order email

### Requirement: Admins can resend the order confirmation
When an admin performs the resend-order-email action on an order, the system SHALL send the customer "new order" notification again to the order's customer email address.

#### Scenario: Admin resends the confirmation
- **WHEN** an admin performs the resend-order-email action on an order
- **THEN** the customer receives the order-confirmation email again, and the admin does not receive a new-order email

### Requirement: Cancelling an order notifies the customer and the admin
When an order is cancelled, whether by cancelling the order or cancelling its fulfillment, the system SHALL send the customer "cancelled order" notification and the admin "cancelled order" notification. No notification SHALL be sent when the cancellation is not applied (for example, when the order's status does not allow it).

#### Scenario: Order cancelled
- **WHEN** an admin cancels an order and the cancellation is applied
- **THEN** the customer receives the order-cancelled email and the store admin receives the order-cancelled email

#### Scenario: Cancellation not applied
- **WHEN** a cancel request is rejected because the order's current status does not allow it
- **THEN** no cancellation email is sent

### Requirement: Putting an order on hold notifies the customer
When an order's fulfillment is put on hold, the system SHALL send the customer "order on hold" notification.

#### Scenario: Order put on hold
- **WHEN** an admin marks an order as on hold and the transition is applied
- **THEN** the customer receives the order-on-hold email

### Requirement: Marking an order as processing notifies the customer
When an admin marks an order as processing, the system SHALL send the customer "order processing" notification. Resuming fulfillment of an on-hold order SHALL NOT send this notification.

#### Scenario: Order marked as processing
- **WHEN** an admin marks an order as processing and the transition is applied
- **THEN** the customer receives the order-processing email

#### Scenario: Fulfillment resumed from hold
- **WHEN** an admin resumes fulfillment of an order that was on hold
- **THEN** no order-processing email is sent

### Requirement: Shipping an order notifies the customer
When an order is marked as shipped, the system SHALL send the customer "order shipped" notification. The email SHALL include the shipment's tracking details if they have been recorded by the time it is sent. Adding or changing tracking details afterwards SHALL NOT send another shipped notification.

#### Scenario: Order shipped with tracking
- **WHEN** an admin adds tracking details and then marks the order as shipped
- **THEN** the customer receives one order-shipped email that includes the tracking number and link

#### Scenario: Tracking added after shipping
- **WHEN** an admin adds tracking details to an order that has already been marked as shipped
- **THEN** no additional order-shipped email is sent

### Requirement: Delivering an order notifies the customer
When an order is marked as delivered, the system SHALL send the customer "order delivered" notification, whatever the order's payment status (paid, unpaid or failed). It SHALL be sent once per order: marking a delivered order as paid afterwards SHALL NOT send it again, and a delivery request that is not applied SHALL NOT send it.

#### Scenario: Paid order delivered
- **WHEN** an admin marks an already-paid order as delivered
- **THEN** the customer receives the order-delivered email

#### Scenario: Unpaid order delivered
- **WHEN** an admin marks an unpaid order as delivered
- **THEN** the customer receives the order-delivered email

#### Scenario: Delivered order paid later
- **WHEN** a delivered but unpaid order's payment is marked as paid, by an admin or a payment gateway
- **THEN** no additional order-delivered email is sent

#### Scenario: Delivery not applied
- **WHEN** a mark-as-delivered request is rejected or does not change the order's status
- **THEN** no order-delivered email is sent

### Requirement: A failed payment notifies the customer and the admin once
When an order's payment changes to failed, from an admin action or a payment gateway notification, the system SHALL send the customer "payment failed" notification and the admin "payment failed" notification. If the payment is already marked failed, a repeated failure report SHALL NOT send them again.

#### Scenario: Payment fails
- **WHEN** a payment gateway reports that an order's payment failed and the order's payment was not already failed
- **THEN** the customer receives the payment-failed email and the store admin receives the payment-failed email

#### Scenario: Duplicate failure report
- **WHEN** a payment gateway reports a failure for an order whose payment is already marked failed
- **THEN** no additional payment-failed email is sent

### Requirement: Saved failed-order settings carry over to payment failed
The "failed order" notification SHALL be renamed "payment failed", for both the customer and the admin. A store's saved settings for the old notification SHALL carry over: its enabled state and any copy the merchant edited SHALL be kept. A subject or heading still equal to the old default SHALL be replaced by the new "Payment failed" default.

#### Scenario: Untouched default copy
- **WHEN** a store that saved its email settings with the old default failed-order subject and heading is upgraded
- **THEN** the payment-failed notification shows the new "Payment failed" subject and heading

#### Scenario: Customised copy
- **WHEN** a store that disabled the failed-order notification or edited its subject, heading or message is upgraded
- **THEN** the payment-failed notification keeps that enabled state and the merchant's edited copy

### Requirement: A customer-visible order note notifies the customer
When an admin adds a comment to an order and chooses to notify the customer, the system SHALL send the customer "order note" notification containing that comment's text. Comments added without that choice SHALL NOT email the customer.

#### Scenario: Note with notification
- **WHEN** an admin adds a comment to an order with "notify customer" selected
- **THEN** the customer receives the order-note email showing exactly the comment's text

#### Scenario: Internal comment
- **WHEN** an admin adds a comment to an order without selecting "notify customer"
- **THEN** no order-note email is sent

### Requirement: Customers receive the store's password-reset email
On WordPress 6.0 or newer, when a user who is not a store administrator requests a password reset through WordPress, the system SHALL send the customer "reset password" notification with a working reset link in place of the WordPress default reset email. If that template is disabled, the WordPress default reset email SHALL be sent instead, so a customer can always reset their password. Users with store administrator capabilities SHALL continue to receive the WordPress default reset email.

#### Scenario: Customer requests a reset
- **WHEN** a customer requests a password reset and the customer reset-password template is enabled
- **THEN** the customer receives the store's reset-password email with a link that lets them set a new password, and does not receive the WordPress default reset email

#### Scenario: Customer template disabled
- **WHEN** a customer requests a password reset and the customer reset-password template is disabled
- **THEN** the customer receives the WordPress default reset email

#### Scenario: Administrator requests a reset
- **WHEN** a user with store administrator capabilities requests a password reset
- **THEN** they receive the WordPress default reset email

#### Scenario: WordPress version cannot hand over the reset email
- **WHEN** a customer requests a password reset on a WordPress version older than 6.0, which gives no way to stop the default reset email
- **THEN** the customer receives only the WordPress default reset email and the store's reset-password email is not sent

### Requirement: New customer accounts receive a welcome email
On WordPress 6.1 or newer, when a WordPress user account is created for someone who is not a store administrator, whether by self-registration or by an admin creating a customer with a WordPress account, the system SHALL send the customer "new account" notification. It SHALL include a link that lets the customer set their password. While that template is enabled, WordPress's own new-user email to that user SHALL NOT be sent. If the template is disabled, WordPress's default behaviour SHALL be unchanged.

#### Scenario: Account created by an admin
- **WHEN** an admin creates a customer and chooses to create a WordPress user for them
- **THEN** the customer receives the new-account email with a set-password link

#### Scenario: Self-registration
- **WHEN** a visitor registers an account through the site's registration form and the new-account template is enabled
- **THEN** they receive the store's new-account email and not WordPress's default new-user email

#### Scenario: Set-password link works
- **WHEN** a new customer follows the set-password link from their new-account email
- **THEN** they can choose a password and sign in with it

#### Scenario: Customer linked to an existing account
- **WHEN** an admin creates a customer whose email address already belongs to a WordPress user
- **THEN** the customer is linked to that existing account and no new-account email is sent

#### Scenario: Administrator account created
- **WHEN** a user with store administrator capabilities is created
- **THEN** no new-account email is sent by the store

#### Scenario: WordPress version cannot hand over the new-user email
- **WHEN** a customer account is created on a WordPress version older than 6.1, which gives no way to stop WordPress's own new-user email
- **THEN** the store's new-account email is not sent, and WordPress's default new-user behaviour is unchanged

### Requirement: Stock crossing a low or zero level alerts the admin once
For variants that track inventory, the system SHALL send the admin "low stock" notification when a stock reduction takes the variant's available quantity from above its low-stock threshold to at or below it while still above zero. It SHALL send the admin "out of stock" notification when a stock reduction takes the available quantity from above zero to zero or below. The low-stock threshold SHALL be the variant's own threshold if set, otherwise the store default. With no threshold (zero or unset), no low-stock alert SHALL be sent. Reductions that do not cross a level SHALL NOT alert again. Restocking above a level and then crossing it again SHALL alert again. The crossings caused by one order operation (placing an order, or editing an order's items) SHALL be grouped: at most one low-stock email listing every variant that crossed its threshold, and at most one out-of-stock email listing every variant that ran out.

#### Scenario: Stock drops to the threshold
- **WHEN** an order reduces a tracked variant's available quantity from 6 to 5 and its low-stock threshold is 5
- **THEN** the store admin receives one low-stock email listing that variant

#### Scenario: Stock keeps dropping below the threshold
- **WHEN** a later order reduces the same variant's available quantity from 5 to 3
- **THEN** no additional low-stock email is sent

#### Scenario: Stock runs out
- **WHEN** an order reduces a tracked variant's available quantity from 2 to 0
- **THEN** the store admin receives one out-of-stock email listing that variant

#### Scenario: A single reduction crosses both levels
- **WHEN** an order reduces a tracked variant's available quantity from 10 to 0 and its low-stock threshold is 5
- **THEN** the store admin receives the out-of-stock email and no low-stock email

#### Scenario: One order crosses several variants
- **WHEN** one order reduces variant A from 6 to 5 and variant B from 6 to 4 (both with threshold 5), and variant C from 2 to 0
- **THEN** the store admin receives one low-stock email listing A and B, and one out-of-stock email listing C

#### Scenario: Untracked variant
- **WHEN** an order reduces stock on a variant that does not track inventory
- **THEN** no inventory email is sent
