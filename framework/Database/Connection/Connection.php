<?php

namespace Kirki\Ecommerce\Database\Connection;

use Closure;
use DateTimeInterface;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Query\Expression;
use Kirki\Ecommerce\Database\Query\Model;
use Kirki\Ecommerce\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Database\Query\QueryCompiler;
use Kirki\Ecommerce\Exceptions\QueryException;
use Kirki\Ecommerce\Exceptions\UniqueConstraintViolationException;
use Exception;
use RuntimeException;

use function Kirki\Ecommerce\collection;

/**
 * Manage a shared PDO database connection.
 *
 * Provide a singleton-style access point to a configured PDO instance used by
 * the ORM for executing queries and transactions. Handles DSN construction,
 * error mode configuration, and connection lifecycle. Consumers request the
 * instance rather than constructing connections directly.
 *
 * @since 1.0.0
 */
class Connection
{
    /**
     * The database connection instance.
     *
     * @var \wpdb
     */
    protected $db;

    /**
     * The last inserted ID.
     *
     * @var int
     */
    protected $last_insert_id = 0;

    /**
     * Whether to log the queries
     *
     * @var bool
     */
    protected $is_logging_queries = false;

    /**
     * The query log
     *
     * @var array
     */
    protected $query_log = [];

    /**
     * The total duration of the queries
     *
     * @var float
     */
    protected $total_query_duration = 0.0;

    /**
     * Initialize the connection with the given configuration.
     *
     * Accepts an array of database settings and immediately attempts to
     * establish a PDO connection using those values. Instances should be
     * requested via the instance methods rather than direct construction.
     *
     * @return void
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->connect();
    }

    /**
     * Establish the underlying PDO connection.
     *
     * Builds a MySQL DSN using charset and port defaults when not provided,
     * then creates the PDO with exceptions enabled and native prepared
     * statements. Throws an exception when connection fails.
     *
     * @return void No return value; sets internal PDO instance
     * @since 1.0.0
     */
    protected function connect()
    {
        try {
            global $wpdb;
            $this->db = $wpdb;
        } catch (Exception $error) {
            throw new Exception("Database connection failed: " . $error->getMessage());
        }
    }

    /**
     * Get the underlying PDO instance.
     *
     * Exposes the PDO object for lower-level operations or integrations that
     * require direct database access beyond the ORM's query builder.
     *
     * @return \wpdb The active PDO connection object
     * @since 1.0.0
     */
    public function get_db()
    {
        return $this->db;
    }

    /**
     * Begin a new database transaction.
     *
     * Delegates to PDO::beginTransaction and returns its boolean result.
     * Transactions allow grouping multiple statements into an atomic unit.
     *
     * @return bool True on success; false on failure
     * @since 1.0.0
     */
    public function begin_transaction()
    {
        return $this->db->query('START TRANSACTION');
    }

    /**
     * Commit the current database transaction.
     *
     * Finalizes the transaction and persists the changes. Returns the PDO
     * boolean result indicating success.
     *
     * @return bool True on success; false on failure
     * @since 1.0.0
     */
    public function commit()
    {
        return $this->db->query('COMMIT');
    }

    /**
     * Roll back the current database transaction.
     *
     * Reverts all changes made during the active transaction. Returns the PDO
     * boolean result indicating whether the rollback succeeded.
     *
     * @return bool True on success; false on failure
     * @since 1.0.0
     */
    public function rollback()
    {
        return $this->db->query('ROLLBACK');
    }

    /**
     * Get a new query builder instance with the table name wrapped.
     *
     * @param string|Expression|Model $table The table name.
     * @param string|null $as The alias of the table.
     *
     * @return QueryBuilder
     */
    public function table($table, $as = null)
    {
        return $this->query()->from($table, $as);
    }

    /**
     * Insert a new record into the database
     *
     * @param string $query The SQL query to execute.
     * @param array $bindings The bindings for the query.
     *
     * @return bool True if the insert was successful, false otherwise.
     */
    public function insert($query, $bindings = [])
    {
        return $this->statement($query, $bindings);
    }

    /**
     * Update the database
     *
     * @param string $query The SQL query to execute.
     * @param array $bindings The bindings for the query.
     *
     * @return int The number of rows updated.
     */
    public function update($query, $bindings = [])
    {
        return $this->affecting_statement($query, $bindings);
    }

