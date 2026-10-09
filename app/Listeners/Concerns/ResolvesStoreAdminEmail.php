<?php

namespace Kirki\Ecommerce\App\Listeners\Concerns;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

/**
 * Resolves the address that store admin notifications are sent to.
 *
 * @since 1.0.0
 */
trait ResolvesStoreAdminEmail
{
    /**
     * Get the admin email address from the eCommerce settings,
     * falling back to the WP admin email when it is not set.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function get_admin_email()
    {
        return (string) (Settings::get('general.store_email') ?: Option::get('admin_email', '', false));
    }
}
