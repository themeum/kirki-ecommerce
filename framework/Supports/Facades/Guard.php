<?php

namespace Kirki\Ecommerce\Supports\Facades;

use Kirki\Ecommerce\Facade;

/**
 * @method static mixed authorize(string $ability, $model = null)
 * @method static bool allows(string $ability, $model = null)
 * @method static bool denies(string $ability, $model = null)
 * 
 * @see \Ecommerce\Core\Managers\PolicyManager
 */
class Guard extends Facade
{
    public static function get_accessor()
    {
        return 'policy';
    }
}
