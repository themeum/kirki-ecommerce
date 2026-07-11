<?php

namespace Kirki\Ecommerce\Database\Schema;

use Kirki\Ecommerce\Database\Constants\ColumnTypes;
use Kirki\Ecommerce\Database\Connection\Connection;
use Kirki\Ecommerce\Database\Schema\Definitions\Definition;
use Kirki\Ecommerce\Database\Schema\Definitions\ForeignKeyDefinition;
use Exception;

/**
 * Class Structure
 *
 * This class provides a fluent interface for defining and managing the structure of a database table,
 * including columns, indexes, primary keys, unique constraints, and foreign key relationships.
 *
 * @package Kirki\Ecommerce\Database\Schema
 *
 * @since 1.0.0
 */
class Structure
{
    /**
     * The name of the table (without prefix).
     *
     * @var string|null
     */
    protected $table = null;

    /**
     * The database connection instance.
     *
     * @var Connection
     */
    protected $connection = null;

    /**
     * The table prefix.
     *
     * @var string
     */
    protected $prefix = '';

    /**
     * The columns defined for the table.
     *
     * @var array<string, Definition>
     */
    protected $columns = [];

    /**
     * The storage engine for the table.
     *
     * @var string|null
     */
    protected $engine = null;

    /**
     * The character set for the table.
     *
     * @var string|null
     */
    protected $charset = null;

    /**
     * The collation for the table.
     *
     * @var string|null
     */
    protected $collate = null;

    /**
     * The commands for the table structure.
     *
     * @var array
     */
    protected $commands = [];

    /**
     * Structure constructor.
     *
     * @param string $table The table name (without prefix)
     * @param Connection $connection The database connection instance
     *
     * @since 1.0.0
     */
    public function __construct(string $table, Connection $connection)
    {
        $this->table = $table;
        $this->connection = $connection;
        $db = $this->connection->get_db();

        $this->prefix = $db->prefix;
        $this->engine = 'InnoDB';
        $this->charset = $db->charset;
        $this->collate = $db->collate;
    }

    /**
     * Expose the connection instance.
     *
     * @return Connection
     *
     * @since 1.0.0
     */
    public function connection()
    {
        return $this->connection;
    }

    /**
     * Get the full table name with prefix.
     *
     * @return string
     *
     * @since 1.0.0
     */
    public function get_table()
    {
        return $this->table;
    }

    /**
     * Wrap the table name with the query compiler.
     *
     * @param string $table The table name
     * @return string
     *
     * @since 1.0.0
     */
    public function wrap_table($table)
    {
        return $this->connection()
            ->get_query_compiler()
            ->wrap_table($table);
    }

    /**
     * Get the character set for the table.
     *
     * @return string|null
     *
     * @since 1.0.0
     */
    public function get_charset()
    {
        return $this->charset;
    }

    /**
     * Get the storage engine for the table.
     *
     * @return string|null
     *
     * @since 1.0.0
     */
    public function get_engine()
    {
        return $this->engine;
    }

    /**
     * Get the collation for the table.
     *
     * @return string|null
     *
     * @since 1.0.0
     */
    public function get_collate()
    {
        return $this->collate;
    }

    /**
     * Get the commands for the table structure.
     *
     * @return array
     *
     * @since 1.0.0
     */
    public function get_commands()
    {
        return $this->commands;
    }

    /**
     * Set the storage engine for the table.
     *
     * @param string $engine The engine name (e.g., 'InnoDB', 'MyISAM')
     *
     * @throws Exception If the engine is invalid
     *
     * @since 1.0.0
     */
    public function engine(string $engine)
    {
        $available_engines = ['InnoDB', 'MyISAM'];

        if (!in_array($engine, $available_engines)) {
            throw new Exception("Invalid engine: $engine");
        }

        $this->engine = $engine;
    }

    /**
     * Set the character set for the table.
     *
     * @param string $charset The charset (e.g., 'utf8mb4', 'utf8')
     *
     * @throws Exception If the charset is invalid
     *
     * @since 1.0.0
     */
    public function charset(string $charset)
    {
        $this->charset = $charset;
    }

