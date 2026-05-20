<?php

namespace Kirki\Ecommerce\Exceptions;

use Exception;
use Throwable;

/**
 * Exception thrown when a query fails.
 *
 * @since 1.0.0
 */
class QueryException extends Exception
{
    protected $sql;
    protected $bindings;

    public function __construct($sql, array $bindings, Throwable $error)
    {
        $this->sql = $sql;
        $this->bindings = $bindings;

        $this->code = $error->getCode();
        $this->message = $this->format_message($sql, $bindings, $error);
    }

    protected function format_message($sql, $bindings, Throwable $error)
    {
        return $error->getMessage() . ' (Connection: MySQL, SQL: ' . $this->prepare($sql, $bindings) . ')';
    }

    public function get_sql()
    {
        return $this->sql;
    }

    public function get_bindings()
    {
        return $this->bindings;
    }

    protected function prepare($sql, $bindings)
    {
        $count = 1;

        foreach ($bindings as $binding) {
            $sql = str_replace('?', $binding, $sql, $count);
        }

        return $sql;
    }
}
