<?php

namespace Kirki\Ecommerce\App\Constants\Email;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

defined('ABSPATH') || exit;

/**
 * Order notification keys in the customer email settings.
 *
 * @since 1.0.0
 */
class CustomerOrderNotification
{
    use HasConstants;

    const NEW_ORDER = 'new_order';
    const CANCELLED_ORDER = 'cancelled_order';
    const FAILED_ORDER = 'failed_order';
    const ORDER_ON_HOLD = 'order_on_hold';
    const ORDER_PROCESSING = 'order_processing';
    const ORDER_COMPLETED = 'order_completed';
    const ORDER_NOTE = 'order_note';
    const ORDER_SHIPPED = 'order_shipped';

    /**
     * Get the email settings type these notifications belong to.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public static function get_type()
    {
        return 'customer_emails';
    }

    /**
     * Get the email settings group these notifications belong to.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public static function get_group()
    {
        return 'order_notifications';
    }

}
