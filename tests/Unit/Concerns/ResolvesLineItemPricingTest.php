<?php

namespace Kirki\Ecommerce\Tests\Unit\Concerns;

use Kirki\Ecommerce\App\Concerns\ResolvesLineItemPricing;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class ResolvesLineItemPricingTest extends TestCase
{
    protected function make_resolver()
    {
        return new class () {
            use ResolvesLineItemPricing {
                get_strikethrough_amount as public;
                get_order_item_strikethrough_amounts as public;
                get_unit_amount as public;
            }
        };
    }

    public function test_product_coupon_strikes_through_the_sale_total(): void
    {
        $this->assertSame(10000, $this->make_resolver()->get_strikethrough_amount(5000, 5000, 9000, 2));
    }

    public function test_sale_only_strikes_through_the_regular_total(): void
    {
        $this->assertSame(12000, $this->make_resolver()->get_strikethrough_amount(6000, 5000, 10000, 2));
    }

    public function test_sale_and_product_coupon_strike_through_the_sale_total(): void
    {
        $this->assertSame(10000, $this->make_resolver()->get_strikethrough_amount(6000, 5000, 9000, 2));
    }

    public function test_nothing_is_struck_through_without_a_sale_or_product_coupon(): void
    {
        $this->assertNull($this->make_resolver()->get_strikethrough_amount(5000, 5000, 10000, 2));
    }

    public function test_order_item_strikethrough_is_decided_from_base_figures(): void
    {
        // Converted separately, the invoiced sale total (3 x 67 = 201) exceeds
        // the invoiced subtotal (200), but the base figures show no coupon.
        $item = new OrderItem();
        $item->quantity = 3;
        $item->base_catalog_regular_price = 100;
        $item->base_catalog_sale_price = 100;
        $item->base_catalog_product_coupon_discounted_subtotal = 300;
        $item->invoiced_catalog_regular_price = 67;
        $item->invoiced_catalog_sale_price = 67;
        $item->invoiced_catalog_product_coupon_discounted_subtotal = 200;

        $this->assertSame(['invoiced' => null, 'base' => null], $this->make_resolver()->get_order_item_strikethrough_amounts($item));
    }

    public function test_order_item_strikethrough_shows_both_currencies(): void
    {
        $item = new OrderItem();
        $item->quantity = 2;
        $item->base_catalog_regular_price = 6000;
        $item->base_catalog_sale_price = 5000;
        $item->base_catalog_product_coupon_discounted_subtotal = 10000;
        $item->invoiced_catalog_regular_price = 600000;
        $item->invoiced_catalog_sale_price = 500000;
        $item->invoiced_catalog_product_coupon_discounted_subtotal = 1000000;

        $this->assertSame(['invoiced' => 1200000, 'base' => 12000], $this->make_resolver()->get_order_item_strikethrough_amounts($item));
    }

    public function test_unit_amount_rounds_up(): void
    {
        $resolver = $this->make_resolver();

        $this->assertSame(334, $resolver->get_unit_amount(1000, 3));
        $this->assertSame(3850, $resolver->get_unit_amount(7700, 2));
        $this->assertNull($resolver->get_unit_amount(null, 2));
    }
}
