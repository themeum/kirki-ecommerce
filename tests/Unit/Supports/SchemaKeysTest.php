<?php

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use Exception;
use Kirki\Ecommerce\App\Supports\SchemaKeys;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class SchemaKeysTest extends TestCase
{
    public function test_derives_a_foreign_key_name(): void
    {
        $this->assertSame(
            'fk_kirki_ecommerce_cart_items_variant_id',
            SchemaKeys::expected_name('kirki_ecommerce_cart_items', ['variant_id'], 'foreign')
        );
    }

    public function test_derives_an_index_name(): void
    {
        $this->assertSame(
            'idx_kirki_ecommerce_carts_cart_token',
            SchemaKeys::expected_name('kirki_ecommerce_carts', ['cart_token'], 'index')
        );
    }

    public function test_derives_a_unique_key_name(): void
    {
        $this->assertSame(
            'uq_kirki_ecommerce_products_slug',
            SchemaKeys::expected_name('kirki_ecommerce_products', ['slug'], 'unique')
        );
    }

    public function test_joins_every_column_of_a_composite_index(): void
    {
        $this->assertSame(
            'idx_kirki_ecommerce_carts_user_id_created_at',
            SchemaKeys::expected_name('kirki_ecommerce_carts', ['user_id', 'created_at'], 'index')
        );
    }

    public function test_uses_the_override_for_a_name_over_the_identifier_limit(): void
    {
        $columns = ['is_active', 'start_datetime', 'has_end_datetime', 'end_datetime'];

        $name = SchemaKeys::expected_name('kirki_ecommerce_coupons', $columns, 'index');

        $this->assertSame('idx_kirki_ecommerce_coupons_active_window', $name);
        $this->assertLessThanOrEqual(SchemaKeys::MAX_KEY_NAME_LENGTH, strlen($name));
    }

    public function test_every_key_that_overflows_the_limit_has_a_short_enough_override(): void
    {
        $overflowing = [
            ['kirki_ecommerce_coupons', ['is_active', 'start_datetime', 'has_end_datetime', 'end_datetime'], 'index'],
            ['kirki_ecommerce_collection_translations', ['collection_id', 'language_code'], 'unique'],
            ['kirki_ecommerce_attribute_translations', ['attribute_id', 'language_code'], 'unique'],
            ['kirki_ecommerce_orders', ['payment_status', 'order_status', 'updated_at'], 'index'],
            ['kirki_ecommerce_orders', ['order_status', 'payment_status', 'created_at'], 'index'],
        ];

        $names = [];

        foreach ($overflowing as [$table, $columns, $type]) {
            $name = SchemaKeys::expected_name($table, $columns, $type);

            $this->assertLessThanOrEqual(SchemaKeys::MAX_KEY_NAME_LENGTH, strlen($name), $name);
            $names[] = $name;
        }

        $this->assertSame($names, array_unique($names), 'Two overrides resolved to the same name.');
    }

    public function test_refuses_to_truncate_an_unhandled_long_name(): void
    {
        $columns = array_fill(0, 12, 'a_reasonably_long_column_name');

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('over the 64 character limit');

        SchemaKeys::expected_name('kirki_ecommerce_products', $columns, 'index');
    }

    public function test_rejects_an_unknown_key_type(): void
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Unknown key type [spatial]');

        SchemaKeys::expected_name('kirki_ecommerce_products', ['slug'], 'spatial');
    }
}
