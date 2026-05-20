<?php

namespace Kirki\Ecommerce\Supports\Facades;

use Kirki\Ecommerce\Facade;

/**
 * @method static void create(string $table, \Closure $callback)
 * @method static void drop_if_exists(string $table)
 * @method static void drop(string $table)
 * @method static void enabled_checking_foreign_key_constraints()
 * @method static void disabled_checking_foreign_key_constraints()
 * 
 * @see \Kirki\Ecommerce\Database\Schema\SchemaManager
 */
class Schema extends Facade
{
    public static function get_accessor()
    {
        return 'schema';
    }
}
