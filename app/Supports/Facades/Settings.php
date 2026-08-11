<?php

namespace Kirki\Ecommerce\App\Supports\Facades;

use Kirki\Ecommerce\Framework\Facade;

/**
 * @method static mixed get(string $key, $default = null)
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
