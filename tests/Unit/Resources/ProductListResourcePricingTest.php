<?php

namespace Kirki\Ecommerce\Tests\Unit\Resources;

use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Resources\Product\ProductListResource;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\collection;

class ProductListResourcePricingTest extends TestCase
{
    // to_array() also needs AvailabilityService, Settings and Money's display
    // currency lookup, none of which this lightweight container provides. The
    // price selection lives in a protected method, so these tests call it
    // directly through reflection instead of going through to_array().

    protected function make_variant(int $id, int $base_price, ?int $base_sale_price = null): Variant
    {
        $variant = new Variant();
        $variant->id = $id;
        $variant->base_price = $base_price;
        $variant->base_sale_price = $base_sale_price;

        return $variant;
    }

    /**
     * @param Variant[] $variants
     */
    protected function resolve_lowest_priced_variant(array $variants): ?Variant
    {
        $resource = new ProductListResource(['variants' => collection($variants)]);

        $method = new \ReflectionMethod(ProductListResource::class, 'resolve_lowest_priced_variant');
        $method->setAccessible(true);

        return $method->invoke($resource);
    }

    public function test_picks_the_cheapest_variant_when_it_is_on_sale(): void
    {
        $on_sale = $this->make_variant(1, 100, 50);
        $regular = $this->make_variant(2, 60);

        $lowest = $this->resolve_lowest_priced_variant([$on_sale, $regular]);

        $this->assertSame($on_sale, $lowest);
        $this->assertSame(100, $lowest->base_price);
        $this->assertSame(50, $lowest->base_sale_price);
    }

    public function test_picks_the_cheapest_regular_variant_when_a_dearer_variant_is_on_sale(): void
    {
        $on_sale = $this->make_variant(1, 100, 90);
        $regular = $this->make_variant(2, 60);

        $lowest = $this->resolve_lowest_priced_variant([$on_sale, $regular]);

        $this->assertSame($regular, $lowest);
        $this->assertSame(60, $lowest->base_price);
        $this->assertNull($lowest->base_sale_price);
    }

    public function test_picks_the_lowest_regular_price_when_no_variant_is_on_sale(): void
    {
        $expensive = $this->make_variant(1, 100);
        $cheap = $this->make_variant(2, 40);
        $middle = $this->make_variant(3, 70);

        $this->assertSame($cheap, $this->resolve_lowest_priced_variant([$expensive, $cheap, $middle]));
    }

    public function test_returns_the_only_variant_with_its_regular_and_sale_price(): void
    {
        $variant = $this->make_variant(1, 100, 80);

        $this->assertSame($variant, $this->resolve_lowest_priced_variant([$variant]));
    }

    public function test_returns_the_only_variant_when_it_is_not_on_sale(): void
    {
        $variant = $this->make_variant(1, 100);

        $this->assertSame($variant, $this->resolve_lowest_priced_variant([$variant]));
    }

    public function test_ignores_a_sale_price_that_is_zero_or_not_below_the_regular_price(): void
    {
        $zero_sale = $this->make_variant(1, 50, 0);
        $not_a_discount = $this->make_variant(2, 40, 40);
        $inflated_sale = $this->make_variant(3, 30, 45);

        $this->assertSame($inflated_sale, $this->resolve_lowest_priced_variant([$zero_sale, $not_a_discount, $inflated_sale]));
    }

    public function test_prefers_the_lowest_regular_price_when_effective_prices_tie(): void
    {
        $discounted = $this->make_variant(1, 100, 50);
        $regular = $this->make_variant(2, 50);

        $this->assertSame($regular, $this->resolve_lowest_priced_variant([$discounted, $regular]));
    }

    public function test_prefers_the_first_variant_when_effective_and_regular_prices_tie(): void
    {
        $first = $this->make_variant(1, 50);
        $second = $this->make_variant(2, 50);

        $this->assertSame($first, $this->resolve_lowest_priced_variant([$first, $second]));
    }

    public function test_returns_null_when_the_product_has_no_variants(): void
    {
        $this->assertNull($this->resolve_lowest_priced_variant([]));
    }
}
