<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Services\AttributeValueService;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

class UtcDateTimeStorageTest extends RestTestCase
{
    /**
     * Seconds a freshly written time may differ from the current UTC time.
     *
     * @var int
     * @since 1.0.0
     */
    protected const TOLERANCE_SECONDS = 10;

    /**
     * Get a plugin table name with the database prefix.
     *
     * @param string $table Table name without the plugin prefix.
     *
     * @return string
     * @since 1.0.0
     */
    protected function table(string $table): string
    {
        return DB::connection()->get_table_prefix() . 'kirki_ecommerce_' . $table;
    }

    /**
     * Run a callback while the database session uses another time zone, then restore the old one.
     *
     * The test shares one database connection with the rest of the suite, so the zone is always restored.
     *
     * @param string   $zone     Offset such as +07:00.
     * @param callable $callback Code to run under that zone.
     *
     * @return void
     * @since 1.0.0
     */
    protected function with_session_time_zone(string $zone, callable $callback): void
    {
        $original = (string) (((array) DB::select('select @@session.time_zone as zone', []))[0]['zone'] ?? 'SYSTEM');

        DB::connection()->affecting_statement(sprintf("SET time_zone = '%s'", $zone));

        try {
            $callback();
        } finally {
            DB::connection()->affecting_statement(sprintf("SET time_zone = '%s'", $original));
        }
    }

    /**
     * Assert that a stored time string is the current UTC time.
     *
     * @param string $value Stored `Y-m-d H:i:s` value.
     * @param string $label What the value belongs to, for the failure message.
     *
     * @return void
     * @since 1.0.0
     */
    protected function assert_is_current_utc(string $value, string $label): void
    {
        $this->assertNotEmpty($value, $label . ' has no time.');
        $this->assertEqualsWithDelta(time(), strtotime($value . ' UTC'), self::TOLERANCE_SECONDS, $label . ' is not the current UTC time: ' . $value);
    }

    /**
     * Save an order row with a bulk insert, which skips the model timestamps.
     *
     * @param array $columns Extra column values.
     *
     * @return void
     * @since 1.0.0
     */
    protected function insert_order_row(array $columns): void
    {
        Order::query()->insert(array_merge(['currency_code' => 'USD', 'base_currency_code' => 'USD'], $columns));
    }

    /**
     * Read one column of the newest order row without any model cast.
     *
     * @param string $column Column name.
     *
     * @return string
     * @since 1.0.0
     */
    protected function newest_order_value(string $column): string
    {
        $rows = (array) DB::select(sprintf('select %s as value from %s order by id desc limit 1', $column, $this->table('orders')), []);

        return (string) ($rows[0]['value'] ?? '');
    }

    /**
     * No date column of any plugin table is a TIMESTAMP, created_at and updated_at included.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_no_date_column_is_a_timestamp(): void
    {
        $timestamps = (array) DB::select(
            "select concat(TABLE_NAME, '.', COLUMN_NAME) as name from information_schema.COLUMNS"
            . " where TABLE_SCHEMA = database() and TABLE_NAME like %s and DATA_TYPE = 'timestamp'",
            [DB::connection()->get_table_prefix() . 'kirki_ecommerce_%']
        );

        $this->assertSame([], array_column($timestamps, 'name'), 'Plugin date columns that are still timestamp.');
    }

    /**
     * The audit columns are DATETIME: created_at defaults to the current time and updated_at is nullable.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_audit_columns_are_datetime(): void
    {
        $rows = (array) DB::select(
            'select COLUMN_NAME as name, DATA_TYPE as type, IS_NULLABLE as nullable, COLUMN_DEFAULT as col_default'
            . ' from information_schema.COLUMNS where TABLE_SCHEMA = database() and TABLE_NAME = %s'
            . " and COLUMN_NAME in ('created_at', 'updated_at')",
            [$this->table('orders')]
        );
        $columns = array_column($rows, null, 'name');

        $this->assertSame('datetime', $columns['created_at']['type'] ?? null);
        $this->assertStringContainsStringIgnoringCase('current_timestamp', (string) ($columns['created_at']['col_default'] ?? ''));
        $this->assertSame('datetime', $columns['updated_at']['type'] ?? null);
        $this->assertSame('YES', $columns['updated_at']['nullable'] ?? null);
    }

    /**
     * A date after 2038 is stored and returned without change.
     *
     * MySQL stops a TIMESTAMP in 2038. Newer MariaDB stops it in 2106, so the second date makes the test fail there too.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_a_date_after_2038_round_trips(): void
    {
        foreach (['2040-06-01 12:00:00', '2110-06-01 12:00:00'] as $date) {
            $this->insert_order_row(['estimated_delivery_date' => $date]);

            $this->assertSame($date, $this->newest_order_value('estimated_delivery_date'));
        }
    }

    /**
     * A stored time reads back the same when the session time zone changes.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_a_stored_time_does_not_move_with_the_session_time_zone(): void
    {
        $this->with_session_time_zone('+00:00', function () {
            $this->insert_order_row(['paid_at' => '2026-01-15 10:00:00']);
        });

        $this->with_session_time_zone('+07:00', function () {
            $this->assertSame('2026-01-15 10:00:00', $this->newest_order_value('paid_at'));
        });
    }

    /**
     * Bulk inserts store the current UTC time even when the session time zone is not UTC.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_inserts_store_utc_under_another_session_time_zone(): void
    {
        $attribute_id = $this->request_attribute_id();
        Currency::create(['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'exchange_rate' => 1, 'is_base' => true]);

        $this->with_session_time_zone('+07:00', function () use ($attribute_id) {
            $currencies = app()->make(CurrencyService::class);
            $currencies->insert([['code' => 'EUR', 'name' => 'Euro', 'symbol' => 'E', 'exchange_rate' => 2, 'is_base' => false]]);
            $currencies->insert([['code' => 'GBP', 'name' => 'Pound', 'symbol' => 'P', 'exchange_rate' => 1, 'is_base' => true]]);

            $values = app()->make(AttributeValueService::class);
            $values->insert([
                ['attribute_id' => $attribute_id, 'value' => 'Red'],
                ['attribute_id' => $attribute_id, 'value' => 'Blue'],
            ]);
            $values->insert(['attribute_id' => $attribute_id, 'value' => 'Green']);

            $rows = array_merge(
                (array) DB::select(
                    sprintf("select code as name, created_at, updated_at from %s where code in ('EUR', 'GBP')", $this->table('currencies')),
                    []
                ),
                (array) DB::select(
                    sprintf('select value as name, created_at, updated_at from %s where attribute_id = %d', $this->table('attribute_values'), $attribute_id),
                    []
                )
            );

            $this->assertCount(5, $rows, 'Expected 2 currencies and 3 attribute values.');

            foreach ($rows as $row) {
                $this->assert_is_current_utc($row['created_at'], $row['name'] . ' created_at');
                $this->assert_is_current_utc($row['updated_at'], $row['name'] . ' updated_at');
            }
        });
    }

    /**
     * Create an attribute through the API and return its id.
     *
     * @return int
     * @since 1.0.0
     */
    protected function request_attribute_id(): int
    {
        $payload = $this->assert_api_success($this->request('POST', 'attributes', [
            'name' => 'Color ' . wp_generate_password(6, false),
            'slug' => 'color-' . wp_generate_password(6, false),
            'type' => 'color',
        ]), 201);

        return (int) $payload['data']['id'];
    }
}
