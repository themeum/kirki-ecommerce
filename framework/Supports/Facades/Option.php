<?php

namespace Kirki\Ecommerce\Supports\Facades;

use Kirki\Ecommerce\Facade;

/**
 * @method static bool set(string $name, $value)
 * @method static mixed get(string $name, $default = null)
 * @method static bool delete(string $name)
 * 
 * @see \Ecommerce\Core\Managers\OptionManager
 */
class Option extends Facade
{
    public static function get_accessor()
    {
        return 'option';
    }
}