    /**
     * Set the collation for the table.
     *
     * @param string $collate The collation (e.g., 'utf8mb4_unicode_ci', 'utf8_general_ci')
     *
     * @throws Exception If the collation is invalid
     *
     * @since 1.0.0
     */
    public function collate(string $collate)
    {
        $this->collate = $collate;
    }

    /**
     * Get the columns defined for the table.
     *
     * @return array<string, Definition>
     *
     * @since 1.0.0
     */
    public function get_columns()
    {
        return $this->columns;
    }

    /**
     * Add an auto-incrementing BIGINT primary key column named 'ID'.
     *
     * @return Definition
     *
     * @since 1.0.0
     */
    public function id(string $name = 'id')
    {
        return $this->big_increment($name)->primary();
    }

    /**
     * Add a TIMESTAMP column.
     *
     * @param string $name The column name
     * @param int $precision The precision for the timestamp
     * @return Definition
     *
     * @since 1.0.0
     */
    public function timestamp(string $name, $precision = 0)
    {
        return $this->add_column(ColumnTypes::TIMESTAMP, $name, compact('precision'));
    }

    /**
     * Add 'created_at' and 'updated_at' timestamp columns.
     *
     * @param int $precision The precision for the timestamp columns
     * @return void
     *
     * @since 1.0.0
     */
    public function timestamps($precision = 0)
    {
        $this->timestamp('created_at', $precision)->use_current();
        $this->timestamp('updated_at', $precision)->nullable();
    }

    /**
     * Add an INTEGER column.
     *
     * @param string $name The column name
     * @param bool $auto_increment Whether the column is auto-increment
     * @param bool $unsigned Whether the column is unsigned
     * @return Definition
     *
     * @since 1.0.0
     */
    public function integer(string $name, $auto_increment = false, $unsigned = false)
    {
        return $this->add_column(ColumnTypes::INTEGER, $name, compact('auto_increment', 'unsigned'));
    }

    /**
     * Add a TINYINT column.
     *
     * @param string $name The column name
     * @param bool $auto_increment Whether the column is auto-increment
     * @param bool $unsigned Whether the column is unsigned
     * @return Definition
     *
     * @since 1.0.0
     */
    public function tiny_integer(string $name, $auto_increment = false, $unsigned = false)
    {
        return $this->add_column(ColumnTypes::TINYINT, $name, compact('auto_increment', 'unsigned'));
    }

    /**
     * Add a BIGINT column.
     *
     * @param string $name The column name
     * @param bool $auto_increment Whether the column is auto-increment
     * @param bool $unsigned Whether the column is unsigned
     * @return Definition
     *
     * @since 1.0.0
     */
    public function big_integer(string $name, $auto_increment = false, $unsigned = false)
    {
        return $this->add_column(ColumnTypes::BIGINT, $name, compact('auto_increment', 'unsigned'));
    }

    /**
     * Add an unsigned BIGINT column.
     *
     * @param string $name The column name
     * @param bool $auto_increment Whether the column is auto-increment
     * @return Definition
     *
     * @since 1.0.0
     */
    public function unsigned_big_integer(string $name, $auto_increment = false)
    {
        return $this->big_integer($name, $auto_increment, true);
    }

    /**
     * Add an unsigned INTEGER column.
     *
     * @param string $name The column name
     * @param bool $auto_increment Whether the column is auto-increment
     * @return Definition
     *
     * @since 1.0.0
     */
    public function unsigned_integer(string $name, $auto_increment = false)
    {
        return $this->integer($name, $auto_increment, true);
    }

    /**
     * Add an unsigned TINYINT column.
     *
     * @param string $name The column name
     * @param bool $auto_increment Whether the column is auto-increment
     * @return Definition
     *
     * @since 1.0.0
     */
    public function unsigned_tiny_integer(string $name, $auto_increment = false)
    {
        return $this->tiny_integer($name, $auto_increment, true);
    }

    /**
     * Add an auto-incrementing unsigned INTEGER column.
     *
     * @param string $name The column name
     * @return Definition
     *
     * @since 1.0.0
     */
    public function increment(string $name)
    {
        return $this->unsigned_integer($name, true);
    }

