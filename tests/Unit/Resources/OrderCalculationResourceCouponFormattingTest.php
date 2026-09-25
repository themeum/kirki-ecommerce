<?php

namespace Kirki\Ecommerce\Tests\Unit\Resources;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Resources\Order\OrderCalculationResource;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\app;

class OrderCalculationResourceCouponFormattingTest extends TestCase
{
    protected OrderCalculationResource $resource;

    protected function setUp(): void
    {
        parent::setUp();

        $this->bind_money_dependencies();
        app()->alias('money', MoneyManager::class);

        $this->resource = new OrderCalculationResource([]);
    }

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

    protected function call(string $method, ...$arguments)
    {
        $reflection = new \ReflectionClass(OrderCalculationResource::class);
        $method_reflection = $reflection->getMethod($method);
        $method_reflection->setAccessible(true);

        return $method_reflection->invoke($this->resource, ...$arguments);
    }

    // get_product_coupon_discount_for_item

    public function test_sums_only_product_scoped_coupon_discounts_for_the_item(): void
    {
        $product_coupon = $this->make_coupon('PRODUCT10', DiscountTarget::PRODUCTS);
        $order_coupon = $this->make_coupon('ORDER10', DiscountTarget::ORDER);

        $coupon_results = [
            $this->make_coupon_result($product_coupon, [101 => 500]),
            $this->make_coupon_result($order_coupon, [101 => 300]),
        ];

        $this->assertSame(500, $this->call('get_product_coupon_discount_for_item', $coupon_results, 101));
    }

    public function test_sums_multiple_stacked_product_coupons_on_the_same_item(): void
    {
        $coupon_a = $this->make_coupon('A', DiscountTarget::PRODUCTS);
        $coupon_b = $this->make_coupon('B', DiscountTarget::PRODUCTS);

        $coupon_results = [
            $this->make_coupon_result($coupon_a, [101 => 200]),
            $this->make_coupon_result($coupon_b, [101 => 150]),
        ];

        $this->assertSame(350, $this->call('get_product_coupon_discount_for_item', $coupon_results, 101));
    }

    public function test_returns_zero_when_only_an_order_scoped_coupon_discounts_the_item(): void
    {
        $order_coupon = $this->make_coupon('ORDER10', DiscountTarget::ORDER);
        $coupon_results = [$this->make_coupon_result($order_coupon, [101 => 300])];

        $this->assertSame(0, $this->call('get_product_coupon_discount_for_item', $coupon_results, 101));
    }

    public function test_returns_zero_when_item_has_no_discount_at_all(): void
    {
        $product_coupon = $this->make_coupon('PRODUCT10', DiscountTarget::PRODUCTS);
        $coupon_results = [$this->make_coupon_result($product_coupon, [999 => 500])];

        $this->assertSame(0, $this->call('get_product_coupon_discount_for_item', $coupon_results, 101));
    }

    public function test_ignores_free_shipping_coupon_results_which_carry_no_item_discounts(): void
    {
        $free_shipping = $this->make_coupon('FREESHIP', DiscountTarget::ORDER);
        $result = new CouponDiscountResultDTO();
        $result->coupon = $free_shipping;
        $result->shipping_discount = 500;
        $result->total_discount = 500;

        $this->assertSame(0, $this->call('get_product_coupon_discount_for_item', [$result], 101));
    }

    public function test_returns_zero_for_an_empty_coupon_results_list(): void
    {
        $this->assertSame(0, $this->call('get_product_coupon_discount_for_item', [], 101));
    }

    // get_applied_product_coupons_for_item

    public function test_lists_the_product_coupon_that_discounted_the_item(): void
    {
        $coupon = $this->make_coupon('SAVE5', DiscountTarget::PRODUCTS);
        $coupon_results = [$this->make_coupon_result($coupon, [101 => 500])];

        $applied = $this->call('get_applied_product_coupons_for_item', $coupon_results, 101);

        $this->assertCount(1, $applied);
        $this->assertSame('SAVE5', $applied[0]['code']);
        $this->assertSame('SAVE5 Title', $applied[0]['title']);
        $this->assertSame(5.0, $applied[0]['base_discount_amount_money_object']->raw);
        $this->assertSame(5.0, $applied[0]['base_discount_amount_fixed_money_object']->raw);
        $this->assertArrayNotHasKey('display_discount_amount_money_object', $applied[0]);
    }

    public function test_excludes_order_scoped_coupons_from_the_applied_list(): void
    {
        $order_coupon = $this->make_coupon('ORDER10', DiscountTarget::ORDER);
        $coupon_results = [$this->make_coupon_result($order_coupon, [101 => 300])];

        $this->assertSame([], $this->call('get_applied_product_coupons_for_item', $coupon_results, 101));
    }

    public function test_excludes_product_coupons_that_did_not_discount_this_item(): void
    {
        $coupon = $this->make_coupon('SAVE5', DiscountTarget::PRODUCTS);
        $coupon_results = [$this->make_coupon_result($coupon, [999 => 500])];

        $this->assertSame([], $this->call('get_applied_product_coupons_for_item', $coupon_results, 101));
    }

