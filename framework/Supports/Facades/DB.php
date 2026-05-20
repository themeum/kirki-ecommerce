<?php

namespace Kirki\Ecommerce\Supports\Facades;

use Kirki\Ecommerce\Facade;

/**
 * @method static void begin_transaction()
 * @method static void commit()
 * @method static void rollback()
 * @method static \Kirki\Ecommerce\Database\Query\QueryBuilder table(string $table, string|null $as = null)
 * @method static \Kirki\Ecommerce\Database\Query\Expression raw($value)
 * @method static void enable_query_log()
 * @method static void disable_query_log()
 * @method static void flush_query_log()
 * @method static array get_query_log()
 * 
 * @see \Kirki\Ecommerce\Database\Connection\DatabaseManager
 */
class DB extends Facade
{
    /**
     * Get the accessor for the DB facade
     *
     * @return string The accessor name
     */
    public static function get_accessor()
    {
        return 'db';
    }
}
