<?php

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Supports\UnitPrice;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\app;

class UnitPriceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->bind_money_dependencies();
        app()->alias('money', MoneyManager::class);
    }

    /**
     * @param array<string, mixed> $attributes
     */
    protected function make_variant(array $attributes): Variant
    {
        $variant = new Variant();

        foreach ($attributes as $key => $value) {
            $variant->{$key} = $value;
        }

        return $variant;
    }

    public function test_formats_price_per_compatible_base_unit(): void
    {
        $variant = $this->make_variant([
            'show_unit_price' => true,
            'base_price' => 3000,
            'base_sale_price' => null,
            'base_unit' => 'kg',
            'base_unit_amount' => 1,
            'total_unit' => 'kg',
            'total_unit_amount' => 1,
        ]);

        // null display currency avoids Money's DB-backed exchange-rate lookup, the
        // same workaround CartResourceCouponFormattingTest uses; real currency
        // conversion is covered by VariantApiTest at the integration level.
        $this->assertSame('$30.00/1kg', UnitPrice::make($variant, null));
    }

    public function test_prefers_sale_price_over_base_price(): void
    {
        $variant = $this->make_variant([
            'show_unit_price' => true,
            'base_price' => 3000,
            'base_sale_price' => 2000,
            'base_unit' => 'kg',
            'base_unit_amount' => 1,
            'total_unit' => 'kg',
            'total_unit_amount' => 1,
        ]);

        $this->assertSame('$20.00/1kg', UnitPrice::make($variant, null));
    }

    public function test_normalizes_different_units_within_the_same_measurement_group(): void
    {
        $variant = $this->make_variant([
            'show_unit_price' => true,
            'base_price' => 3000,
            'base_sale_price' => null,
            'base_unit' => 'g',
            'base_unit_amount' => 100,
            'total_unit' => 'kg',
            'total_unit_amount' => 1,
        ]);

        $this->assertSame('$3.00/100g', UnitPrice::make($variant, null));
    }

    public function test_returns_null_when_unit_pricing_disabled(): void
    {
        $variant = $this->make_variant([
            'show_unit_price' => false,
            'base_price' => 3000,
            'base_unit' => 'kg',
            'base_unit_amount' => 1,
            'total_unit' => 'kg',
            'total_unit_amount' => 1,
        ]);

        $this->assertNull(UnitPrice::make($variant, 'USD'));
    }

    public function test_returns_null_for_unrecognized_unit_code(): void
    {
        $variant = $this->make_variant([
            'show_unit_price' => true,
            'base_price' => 3000,
            'base_unit' => 'lb',
            'base_unit_amount' => 1,
            'total_unit' => 'lb',
            'total_unit_amount' => 1,
        ]);

        $this->assertNull(UnitPrice::make($variant, 'USD'));
    }

    public function test_returns_null_for_incompatible_measurement_groups(): void
    {
        $variant = $this->make_variant([
            'show_unit_price' => true,
            'base_price' => 3000,
            'base_unit' => 'kg',
            'base_unit_amount' => 1,
            'total_unit' => 'l',
            'total_unit_amount' => 1,
        ]);

        $this->assertNull(UnitPrice::make($variant, 'USD'));
    }

    public function test_returns_null_for_zero_base_unit_amount(): void
    {
        $variant = $this->make_variant([
            'show_unit_price' => true,
            'base_price' => 3000,
            'base_unit' => 'kg',
            'base_unit_amount' => 0,
            'total_unit' => 'kg',
            'total_unit_amount' => 1,
        ]);

        $this->assertNull(UnitPrice::make($variant, 'USD'));
    }

    public function test_returns_null_when_unit_fields_are_missing(): void
    {
        $variant = $this->make_variant([
            'show_unit_price' => true,
            'base_price' => 3000,
            'base_unit' => null,
            'base_unit_amount' => null,
            'total_unit' => null,
            'total_unit_amount' => null,
        ]);

        $this->assertNull(UnitPrice::make($variant, 'USD'));
    }
}
