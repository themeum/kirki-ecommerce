<?php

namespace Kirki\Ecommerce\App\Providers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Settings\SettingsFactory;
use Kirki\Ecommerce\Framework\ServiceProvider;

/**
 * Registers the settings factory singleton and its alias.
 *
 * @since 1.0.0
 */
class SettingsServiceProvider extends ServiceProvider
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function register()
    {
        $this->app->singleton(SettingsFactory::class);

        $this->app->alias('settings', SettingsFactory::class);
    }
}