    /**
     * Add an auto-incrementing unsigned BIGINT column.
     *
     * @param string $name The column name
     * @return Definition
     *
     * @since 1.0.0
     */
    public function big_increment(string $name)
    {
        return $this->unsigned_big_integer($name, true);
    }

    /**
     * Add a DECIMAL column.
     *
     * @param string $name The column name
     * @param int $total The total number of digits
     * @param int $places The number of decimal places
     * @return Definition
     *
     * @since 1.0.0
     */
    public function decimal(string $name, $total = 8, $places = 2)
    {
        return $this->add_column(ColumnTypes::DECIMAL, $name, compact('total', 'places'));
    }

    /**
     * Add a TEXT column.
     *
     * @param string $name The column name
     *
     * @return Definition
     *
     * @since 1.0.0
     */
    public function text(string $name)
    {
        return $this->add_column(ColumnTypes::TEXT, $name);
    }

    /**
     * Add a STRING (VARCHAR) column.
     *
     * @param string $name The column name
     * @param int|null $length The length of the string
     * @return Definition
     *
     * @since 1.0.0
     */
    public function string(string $name, $length = null)
    {
        $length = $length ?: 255;

        return $this->add_column(ColumnTypes::STRING, $name, compact('length'));
    }

    /**
     * Add a MEDIUM TEXT column.
     *
     * @param string $name The column name
     *
     * @return Definition
     *
     * @since 1.0.0
     */
    public function medium_text(string $name)
    {
        return $this->add_column(ColumnTypes::MEDIUM_TEXT, $name);
    }

    /**
     * Add a LONG TEXT column.
     *
     * @param string $name The column name
     *
     * @return Definition
     *
     * @since 1.0.0
     */
    public function long_text(string $name)
    {
        return $this->add_column(ColumnTypes::LONG_TEXT, $name);
    }

    /**
     * Add a BOOLEAN column.
     *
     * @param string $name The column name
     *
     * @return Definition
     *
     * @since 1.0.0
     */
    public function boolean(string $name)
    {
        return $this->add_column(ColumnTypes::BOOLEAN, $name);
    }

    /**
     * Add a FLOAT column.
     *
     * @param string $name The column name
     * @param int $precision The precision for the float
     * @return Definition
     *
     * @since 1.0.0
     */
    public function float(string $name, $precision = 53)
    {
        return $this->add_column(ColumnTypes::FLOAT, $name, compact('precision'));
    }

    /**
     * Add a DOUBLE column.
     *
     * @param string $name The column name
     * @return Definition
     *
     * @since 1.0.0
     */
    public function double(string $name)
    {
        return $this->add_column(ColumnTypes::DOUBLE, $name);
    }

    /**
     * Add a DATE column.
     *
     * @param string $name The column name
     * @return Definition
     *
     * @since 1.0.0
     */
    public function date(string $name)
    {
        return $this->add_column(ColumnTypes::DATE, $name);
    }

    /**
     * Add a DATETIME column.
     *
     * @param string $name The column name
     * @param int $precision The precision for the datetime
     * @return Definition
     *
     * @since 1.0.0
     */
    public function datetime(string $name, $precision = 0)
    {
        return $this->add_column(ColumnTypes::DATETIME, $name, compact('precision'));
    }

    /**
     * Add a TIME column.
     *
     * @param string $name The column name
     * @param int $precision The precision for the time
     * @return Definition
     *
     * @since 1.0.0
     */
    public function time(string $name, $precision = 0)
    {
        return $this->add_column(ColumnTypes::TIME, $name, compact('precision'));
    }

    /**
     * Add an ENUM column.
     *
     * @param string $name The column name
     * @param array $values The values for the enum
     * @return Definition
     *
     * @since 1.0.0
     */
    public function enum(string $name, array $values)
    {
        return $this->add_column(ColumnTypes::ENUM, $name, compact('values'));
    }

