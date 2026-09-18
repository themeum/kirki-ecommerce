<?php

namespace Kirki\Ecommerce\App\Supports\Facades;

use Kirki\Ecommerce\App\AppSettings;
use Kirki\Ecommerce\Framework\Facade;

/**
 * @method static AppSettings|mixed get(string $key, $default = null) -- when key has not wildcard '.' then return AppSettings, otherwise return value
 * @method static void update(string $key, $value)
 *
 * @see \Kirki\Ecommerce\App\Settings\SettingsFactory
 */
class Settings extends Facade
{
    /**
     * Get the registered name of the component.
     *
     * @return string
     */
    public static function get_accessor()
    {
        return 'settings';
    }
}
