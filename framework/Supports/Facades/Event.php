<?php

namespace Kirki\Ecommerce\Supports\Facades;

use Kirki\Ecommerce\Facade;

/**
 * @method static void dispatch($event)
 * @method static void dispatch_if(Closure $boolean, $event)
 * @method static void dispatch_unless(Closure $boolean, $event)
 *
 * @see \Ecommerce\Core\Managers\EventManager
 */
class Event extends Facade
{
    public static function get_accessor()
    {
        return 'event';
    }
}
