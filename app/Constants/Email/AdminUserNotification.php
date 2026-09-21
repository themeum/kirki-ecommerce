<?php

namespace Kirki\Ecommerce\App\Constants\Email;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

defined('ABSPATH') || exit;

/**
 * User notification keys in the admin email settings.
 *
 * @since 1.0.0
 */
class AdminUserNotification
{
    use HasConstants;

    const RESET_PASSWORD = 'reset_password';

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
        return 'user_notifications';
    }
}
