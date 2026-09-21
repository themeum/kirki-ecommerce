<?php

namespace Kirki\Ecommerce\App\Constants\Email;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

defined('ABSPATH') || exit;

class AdminUserNotification
{
    use HasConstants;

    const RESET_PASSWORD = 'reset_password';

    public static function get_type()
    {
        return 'admin_emails';
    }

    public static function get_group()
    {
        return 'user_notifications';
    }
}