    /**
     * Add a SET column.
     *
     * @param string $name The column name
     * @param array $values The values for the set
     * @return Definition
     *
     * @since 1.0.0
     */
    public function set(string $name, array $values)
    {
        return $this->add_column(ColumnTypes::SET, $name, compact('values'));
    }

    /**
     * Add an IP address column.
     *
     * @param string $name The column name
     * @return Definition
     *
     * @since 1.0.0
     */
    public function ip_address(string $name)
    {
        return $this->add_column(ColumnTypes::IP_ADDRESS, $name);
    }

    /**
     * Add a UUID column.
     *
     * @param string $name The column name
     * @return Definition
     *
     * @since 1.0.0
     */
    public function uuid(string $name)
    {
        return $this->add_column(ColumnTypes::UUID, $name);
    }

    /**
     * Add a YEAR column.
     *
     * @param string $name The column name
     * @return Definition
     *
     * @since 1.0.0
     */
    public function year(string $name)
    {
        return $this->add_column(ColumnTypes::YEAR, $name);
    }

    /**
     * Add a column definition to the table.
     *
     * @param string $type The column type
     * @param string $name The column name
     * @param array $parameters Additional parameters for the column
     * @return Definition
     *
     * @since 1.0.0
     */
    protected function add_column($type, $name, array $parameters = [])
    {
        return $this->add_column_definition(
            new Definition(
                array_merge(compact('type', 'name'), $parameters)
            )
        );
    }

    /**
     * Add a column definition object to the columns array.
     *
     * @param Definition $definition The column definition
     * @return Definition
     *
     * @since 1.0.0
     */
    protected function add_column_definition(Definition $definition)
    {
        $this->columns[] = $definition;

        return $definition;
    }

    /**
     * Define the primary key for the table.
     *
     * @param string|array $keys The column(s) to use as primary key
     * @param string|null $key_name Optional constraint name
     *
     * @return $this
     *
     * @since 1.0.0
     */
    public function primary($keys, $key_name = null)
    {
        if (!is_array($keys)) {
            $keys = [$keys];
        }

        $this->commands['primary'] = [
            'name' => $key_name,
            'keys' => $keys,
        ];

        return $this;
    }

    /**
     * Define a unique key for the table.
     *
     * @param string|array $keys The column(s) to use as unique key
     * @param string|null $key_name Optional constraint name
     *
     * @return $this
     *
     * @since 1.0.0
     */
    public function unique($keys, $key_name = null)
    {
        if (!is_array($keys)) {
            $keys = [$keys];
        }

        if (empty($key_name)) {
            $key_name = sprintf('%s_%s_unique', $this->get_table(), implode('_', $keys));
        }

        $this->commands['unique'][] = [
            'name' => $key_name,
            'keys' => $keys,
        ];

        return $this;
    }

    /**
     * Define an index for the table.
     *
     * @param string|array $keys The column(s) to index
     * @param string|null $key_name Optional index name
     *
     * @return $this
     *
     * @since 1.0.0
     */
    public function index($keys, $key_name = null)
    {
        if (!is_array($keys)) {
            $keys = [$keys];
        }

        if (empty($key_name)) {
            $key_name = sprintf('%s_%s_index', $this->get_table(), implode('_', $keys));
        }

        $this->commands['index'][] = [
            'name' => $key_name,
            'keys' => $keys,
        ];

        return $this;
    }

    /**
     * Define a foreign key constraint.
     *
     * @param string $foreign_key The column name for the foreign key
     *
     * @return ForeignKeyDefinition
     *
     * @since 1.0.0
     */
    public function foreign(string $column, $name = null)
    {
        $command = new ForeignKeyDefinition(compact('column', 'name'));

        $this->commands['foreign'][] = $command;

        return $command;
    }

    /**
     * Get the compiler instance for compiling table structure.
     *
     * @return Compiler
     *
     * @since 1.0.0
     */
    protected function compiler()
    {
        return new Compiler();
    }

    /**
     * Get the complete SQL statement for creating the table.
     *
     * @return string
     *
     * @since 1.0.0
     */
    public function get_table_structure()
    {
        return $this->compiler()->compile_create($this);
    }
}
