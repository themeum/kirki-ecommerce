<?php

namespace Kirki\Ecommerce\App\Constants\Email;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

defined('ABSPATH') || exit;

/**
 * User notification keys in the customer email settings.
 *
 * @since 1.0.0
 */
class CustomerUserNotification
{
    use HasConstants;

    const RESET_PASSWORD = 'reset_password';
    const NEW_CUSTOMER_ACCOUNT = 'new_account';
    const CONFIRM_EMAIL_ADDRESS = 'confirm_email_address';

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
        return 'user_notifications';
    }
}
