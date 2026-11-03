<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class MoneyColumnStorageTest extends RestTestCase
{
    use CreatesTestProducts;

    /**
     * Largest value a signed 32-bit column holds; the old money column limit.
     *
     * @var int
     * @since 1.0.0
     */
    protected const INT32_MAX = 2147483647;

    /**
     * Every money column, by table name without the plugin prefix.
     *
     * Add a new money column here when a table gets one. The order item and order lists name the
     * currency prefix once and expand it to an `invoiced_*` and a `base_*` column.
     *
     * @return array<string, string[]>
     * @since 1.0.0
     */
    protected function money_columns(): array
    {
        $both = static function (array $names): array {
            $columns = [];

            foreach (['invoiced', 'base'] as $currency) {
                foreach ($names as $name) {
                    $columns[] = $currency . '_' . $name;
                }
            }

            return $columns;
        };

        return [
            'orders' => $both([
                'subtotal',
                'shipping_total',
                'discount_total',
                'tax_total',
                'shipping_tax_amount',
                'total',
                'payment_provider_fee',
            ]),
            'order_items' => $both([
                'tax_total',
                'discount_amount',
                'price',
                'regular_price',
                'regular_tax_total',
                'catalog_regular_price',
                'catalog_sale_price',
                'catalog_product_coupon_discounted_subtotal',
                'discount_tax_total',
                'subtotal',
                'total',
            ]),
            'order_taxes' => ['invoiced_amount', 'base_amount'],
            'order_coupons' => ['base_max_discount_amount', 'invoiced_discount_amount', 'base_discount_amount'],
            'order_item_coupons' => ['invoiced_discount_amount', 'base_discount_amount'],
            'refunds' => ['invoiced_amount'],
            'coupons' => ['base_discount_amount_fixed', 'spend_condition_value'],
            'variants' => ['base_price', 'base_sale_price', 'base_cost_of_goods'],
        ];
    }

    /**
     * Count, limit and quantity columns that are not money and stay 32-bit.
     *
     * @return array<string, string[]>
     * @since 1.0.0
     */
    protected function count_columns(): array
    {
        return [
            'orders' => ['items_count'],
            'order_items' => ['quantity'],
            'coupons' => ['usage_limit', 'customer_limit'],
            'variants' => ['max_per_order'],
        ];
    }

    /**
     * Read the database type and comment of every column of a plugin table.
     *
     * @param string $table Table name without the plugin prefix.
     *
     * @return array<string, array{type: string, comment: string}> Keyed by column name.
     * @since 1.0.0
     */
    protected function read_columns(string $table): array
    {
        $rows = DB::select(
            'select COLUMN_NAME as name, DATA_TYPE as type, COLUMN_COMMENT as comment'
            . ' from information_schema.COLUMNS where TABLE_SCHEMA = database() and TABLE_NAME = %s',
            [DB::connection()->get_table_prefix() . 'kirki_ecommerce_' . $table]
        );

        $columns = [];

        foreach ((array) $rows as $row) {
            $columns[$row['name']] = ['type' => strtolower($row['type']), 'comment' => $row['comment']];
        }

        return $columns;
    }

    /**
     * Every money column is stored as a 64-bit integer.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_money_columns_are_bigint(): void
    {
        $wrong = [];

        foreach ($this->money_columns() as $table => $names) {
            $columns = $this->read_columns($table);

            foreach ($names as $name) {
                $type = $columns[$name]['type'] ?? 'missing';

                if ($type !== 'bigint') {
                    $wrong[] = $table . '.' . $name . ' is ' . $type;
                }
            }
        }

        $this->assertSame([], $wrong, 'Money columns that are not bigint.');
    }

    /**
     * Every money column comment states that the value is in minor units.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_money_column_comments_state_minor_units(): void
    {
        $wrong = [];

        foreach ($this->money_columns() as $table => $names) {
            $columns = $this->read_columns($table);

            foreach ($names as $name) {
                if (stripos($columns[$name]['comment'] ?? '', 'minor units') === false) {
                    $wrong[] = $table . '.' . $name;
                }
            }
        }

        $this->assertSame([], $wrong, 'Money columns whose comment does not say "minor units".');
    }

    /**
     * Count, limit and quantity columns keep their 32-bit type.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_count_columns_stay_int(): void
    {
        $wrong = [];

        foreach ($this->count_columns() as $table => $names) {
            $columns = $this->read_columns($table);

            foreach ($names as $name) {
                $type = $columns[$name]['type'] ?? 'missing';

                if ($type !== 'int') {
                    $wrong[] = $table . '.' . $name . ' is ' . $type;
                }
            }
        }

        $this->assertSame([], $wrong, 'Count columns that are not int.');
    }

    /**
     * The buy-x-get-y reward value is 64-bit as a precaution, because it may hold a money amount.
     *
     * The feature is not built yet, so the column has no unit comment and is not in the money list.
     * Move it there, with a "minor units" comment, once the feature stores an amount.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_reward_value_is_bigint(): void
    {
        $this->assertSame('bigint', $this->read_columns('coupons')['reward_value']['type'] ?? 'missing');
    }

    /**
     * An order total, a line price and discount, a variant price and a negative amount above the
     * old 32-bit limit come back exactly as they were saved.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_amounts_above_the_32_bit_limit_round_trip(): void
    {
        $order = Order::create([
            'currency_code' => 'IDR',
            'base_currency_code' => 'IDR',
            'invoiced_total' => 5000000000,
            'base_total' => 5000000000,
            'base_tax_total' => -2500000000,
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => null,
            'product_name' => 'Large item',
            'invoiced_price' => 3000000000,
            'base_price' => 3000000000,
            'invoiced_discount_amount' => 1000000000,
            'quantity' => 1,
        ]);

        $variant_id = $this->default_variant_id($this->create_product());
        Variant::query()->where('id', $variant_id)->update(['base_price' => 3000000000]);

        $saved_order = Order::query()->where('id', $order->id)->first();
        $saved_item = OrderItem::query()->where('id', $item->id)->first();
        $saved_variant = Variant::query()->where('id', $variant_id)->first();

        $this->assertGreaterThan(self::INT32_MAX, 5000000000);
        $this->assertSame(5000000000, (int) $saved_order->invoiced_total);
        $this->assertSame(5000000000, (int) $saved_order->base_total);
        $this->assertSame(-2500000000, (int) $saved_order->base_tax_total);
        $this->assertSame(3000000000, (int) $saved_item->invoiced_price);
        $this->assertSame(1000000000, (int) $saved_item->invoiced_discount_amount);
        $this->assertSame(3000000000, (int) $saved_variant->base_price);
    }
}
