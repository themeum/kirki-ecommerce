<?php

namespace Kirki\Ecommerce\App\Constants\Email;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

defined('ABSPATH') || exit;

/**
 * Order notification keys in the admin email settings.
 *
 * @since 1.0.0
 */
class AdminOrderNotification
{
    use HasConstants;

    const NEW_ORDER = 'new_order';
    const CANCELLED_ORDER = 'cancelled_order';
    const FAILED_ORDER = 'failed_order';

    /**
     * Get the email settings type these notifications belong to.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public static function get_type()
    {
        return 'admin_emails';
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
