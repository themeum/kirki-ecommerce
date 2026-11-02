<?php

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use Kirki\Ecommerce\App\Supports\Weight;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class WeightTest extends TestCase
{
    /**
     * @param string|null $weight_unit Store weight unit; null leaves it unset.
     */
    protected function use_store_unit(?string $weight_unit): void
    {
        $this->bind_money_dependencies('USD', [], [], [
            'product' => $weight_unit === null ? [] : ['weight_unit' => $weight_unit],
        ]);
    }

    public function test_converts_kilograms_to_grams(): void
    {
        $this->assertEquals(1500, Weight::convert(1.5, 'kg', 'g'));
    }

    public function test_converts_pounds_to_kilograms(): void
    {
        $this->assertEqualsWithDelta(0.45359237, Weight::convert(1, 'lb', 'kg'), 1e-9);
    }

    public function test_converts_ounces_to_grams(): void
    {
        $this->assertEqualsWithDelta(28.349523125, Weight::convert(1, 'oz', 'g'), 1e-9);
    }

    public function test_converts_grams_to_pounds_and_ounces(): void
    {
        $this->assertEqualsWithDelta(1, Weight::convert(453.59237, 'g', 'lb'), 1e-9);
        $this->assertEqualsWithDelta(16, Weight::convert(453.59237, 'g', 'oz'), 1e-9);
    }

    public function test_returns_the_value_unchanged_for_the_same_unit(): void
    {
        $this->assertSame(2.5, Weight::convert(2.5, 'kg', 'kg'));
    }

    public function test_converts_to_the_store_unit_by_default(): void
    {
        $this->use_store_unit('kg');

        $this->assertEquals(0.5, Weight::convert(500, 'g'));
    }

    public function test_converts_to_a_store_unit_in_pounds(): void
    {
        $this->use_store_unit('lb');

        $this->assertEqualsWithDelta(1, Weight::convert(16, 'oz'), 1e-9);
    }

    public function test_treats_an_empty_unit_as_the_store_unit(): void
    {
        $this->use_store_unit('kg');

        $this->assertSame(2, Weight::convert(2, null));
        $this->assertSame(2, Weight::convert(2, ''));
    }

    public function test_leaves_the_value_unchanged_for_a_unit_that_is_not_a_weight_unit(): void
    {
        $this->use_store_unit('kg');

        $this->assertSame(3, Weight::convert(3, 'ml'));
    }

    public function test_leaves_the_value_unchanged_for_an_unknown_target_unit(): void
    {
        $this->assertSame(3, Weight::convert(3, 'kg', 'stone'));
    }

    public function test_leaves_the_value_unchanged_when_the_store_unit_is_not_set(): void
    {
        $this->use_store_unit(null);

        $this->assertSame(3, Weight::convert(3, 'g'));
    }
}
