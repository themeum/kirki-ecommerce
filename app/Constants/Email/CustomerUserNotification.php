<?php

namespace Kirki\Ecommerce\App\Constants\Email;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

defined('ABSPATH') || exit;

class CustomerUserNotification
{
    use HasConstants;

    const RESET_PASSWORD = 'reset_password';
    const NEW_CUSTOMER_ACCOUNT = 'new_account';
    const CONFIRM_EMAIL_ADDRESS = 'confirm_email_address';

    public static function get_type()
    {
        return 'customer_emails';
    }

    public static function get_group()
    {
        return 'user_notifications';
    }
}
