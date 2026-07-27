<?php

namespace Kirki\Ecommerce\App\Supports\Facades;

use Kirki\Ecommerce\Framework\Facade;

/**
 * @method static \Kirki\Ecommerce\App\AppSettings get(string $key)
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
