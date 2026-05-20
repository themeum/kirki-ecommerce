<?php

namespace Kirki\Ecommerce\Supports\Facades;

use Kirki\Ecommerce\Facade;

/**
 * @method static void register(string $command_name, $callback)
 * 
 * @see \Kirki\Ecommerce\Core\Console\CommandManager
 */
class Command extends Facade
{
    public static function get_accessor()
    {
        return 'command';
    }
}
