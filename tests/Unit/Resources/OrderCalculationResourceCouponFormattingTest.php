<?php

namespace Kirki\Ecommerce\Tests\Unit\Resources;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
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

    // prepare_items: line, strikethrough and per-unit figures read the catalog figures

    protected function make_calculated_item(int $catalog_regular_price, int $catalog_sale_price, int $catalog_product_coupon_discounted_subtotal): CalculationItemDTO
    {
        $calculated_item = new CalculationItemDTO();
        $calculated_item->base_catalog_regular_price = $catalog_regular_price;
        $calculated_item->base_catalog_sale_price = $catalog_sale_price;
        $calculated_item->base_catalog_product_coupon_discounted_subtotal = $catalog_product_coupon_discounted_subtotal;

        return $calculated_item;
    }

    protected function prepare_single_item(CalculationItemDTO $calculated_item, int $quantity): array
    {
        $calculated_item->id = 1;
        $calculated_item->variant_id = 101;
        $calculated_item->quantity = $quantity;

        $result = new CalculationResultDTO();
        $result->items = [101 => $calculated_item];

        return $this->call('prepare_items', $result->items, $result)[0];
    }

    public function test_order_coupon_under_tax_inclusive_pricing_does_not_change_the_item_subtotal(): void
    {
        // 110.00 including 10% tax with a 50% order-wide coupon: the engine
        // lowers the tax to 5.00, but the item's catalog figures stay 110.00.
        $calculated_item = $this->make_calculated_item(11000, 11000, 11000);
        $calculated_item->base_subtotal = 10000;
        $calculated_item->base_tax_amount = 500;

        $prepared = $this->prepare_single_item($calculated_item, 1);
        $coupon_results = [$this->make_coupon_result($this->make_coupon('HALF', DiscountTarget::ORDER), [101 => 5500])];

        $this->assertSame(110.0, $prepared['base_subtotal_money_object']->raw);
        $this->assertNull($prepared['base_strikethrough_price_money_object']);
        $this->assertSame(11000, $this->call('get_items_subtotal', [101 => $calculated_item]));
        $this->assertSame(5500, $this->call('get_order_coupon_discount', $coupon_results));
    }

    public function test_unit_price_divides_the_line_subtotal_evenly(): void
    {
        $prepared = $this->prepare_single_item($this->make_calculated_item(3850, 3850, 7700), 2);

        $this->assertSame(38.5, $prepared['base_unit_price_money_object']->raw);
    }

    public function test_unit_price_rounds_up_when_the_line_subtotal_does_not_divide_evenly(): void
    {
        $prepared = $this->prepare_single_item($this->make_calculated_item(334, 334, 1000), 3);

        $this->assertSame(3.34, $prepared['base_unit_price_money_object']->raw);
        $this->assertSame(10.0, $prepared['base_subtotal_money_object']->raw);
    }

    public function test_product_coupon_strikes_through_the_sale_total(): void
    {
        $prepared = $this->prepare_single_item($this->make_calculated_item(4000, 4000, 7000), 2);

        $this->assertSame(70.0, $prepared['base_subtotal_money_object']->raw);
        $this->assertSame(35.0, $prepared['base_unit_price_money_object']->raw);
        $this->assertSame(80.0, $prepared['base_strikethrough_price_money_object']->raw);
        $this->assertSame(40.0, $prepared['base_unit_strikethrough_price_money_object']->raw);
    }

    public function test_unit_strikethrough_is_the_regular_price_when_on_sale(): void
    {
        $prepared = $this->prepare_single_item($this->make_calculated_item(5000, 4500, 9000), 2);

        $this->assertSame(100.0, $prepared['base_strikethrough_price_money_object']->raw);
        $this->assertSame(50.0, $prepared['base_unit_strikethrough_price_money_object']->raw);
    }

    public function test_unit_strikethrough_is_null_when_the_line_strikethrough_is_null(): void
    {
        $prepared = $this->prepare_single_item($this->make_calculated_item(2000, 2000, 4000), 2);

        $this->assertNull($prepared['base_strikethrough_price_money_object']);
        $this->assertNull($prepared['base_unit_strikethrough_price_money_object']);
    }
}