    /**
     * Delete a record from the database
     *
     * @param string $query The SQL query to execute.
     * @param array $bindings The bindings for the query.
     *
     * @return int The number of rows deleted.
     */
    public function delete($query, $bindings = [])
    {
        return $this->affecting_statement($query, $bindings);
    }

    /**
     * Execute a statement and return the results
     *
     * @param string $query The SQL query to execute.
     * @param array $bindings The bindings for the query.
     *
     * @return bool True if the statement was successful, false otherwise.
     */
    protected function statement($query, $bindings = [])
    {
        return $this->run($query, $bindings, function ($query, $bindings) {
            $sql = $this->prepare_query($query, $bindings);

            return (bool) $this->db->query($sql);
        });
    }

    /**
     * Execute a statement and return the number of affected rows
     *
     * @param string $query The SQL query to execute.
     * @param array $bindings The bindings for the query.
     *
     * @return int The number of affected rows.
     */
    protected function affecting_statement($query, $bindings = [])
    {
        return $this->run($query, $bindings, function ($query, $bindings) {
            $sql = $this->prepare_query($query, $bindings);

            $result = $this->db->query($sql);

            if ($result !== false) {
                return $this->db->rows_affected;
            }

            return 0;
        });
    }

    /**
     * Execute a raw SQL query and return the results.
     *
     * @param string $query The SQL query to execute.
     * @param array $bindings The bindings for the query.
     *
     * @return array The results of the query.
     */
    public function select($query, $bindings = [])
    {
        return $this->run($query, $bindings, function ($query, $bindings) {
            $sql = $this->prepare_query($query, $bindings);

            return $this->db->get_results($sql);
        });
    }

    /**
     * Run a query and return the results.
     * This is for handling the mysql errors properly
     *
     * @param string $query The SQL query to execute.
     * @param array $bindings The bindings for the query.
     * @param Closure $callback The callback function to execute.
     *
     * @return mixed The results of the query.
     */
    protected function run($query, $bindings, Closure $callback)
    {
        $start = microtime(true);

        try {
            $result = $this->run_query_callback($query, $bindings, $callback);
        } catch (QueryException $error) {
            throw $error;
        }

        $this->log_query($query, $bindings, $this->get_elapsed_time($start));

        return $result;
    }

    /**
     * Run a query callback and handle the mysql errors properly
     *
     * @param string $query The SQL query to execute.
     * @param array $bindings The bindings for the query.
     * @param Closure $callback The callback function to execute.
     *
     * @return mixed The results of the query.
     */
    protected function run_query_callback($query, array $bindings, Closure $callback)
    {
        try {
            $result = $callback($query, $bindings);

            if (!empty($this->db->last_error)) {
                throw new Exception($this->db->last_error);
            }

            if ($this->db->rows_affected < 0) {
                throw new Exception(sprintf(
                    __('Query failed: %s', 'kirki-ecommerce'),
                    $query
                ), 500);
            }

            return $result;
        } catch (Exception $error) {
            if ($this->is_unique_constraint_error($error)) {
                throw new UniqueConstraintViolationException(
                    $query,
                    $this->prepare_bindings($bindings),
                    $error
                );
            }

            throw new QueryException(
                $query,
                $this->prepare_bindings($bindings),
                $error
            );
        }
    }

    /**
     * Log a query error
     *
     * @param QueryException $error The query exception to log.
     * @param float $time The time the query took.
     *
     * @return void
     */
    protected function log_query($query, $bindings, $time = 0.0)
    {
        $this->total_query_duration += $time;

        $query = $this->prepare_query($query, $bindings);

        if ($this->is_logging_queries) {
            $this->query_log[] = compact('query', 'bindings', 'time');
        }
    }

    /**
     * Get the elapsed time
     *
     * @param float $start The start time.
     *
     * @return float The elapsed time.
     */
    protected function get_elapsed_time($start)
    {
        return round((microtime(true) - $start) * 1000, 2);
    }

    /**
     * Check if the exception is a unique constraint error
     *
     * @param Exception $exception The exception to check.
     *
     * @return bool True if the exception is a unique constraint error, false otherwise.
     */
    protected function is_unique_constraint_error(Exception $exception)
    {
        return boolval(preg_match('#Integrity constraint violation: 1062#i', $exception->getMessage()));
    }

