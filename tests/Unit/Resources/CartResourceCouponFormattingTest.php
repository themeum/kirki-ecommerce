<?php

namespace Kirki\Ecommerce\Tests\Unit\Resources;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Models\CartItem;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Resources\Cart\CartResource;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\collection;

class CartResourceCouponFormattingTest extends TestCase
{
    protected CartResource $resource;

    protected function setUp(): void
    {
        parent::setUp();

        $this->bind_money_dependencies();
        app()->alias('money', MoneyManager::class);

        $this->resource = new CartResource([]);
    }

    // Every helper call below passes null for $display_currency: a real target
    // currency routes through Money's DB-backed exchange-rate lookup, which this
    // lightweight container can't satisfy. These tests exercise the new
    // filtering/aggregation logic, not Money's currency conversion - that path
    // is already covered end-to-end by CartApiTest's integration tests, which
    // always call CartResource with a real resolved display currency.

    protected function make_coupon(string $code, string $discount_target): Coupon
    {
        $coupon = new Coupon();
        $coupon->code = $code;
        $coupon->title = $code . ' Title';
        $coupon->discount_target = $discount_target;
        $coupon->discount_value_type = 'fixed';
        $coupon->discount_amount_percentage = null;
        $coupon->base_discount_amount_fixed = 500;

        return $coupon;
    }

    /**
     * @param array<int, int> $item_discounts
     */
    protected function make_coupon_result(Coupon $coupon, array $item_discounts): CouponDiscountResultDTO
    {
        $result = new CouponDiscountResultDTO();
        $result->coupon = $coupon;
        $result->item_discounts = $item_discounts;
        $result->total_discount = array_sum($item_discounts);

        return $result;
    }

    protected function make_cart_item(int $variant_id, string $product_status, bool $is_visible): CartItem
    {
        $product = new Product(['title' => 'Widget', 'slug' => 'widget', 'status' => $product_status]);
        $product->set_relation('categories', collection([]));
        $product->set_relation('media', collection([]));

        $variant = new Variant([
            'base_price' => 1000,
            'base_sale_price' => null,
            'media' => null,
            'available_quantity' => 10,
            'in_stock' => true,
            'track_inventory' => true,
            'allow_back_order' => false,
            'has_limit_per_order' => false,
            'max_per_order' => null,
            'is_visible' => $is_visible,
        ]);
        $variant->set_relation('product', $product);
        $variant->set_relation('attribute_values', collection([]));

        $item = new CartItem(['variant_id' => $variant_id, 'quantity' => 1]);
        $item->set_relation('product', $product);
        $item->set_relation('variant', $variant);

        return $item;
    }

    protected function make_calculation_result(int $variant_id, int $catalog_regular_price = 1000, int $catalog_sale_price = 1000, ?int $catalog_product_coupon_discounted_subtotal = null): CalculationResultDTO
    {
        $calculated_item = new CalculationItemDTO();
        $calculated_item->variant_id = $variant_id;
        $calculated_item->quantity = 1;
        $calculated_item->base_catalog_regular_price = $catalog_regular_price;
        $calculated_item->base_catalog_sale_price = $catalog_sale_price;
        $calculated_item->base_catalog_product_coupon_discounted_subtotal = $catalog_product_coupon_discounted_subtotal ?? $catalog_sale_price;

        $result = new CalculationResultDTO();
        $result->items = [$variant_id => $calculated_item];

        return $result;
    }

    protected function call(string $method, ...$arguments)
    {
        $reflection = new \ReflectionClass(CartResource::class);
        $method_reflection = $reflection->getMethod($method);
        $method_reflection->setAccessible(true);

        return $method_reflection->invoke($this->resource, ...$arguments);
    }

    // get_applied_product_coupons_for_item

    public function test_lists_the_product_coupon_that_discounted_the_item(): void
    {
        $coupon = $this->make_coupon('SAVE5', DiscountTarget::PRODUCTS);
        $coupon_results = [$this->make_coupon_result($coupon, [101 => 500])];

        $applied = $this->call('get_applied_product_coupons_for_item', $coupon_results, 101, 'USD', null);

        $this->assertCount(1, $applied);
        $this->assertSame('SAVE5', $applied[0]['code']);
        $this->assertSame('SAVE5 Title', $applied[0]['title']);
        $this->assertSame(5.0, $applied[0]['display_discount_amount_money_object']->raw);
        $this->assertSame(5.0, $applied[0]['display_discount_amount_fixed_money_object']->raw);
    }

