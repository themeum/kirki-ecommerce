<?php

namespace Kirki\Ecommerce\App\Supports;

use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Exception;

/**
 * Reads the live index and foreign key inventory of the plugin's tables, and derives the
 * project-owned name every key is expected to carry.
 *
 * Key names must be decided here rather than left to the database engine or the schema library.
 * Framework 2.1.15 emitted foreign keys with no CONSTRAINT clause, so every foreign key created
 * before framework 3.x carries an engine-assigned name that differs from what the same migration
 * source produces today.
 */
class SchemaKeys
{
    /**
     * Prefix shared by every table this plugin owns, after the WordPress table prefix.
     */
    const TABLE_NAMESPACE = 'kirki_ecommerce_';

    /**
     * Maximum identifier length MySQL and MariaDB accept.
     */
    const MAX_KEY_NAME_LENGTH = 64;

    /**
     * Replacements for derived names that would exceed the identifier limit.
     *
     * Keyed by the name the scheme produces. A truncated or hashed name is not used, because the
     * point of owning these names is that a migration can spell one out by hand.
     *
     * @var array<string, string>
     */
    protected static $name_overrides = [
        'idx_kirki_ecommerce_coupons_is_active_start_datetime_has_end_datetime_end_datetime' => 'idx_kirki_ecommerce_coupons_active_window',
        'uq_kirki_ecommerce_collection_translations_collection_id_language_code' => 'uq_kirki_ecommerce_collection_translations_collection_language',
        'uq_kirki_ecommerce_attribute_translations_attribute_id_language_code' => 'uq_kirki_ecommerce_attribute_translations_attribute_language',
        'idx_kirki_ecommerce_orders_payment_status_order_status_updated_at' => 'idx_kirki_ecommerce_orders_statuses_updated_at',
        'idx_kirki_ecommerce_orders_order_status_payment_status_created_at' => 'idx_kirki_ecommerce_orders_statuses_created_at',
    ];

    /**
     * Type prefixes for each kind of key.
     *
     * @var array<string, string>
     */
    protected static $type_prefixes = [
        'foreign' => 'fk',
        'unique' => 'uq',
        'index' => 'idx',
    ];

    /**
     * Get every table this plugin owns, without the WordPress table prefix.
     *
     * @return array<int, string>
     */
    public static function get_tables()
    {
        $prefix = static::get_table_prefix();

        $rows = DB::select(
            'select TABLE_NAME as name from information_schema.TABLES'
            . ' where TABLE_SCHEMA = database() and TABLE_NAME like %s'
            . ' order by TABLE_NAME asc',
            [$prefix . static::TABLE_NAMESPACE . '%']
        );

        return array_map(function ($row) use ($prefix) {
            return static::strip_prefix($row['name'], $prefix);
        }, (array) $rows);
    }

    /**
     * Get every non-primary index on a table, with the columns it covers in order.
     *
     * @param string $table The table name, without the WordPress table prefix.
     *
     * @return array<int, array{name: string, columns: array<int, string>, unique: bool}>
     */
    public static function get_indexes($table)
    {
        $rows = DB::select(
            'select INDEX_NAME as name, NON_UNIQUE as non_unique,'
            . ' group_concat(COLUMN_NAME order by SEQ_IN_INDEX separator ",") as columns'
            . ' from information_schema.STATISTICS'
            . ' where TABLE_SCHEMA = database() and TABLE_NAME = %s and INDEX_NAME <> "PRIMARY"'
            . ' group by INDEX_NAME, NON_UNIQUE'
            . ' order by INDEX_NAME asc',
            [static::get_table_prefix() . $table]
        );

        return array_map(function ($row) {
            return [
                'name' => $row['name'],
                'columns' => explode(',', $row['columns']),
                'unique' => (int) $row['non_unique'] === 0,
            ];
        }, (array) $rows);
    }

    /**
     * Get every foreign key declared on a table, with the definition needed to recreate it.
     *
     * Only constraints whose child table belongs to this plugin are returned, so a foreign key
     * another plugin declares against one of our tables is never touched.
     *
     * @param string $table The table name, without the WordPress table prefix.
     *
     * @return array<int, array{name: string, column: string, references: string, on: string, on_delete: string, on_update: string}>
     */
    public static function get_foreign_keys($table)
    {
        $prefix = static::get_table_prefix();

        $rows = DB::select(
            'select k.CONSTRAINT_NAME as name, k.COLUMN_NAME as column_name,'
            . ' k.REFERENCED_TABLE_NAME as referenced_table, k.REFERENCED_COLUMN_NAME as referenced_column,'
            . ' r.DELETE_RULE as delete_rule, r.UPDATE_RULE as update_rule'
            . ' from information_schema.KEY_COLUMN_USAGE k'
            . ' inner join information_schema.REFERENTIAL_CONSTRAINTS r'
            . ' on r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA'
            . ' and r.CONSTRAINT_NAME = k.CONSTRAINT_NAME'
            . ' and r.TABLE_NAME = k.TABLE_NAME'
            . ' where k.TABLE_SCHEMA = database() and k.TABLE_NAME = %s'
            . ' and k.REFERENCED_TABLE_NAME is not null'
            . ' order by k.CONSTRAINT_NAME asc, k.ORDINAL_POSITION asc',
            [$prefix . $table]
        );

        return array_map(function ($row) use ($prefix) {
            return [
                'name' => $row['name'],
                'column' => $row['column_name'],
                'references' => $row['referenced_column'],
                'on' => static::strip_prefix($row['referenced_table'], $prefix),
                'on_delete' => $row['delete_rule'],
                'on_update' => $row['update_rule'],
            ];
        }, (array) $rows);
    }

    /**
     * Derive the name a key is expected to carry.
     *
     * The scheme is `{fk|idx|uq}_{table}_{columns}`, where the table still carries its
     * kirki_ecommerce_ namespace. Foreign key names have to be unique across the whole database,
     * which this plugin shares with WordPress core and every other plugin, so the namespace is what
     * keeps a name like fk_kirki_ecommerce_products_brand_id from colliding with someone else's.
     *
     * @param string $table The table name, without the WordPress table prefix.
     * @param array $columns The columns the key covers, in order.
     * @param string $type One of foreign, unique or index.
     *
     * @return string
     *
     * @throws Exception
     */
    public static function expected_name($table, array $columns, $type)
    {
        if (!isset(static::$type_prefixes[$type])) {
            throw new Exception(sprintf('Unknown key type [%s].', $type)); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        $name = sprintf(
            '%s_%s_%s',
            static::$type_prefixes[$type],
            $table,
            implode('_', $columns)
        );

        if (isset(static::$name_overrides[$name])) {
            return static::$name_overrides[$name];
        }

        if (strlen($name) > static::MAX_KEY_NAME_LENGTH) {
            throw new Exception(sprintf(
                'Derived key name [%s] is %d characters, over the %d character limit. Add an override for it to %s::$name_overrides.',
                $name, // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
                strlen($name), // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
                static::MAX_KEY_NAME_LENGTH, // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
                static::class
            ));
        }

        return $name;
    }

    /**
     * Get the WordPress table prefix.
     *
     * @return string
     */
    protected static function get_table_prefix()
    {
        return DB::connection()->get_table_prefix();
    }

    /**
     * Remove a leading prefix from a name when present.
     *
     * @param string $name The name.
     * @param string $prefix The prefix to remove.
     *
     * @return string
     */
    protected static function strip_prefix($name, $prefix)
    {
        if ($prefix !== '' && strpos($name, $prefix) === 0) {
            return substr($name, strlen($prefix));
        }

        return $name;
    }
}