    /**
     * Prepare the bindings for the query
     *
     * @param array $bindings The bindings for the query.
     *
     * @return array The prepared bindings.
     */
    public function prepare_bindings(array $bindings)
    {
        $compiler = $this->get_query_compiler();

        $bindings = $this->clean_null_bindings($bindings);

        foreach ($bindings as $key => $value) {
            if ($value instanceof DateTimeInterface) {
                $bindings[$key] = $value->format($compiler->get_date_format());
            } elseif (is_bool($value)) {
                $bindings[$key] = (int) $value;
            }
        }

        return $bindings;
    }

    /**
     * Prepare the query for execution
     *
     * @param string $query The query to prepare.
     * @param array $bindings The bindings for the query.
     *
     * @return string The prepared query.
     */
    protected function prepare_query(string $query, array $bindings = [])
    {
        $bindings = $this->prepare_bindings($bindings);

        if (empty($bindings)) {
            return $query;
        }

        return $this->db->prepare($query, $bindings);
    }

    /**
     * Clean the null bindings from the query
     * This is for preventing the query from failing when a null value is passed
     *
     * @param array $bindings The bindings for the query.
     *
     * @return array The cleaned bindings.
     */
    protected function clean_null_bindings(array $bindings)
    {
        return collection($bindings)->filter(function ($value) {
            return $value !== null;
        })->all();
    }

    /**
     * Get a new query builder instance.
     *
     * @return \Kirki\Ecommerce\Database\Query\QueryBuilder
     */
    public function query()
    {
        return new QueryBuilder(
            $this,
            $this->get_query_compiler(),
            null
        );
    }

    /**
     * Get a new query compiler instance.
     *
     * @return QueryCompiler
     */
    public function get_query_compiler()
    {
        return new QueryCompiler($this);
    }

    /**
     * Check if the value is an expression
     *
     * @param mixed $value The value to check
     *
     * @return bool True if the value is an expression, false otherwise
     */
    public function is_expression($value)
    {
        return $value instanceof Expression;
    }

    /**
     * Get the table prefix
     *
     * @return string The table prefix
     */
    public function get_table_prefix()
    {
        return $this->db->prefix;
    }

    /**
     * Quote a string value.
     *
     * @param string $value The value to quote.
     *
     * @return string The quoted value.
     */
    public function quote_string($value)
    {
        if (is_array($value)) {
            return implode(', ', array_map([$this, 'quote_string'], $value));
        }

        return sprintf("'%s'", $value);
    }

    /**
     * Escape a value.
     *
     * @param mixed $value The value to escape.
     *
     * @return string The escaped value.
     */
    public function escape($value)
    {
        if ($value === null) {
            return 'null';
        } elseif (is_int($value) || is_float($value)) {
            return (string) $value;
        } elseif (is_bool($value)) {
            return $this->escape_bool($value);
        } elseif (is_array($value)) {
            throw new RuntimeException('Database connection does not support escaping arrays.');
        } else {
            if (str_contains($value, "\00")) {
                throw new RuntimeException('Strings with null bytes cannot be escaped.');
            }

            if (preg_match('//u', $value) === false) {
                throw new RuntimeException('Strings with invalid UTF-8 byte sequences cannot be escaped.');
            }

            return sprintf("'%s'", $value);
        }
    }

    /**
     * Get a placeholder for a value.
     *
     * @param mixed $value The value to get a placeholder for.
     *
     * @return string The placeholder.
     */
    public function placeholder($value)
    {
        if (is_int($value)) {
            return '%d';
        }

        if (is_float($value)) {
            return '%f';
        }

        if (is_null($value)) {
            return 'null';
        }

        return '%s';
    }

    /**
     * Escape a boolean value.
     *
     * @param bool $value The value to escape.
     *
     * @return string The escaped value.
     */
    protected function escape_bool($value)
    {
        return $value ? '1' : '0';
    }

    /**
     * Get the value of an expression
     *
     * @param mixed $expression The expression to get the value of
     *
     * @return mixed The value of the expression
     */
    public function get_value($expression)
    {
        if ($this->is_expression($expression)) {
            return $this->get_value($expression->get_value());
        }

        return $expression;
    }

    /**
     * Create a new Expression instance
     *
     * @param string|int|float $value The value to wrap in the expression
     *
     * @return Expression
     */
    public function raw($value)
    {
        return new Expression($value);
    }

    public function enable_query_log()
    {
        $this->is_logging_queries = true;
    }

    public function disable_query_log()
    {
        $this->is_logging_queries = false;
    }

    public function flush_query_log()
    {
        $this->query_log = [];
    }

    public function get_query_log()
    {
        return $this->query_log;
    }
}