    public function test_excludes_order_scoped_coupons_from_the_applied_list(): void
    {
        $order_coupon = $this->make_coupon('ORDER10', DiscountTarget::ORDER);
        $coupon_results = [$this->make_coupon_result($order_coupon, [101 => 300])];

        $this->assertSame([], $this->call('get_applied_product_coupons_for_item', $coupon_results, 101, 'USD', null));
    }

    public function test_excludes_product_coupons_that_did_not_discount_this_item(): void
    {
        $coupon = $this->make_coupon('SAVE5', DiscountTarget::PRODUCTS);
        $coupon_results = [$this->make_coupon_result($coupon, [999 => 500])];

        $this->assertSame([], $this->call('get_applied_product_coupons_for_item', $coupon_results, 101, 'USD', null));
    }

    public function test_excludes_a_product_coupon_clamped_down_to_zero_for_this_item(): void
    {
        $coupon = $this->make_coupon('CLAMPED', DiscountTarget::PRODUCTS);
        $coupon_results = [$this->make_coupon_result($coupon, [101 => 0])];

        $this->assertSame([], $this->call('get_applied_product_coupons_for_item', $coupon_results, 101, 'USD', null));
    }

    public function test_lists_multiple_stacked_product_coupons_as_separate_entries(): void
    {
        $coupon_a = $this->make_coupon('A', DiscountTarget::PRODUCTS);
        $coupon_b = $this->make_coupon('B', DiscountTarget::PRODUCTS);
        $coupon_results = [
            $this->make_coupon_result($coupon_a, [101 => 200]),
            $this->make_coupon_result($coupon_b, [101 => 150]),
        ];

        $applied = $this->call('get_applied_product_coupons_for_item', $coupon_results, 101, 'USD', null);

        $this->assertCount(2, $applied);
        $this->assertEqualsCanonicalizing(['A', 'B'], array_column($applied, 'code'));
    }

    // format_tax_breakdown

    public function test_aggregates_tax_amounts_by_name_across_multiple_entries(): void
    {
        $tax_items = [
            TaxLineDTO::from_array(['name' => 'GST', 'rate' => 9, 'base_amount' => 100]),
            TaxLineDTO::from_array(['name' => 'GST', 'rate' => 9, 'base_amount' => 50]),
            TaxLineDTO::from_array(['name' => 'IST', 'rate' => 5, 'base_amount' => 30]),
        ];

        $breakdown = $this->call('format_tax_breakdown', $tax_items, 'USD', null);

        $this->assertCount(2, $breakdown);

        $by_name = [];
        foreach ($breakdown as $entry) {
            $by_name[$entry['name']] = $entry;
        }

        $this->assertSame(1.5, $by_name['GST']['display_amount_money_object']->raw);
        $this->assertSame(9, $by_name['GST']['rate']);
        $this->assertSame(0.3, $by_name['IST']['display_amount_money_object']->raw);
    }

    public function test_excludes_zero_amount_tax_entries(): void
    {
        $tax_items = [
            TaxLineDTO::from_array(['name' => 'Tax', 'rate' => 0, 'base_amount' => 0]),
        ];

        $this->assertSame([], $this->call('format_tax_breakdown', $tax_items, 'USD', null));
    }

    public function test_returns_empty_array_for_no_tax_items(): void
    {
        $this->assertSame([], $this->call('format_tax_breakdown', [], 'USD', null));
    }

    public function test_keeps_shipping_and_product_tax_lines_independent_when_formatted_separately(): void
    {
        $product_tax = [TaxLineDTO::from_array(['name' => 'VAT', 'rate' => 20, 'base_amount' => 1000])];
        $shipping_tax = [TaxLineDTO::from_array(['name' => 'VAT', 'rate' => 20, 'base_amount' => 100])];

        $product_breakdown = $this->call('format_tax_breakdown', $product_tax, 'USD', null);
        $shipping_breakdown = $this->call('format_tax_breakdown', $shipping_tax, 'USD', null);

        $this->assertSame(10.0, $product_breakdown[0]['display_amount_money_object']->raw);
        $this->assertSame(1.0, $shipping_breakdown[0]['display_amount_money_object']->raw);
    }

