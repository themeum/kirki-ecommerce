<?php

namespace Kirki\Ecommerce\App\Constants\Order;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

final class OrderAction
{
    use HasConstants;

    const MARK_AS_PROCESSING = 'mark-as-processing';
    const MARK_AS_SHIPPED = 'mark-as-shipped';
    const MARK_AS_DELIVERED = 'mark-as-delivered';
    const MARK_AS_HOLD = 'mark-as-hold';
    const CANCEL_FULFILLMENT = 'cancel-fulfillment';
    const RESUME_FULFILLMENT = 'resume-fulfillment';
    const ADD_TRACKING = 'add-tracking';
    const MARK_AS_PAID = 'mark-as-paid';
    const SEND_PAYMENT_LINK = 'send-payment-link';
    const SEND_INVOICE = 'send-invoice';
    const INITIATE_REFUND = 'initiate-refund';
    const APPROVE_REFUND = 'approve-refund';
    const DECLINE_REFUND = 'decline-refund';
    const MARK_REFUND_COMPLETE = 'mark-refund-complete';
    const CANCEL_ORDER = 'cancel-order';
    const ARCHIVE_ORDER = 'archive-order';
    const RESEND_ORDER_EMAIL = 'resend-order-email';
}
