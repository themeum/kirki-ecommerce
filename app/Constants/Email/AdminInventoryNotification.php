<?php

namespace Kirki\Ecommerce\App\Constants\Email;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

defined('ABSPATH') || exit;

/**
 * Inventory notification keys in the admin email settings.
 *
 * @since 1.0.0
 */
class AdminInventoryNotification
{
    use HasConstants;

    const OUT_OF_STOCK = 'out_of_stock';
    const LOW_STOCK = 'low_stock';

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
        return 'inventory_notifications';
    }
}