    // prepare_items - is_available

    public function test_reports_item_as_available_when_product_published_and_variant_visible(): void
    {
        $item = $this->make_cart_item(101, ProductStatus::PUBLISHED, true);
        $result = $this->make_calculation_result(101);

        $items = $this->call('prepare_items', [$item], $result, null);

        $this->assertTrue($items[0]['product']['is_available']);
    }

    public function test_reports_item_as_unavailable_when_product_is_draft(): void
    {
        $item = $this->make_cart_item(101, ProductStatus::DRAFT, true);
        $result = $this->make_calculation_result(101);

        $items = $this->call('prepare_items', [$item], $result, null);

        $this->assertFalse($items[0]['product']['is_available']);
    }

    public function test_reports_item_as_unavailable_when_product_is_trashed(): void
    {
        $item = $this->make_cart_item(101, ProductStatus::TRASHED, true);
        $result = $this->make_calculation_result(101);

        $items = $this->call('prepare_items', [$item], $result, null);

        $this->assertFalse($items[0]['product']['is_available']);
    }

    public function test_reports_item_as_unavailable_when_variant_is_not_visible(): void
    {
        $item = $this->make_cart_item(101, ProductStatus::PUBLISHED, false);
        $result = $this->make_calculation_result(101);

        $items = $this->call('prepare_items', [$item], $result, null);

        $this->assertFalse($items[0]['product']['is_available']);
    }

    // prepare_items - subtotal and strikethrough read the catalog figures

    public function test_order_coupon_under_tax_inclusive_pricing_does_not_change_the_item_subtotal(): void
    {
        // 110.00 including 10% tax with a 50% order-wide coupon: the engine
        // lowers the tax to 5.00, but the item's catalog figures stay 110.00.
        $item = $this->make_cart_item(101, ProductStatus::PUBLISHED, true);
        $result = $this->make_calculation_result(101, 11000, 11000);
        $result->items[101]->base_subtotal = 10000;
        $result->items[101]->base_tax_amount = 500;

        $items = $this->call('prepare_items', [$item], $result, null);

        $this->assertSame(110.0, $items[0]['display_subtotal_money_object']->raw);
        $this->assertNull($items[0]['display_strikethrough_price_money_object']);
        $this->assertSame(11000, $this->call('get_items_subtotal', $result->items));
    }

    public function test_subtotal_is_the_total_after_product_coupons(): void
    {
        $item = $this->make_cart_item(101, ProductStatus::PUBLISHED, true);
        $result = $this->make_calculation_result(101, 6000, 5000, 4500);

        $items = $this->call('prepare_items', [$item], $result, null);

        $this->assertSame(45.0, $items[0]['display_subtotal_money_object']->raw);
        // A product coupon strikes through the sale total, not the regular total.
        $this->assertSame(50.0, $items[0]['display_strikethrough_price_money_object']->raw);
    }

    public function test_strikethrough_is_the_regular_total_when_only_a_sale_applied(): void
    {
        $item = $this->make_cart_item(101, ProductStatus::PUBLISHED, true);
        $result = $this->make_calculation_result(101, 6000, 5000);

        $items = $this->call('prepare_items', [$item], $result, null);

        $this->assertSame(50.0, $items[0]['display_subtotal_money_object']->raw);
        $this->assertSame(60.0, $items[0]['display_strikethrough_price_money_object']->raw);
    }

    // get_items_subtotal

    public function test_items_subtotal_sums_every_items_total_after_product_coupons(): void
    {
        $item_a = new CalculationItemDTO();
        $item_a->base_catalog_product_coupon_discounted_subtotal = 4500;
        $item_b = new CalculationItemDTO();
        $item_b->base_catalog_product_coupon_discounted_subtotal = 1000;

        $this->assertSame(5500, $this->call('get_items_subtotal', [$item_a, $item_b]));
    }
}
