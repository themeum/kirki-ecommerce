<?php

namespace Kirki\Ecommerce\App\Supports\Facades;

use Kirki\Ecommerce\App\AppSettings;
use Kirki\Ecommerce\Framework\Facade;

/**
 * Facade for reading and updating the plugin settings.
 *
 * @method static AppSettings|mixed get(string $key, $default = null) -- when key has not wildcard '.' then return AppSettings, otherwise return value
 * @method static void update(string $key, $value)
 *
 * @see \Kirki\Ecommerce\App\Settings\SettingsFactory
 *
 * @since 1.0.0
 */
class Settings extends Facade
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public static function get_accessor()
    {
        return 'settings';
    }
}
