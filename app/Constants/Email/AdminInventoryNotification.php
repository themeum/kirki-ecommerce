<?php

namespace Kirki\Ecommerce\App\Constants\Email;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

defined('ABSPATH') || exit;

class AdminInventoryNotification
{
    use HasConstants;

    const OUT_OF_STOCK = 'out_of_stock';
    const LOW_STOCK = 'low_stock';

    public static function get_type()
    {
        return 'admin_emails';
    }

    public static function get_group()
    {
        return 'inventory_notifications';
    }
}
