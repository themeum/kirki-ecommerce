<?php

namespace Kirki\Ecommerce\App\Constants\Email;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

defined('ABSPATH') || exit;

class AdminOrderNotification
{
    use HasConstants;

    const NEW_ORDER = 'new_order';
    const CANCELLED_ORDER = 'cancelled_order';
    const FAILED_ORDER = 'failed_order';

    public static function get_type()
    {
        return 'admin_emails';
    }

    public static function get_group()
    {
        return 'order_notifications';
    }
}
