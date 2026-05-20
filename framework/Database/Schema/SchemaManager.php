<?php

namespace Kirki\Ecommerce\Database\Schema;

use Closure;
use Kirki\Ecommerce\Database\Connection\Connection;
use Exception;

/**
 * Class SchemaManager
 *
 * Manages database schema operations such as creating and dropping tables.
 */
class SchemaManager
{
    /**
     * @var Connection|null The database connection instance.
     */
    protected $connection = null;

    /**
     * SchemaManager constructor.
     *
     * @param Connection $connection The database connection instance.
     */
    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    /**
     * Create a new table in the database.
     *
     * @param string $table The name of the table to create.
     * @param Closure $callback The callback to define the table structure.
     * @return void
     */
    public function create($table, Closure $callback)
    {
        $structure = new Structure($table, $this->connection);
        $callback($structure);

        $create_sql = $structure->get_table_structure();
        $this->connection->get_db()->query($create_sql);

        if (!empty($this->connection->get_db()->last_error)) {
            throw new Exception($this->connection->get_db()->last_error);
        }
    }

    /**
     * Disable foreign key constraint checking.
     *
     * @return void
     */
    public function disabled_checking_foreign_key_constraints()
    {
        $this->connection->get_db()->query("SET FOREIGN_KEY_CHECKS = 0");
    }

    /**
     * Enable foreign key constraint checking.
     *
     * @return void
     */
    public function enabled_checking_foreign_key_constraints()
    {
        $this->connection->get_db()->query("SET FOREIGN_KEY_CHECKS = 1");
    }

    /**
     * Drop a table if it exists.
     *
     * @param string $table The name of the table to drop.
     * @return void
     */
    public function drop_if_exists(string $table)
    {
        $this->disabled_checking_foreign_key_constraints();
        $this->connection->get_db()->query(
            sprintf(
                'DROP TABLE IF EXISTS %s',
                $this->connection->get_query_compiler()->wrap_table($table)
            )
        );
        $this->enabled_checking_foreign_key_constraints();
    }

    /**
     * Drop a table.
     *
     * @param string $table The name of the table to drop.
     * @return void
     */
    public function drop(string $table)
    {
        $this->disabled_checking_foreign_key_constraints();
        $this->connection->get_db()->query(
            sprintf(
                'DROP TABLE %s',
                $this->connection->get_query_compiler()->wrap_table($table)
            )
        );
        $this->enabled_checking_foreign_key_constraints();
    }
}
