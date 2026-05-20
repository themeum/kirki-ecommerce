<?php

namespace Kirki\Ecommerce\Supports\Facades;

use Kirki\Ecommerce\Facade;

/**
 * @method static void debug($message)
 * @method static void info($message)
 * @method static void warning($message)
 * @method static void error($message)
 * @method static void emergency($message)
 * @method static void critical($message)
 * @method static void alert($message)
 *
 * @see \Kirki\Ecommerce\Managers\LogManager
 */
class Log extends Facade
{
    public static function get_accessor()
    {
        return 'log';
    }
}
