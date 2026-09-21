<?php

namespace Kirki\Ecommerce\App\Services;

use function Kirki\Ecommerce\App\base_currency;
use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\user;

/**
 * Builds the application configuration payload consumed by the admin app.
 *
 * @since 1.0.0
 */
class AppConfigService
{
    /**
     * Get the plugin name, version, current user and base currency.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    public function get_app_config()
    {
        return [
            'name' => __('Kirki eCommerce', 'kirki-ecommerce'),
            'version' => app()->version(),
            'current_user' => user()->get_data(),
            'base_currency' => base_currency(),
        ];
    }
}
