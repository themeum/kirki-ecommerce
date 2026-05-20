<?php

namespace Kirki\Ecommerce\Database\Connection;

use Kirki\Ecommerce\Supports\Traits\Macroable;

/**
 * The DatabaseManager class provides a high-level interface for managing database transactions.
 *
 * This class acts as a facade for transaction management, allowing you to begin, commit,
 * and rollback transactions using the underlying database connection. It is designed to
 * simplify transaction handling and ensure consistency across database operations.
 *
 * @since 1.0.0
 */
class DatabaseManager
{
    use Macroable {
        __call as macroCall;
    }

    /**
     * The database connection instance.
     *
     * @var Connection
     */
    protected $connection;

    /**
     * Initialize a new DatabaseManager instance with a database connection.
     *
     * @param Connection $connection The database connection instance.
     *
     * @return void
     *
     * @since 1.0.0
     */
    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    /**
     * Get the database connection instance
     *
     * @return Connection The database connection instance
     */
    public function connection()
    {
        return $this->connection;
    }

    /**
     * Call a method on the database connection
     *
     * @param string $method The method name
     * @param array $arguments The arguments for the method
     *
     * @return mixed The result of the method call
     */
    public function __call($method, $arguments)
    {
        if (static::has_macro($method)) {
            return $this->macroCall($method, $arguments);
        }

        return $this->connection->$method(...$arguments);
    }
}