    public function test_excludes_a_product_coupon_clamped_down_to_zero_for_this_item(): void
    {
        $coupon = $this->make_coupon('CLAMPED', DiscountTarget::PRODUCTS);
        $coupon_results = [$this->make_coupon_result($coupon, [101 => 0])];

        $this->assertSame([], $this->call('get_applied_product_coupons_for_item', $coupon_results, 101));
    }

    public function test_lists_multiple_stacked_product_coupons_as_separate_entries(): void
    {
        $coupon_a = $this->make_coupon('A', DiscountTarget::PRODUCTS);
        $coupon_b = $this->make_coupon('B', DiscountTarget::PRODUCTS);
        $coupon_results = [
            $this->make_coupon_result($coupon_a, [101 => 200]),
            $this->make_coupon_result($coupon_b, [101 => 150]),
        ];

        $applied = $this->call('get_applied_product_coupons_for_item', $coupon_results, 101);

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

        $breakdown = $this->call('format_tax_breakdown', $tax_items);

        $this->assertCount(2, $breakdown);

        $by_name = [];
        foreach ($breakdown as $entry) {
            $by_name[$entry['name']] = $entry;
        }

        $this->assertSame(1.5, $by_name['GST']['base_amount_money_object']->raw);
        $this->assertSame(9, $by_name['GST']['rate']);
        $this->assertSame(0.3, $by_name['IST']['base_amount_money_object']->raw);
        $this->assertArrayNotHasKey('display_amount_money_object', $by_name['GST']);
    }

    public function test_excludes_zero_amount_tax_entries(): void
    {
        $tax_items = [
            TaxLineDTO::from_array(['name' => 'Tax', 'rate' => 0, 'base_amount' => 0]),
        ];

        $this->assertSame([], $this->call('format_tax_breakdown', $tax_items));
    }

    public function test_returns_empty_array_for_no_tax_items(): void
    {
        $this->assertSame([], $this->call('format_tax_breakdown', []));
    }

    public function test_keeps_shipping_and_product_tax_lines_independent_when_formatted_separately(): void
    {
        $product_tax = [TaxLineDTO::from_array(['name' => 'VAT', 'rate' => 20, 'base_amount' => 1000])];
        $shipping_tax = [TaxLineDTO::from_array(['name' => 'VAT', 'rate' => 20, 'base_amount' => 100])];

        $product_breakdown = $this->call('format_tax_breakdown', $product_tax);
        $shipping_breakdown = $this->call('format_tax_breakdown', $shipping_tax);

        $this->assertSame(10.0, $product_breakdown[0]['base_amount_money_object']->raw);
        $this->assertSame(1.0, $shipping_breakdown[0]['base_amount_money_object']->raw);
    }

    // format_coupon_results

    public function test_format_coupon_results_has_no_display_currency_fields(): void
    {
        $coupon = $this->make_coupon('SAVE5', DiscountTarget::PRODUCTS);
        $results = $this->call('format_coupon_results', [$this->make_coupon_result($coupon, [101 => 500])]);

        $this->assertSame(5.0, $results[0]['base_discount_amount_money_object']->raw);
        $this->assertArrayNotHasKey('display_discount_amount_money_object', $results[0]);
        $this->assertArrayNotHasKey('display_discount_amount_fixed_money_object', $results[0]);
    }

    // prepare_strikethrough_price / derive_inclusive_amount / derive_inclusive_amount_at_rate / get_items_tax_total

    protected function make_calculated_item(int $base_subtotal, int $base_product_total, int $base_tax_amount = 0): object
    {
        $item = new \Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO();
        $item->base_subtotal = $base_subtotal;
        $item->base_product_total = $base_product_total;
        $item->base_tax_amount = $base_tax_amount;

        return $item;
    }

    public function test_strikethrough_is_the_regular_price_total_when_only_a_sale_applied(): void
    {
        // No discount: current-price exclusive is the subtotal (4500), taxed at 450 (10%).
        $calculated_item = $this->make_calculated_item(4500, 6000, 450);

        $strikethrough = $this->call('prepare_strikethrough_price', $calculated_item, 0, 4500);

        $this->assertSame(60.0, $strikethrough['exclusive']->raw);
        // Scaled at the same 10% rate: 6000 * 1.1 = 6600.
        $this->assertSame(66.0, $strikethrough['inclusive']->raw);
    }

    public function test_strikethrough_is_null_when_there_is_no_sale_and_no_product_coupon(): void
    {
        $calculated_item = $this->make_calculated_item(4000, 4000);

        $strikethrough = $this->call('prepare_strikethrough_price', $calculated_item, 0, 4000);

        $this->assertNull($strikethrough['exclusive']);
        $this->assertNull($strikethrough['inclusive']);
    }

    public function test_derive_inclusive_amount_adds_the_tax_directly(): void
    {
        $this->assertSame(1200, $this->call('derive_inclusive_amount', 1000, 200));
    }

    public function test_derive_inclusive_amount_at_rate_scales_by_the_current_price_rate(): void
    {
        $this->assertSame(5500, $this->call('derive_inclusive_amount_at_rate', 5000, 1000, 100));
    }

    public function test_get_items_tax_total_sums_every_items_own_tax(): void
    {
        $items = [
            101 => $this->make_calculated_item(4500, 6000, 450),
            102 => $this->make_calculated_item(1000, 1000, 100),
        ];

        $this->assertSame(550, $this->call('get_items_tax_total', $items));
    }
}
