<?php

namespace Kirki\Ecommerce\Supports\Facades;

use Kirki\Ecommerce\Facade;

/**
 * @method static \Kirki\Ecommerce\AppSettings get(string $key)
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
