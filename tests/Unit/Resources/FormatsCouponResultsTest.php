<?php

namespace Kirki\Ecommerce\Tests\Unit\Resources;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxItemResultDTO;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Resources\Concerns\FormatsCouponResults;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\app;

class FormatsCouponResultsTest extends TestCase
{
    use FormatsCouponResults;

    protected function setUp(): void
    {
        parent::setUp();

        $this->bind_money_dependencies();
        app()->alias('money', MoneyManager::class);
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

    // get_product_coupon_discount_for_item

    public function test_sums_only_product_scoped_coupon_discounts_for_the_item(): void
    {
        $product_coupon = $this->make_coupon('PRODUCT10', DiscountTarget::PRODUCTS);
        $order_coupon = $this->make_coupon('ORDER10', DiscountTarget::ORDER);

        $coupon_results = [
            $this->make_coupon_result($product_coupon, [101 => 500]),
            $this->make_coupon_result($order_coupon, [101 => 300]),
        ];

        $this->assertSame(500, $this->get_product_coupon_discount_for_item($coupon_results, 101));
    }

    public function test_sums_multiple_stacked_product_coupons_on_the_same_item(): void
    {
        $coupon_a = $this->make_coupon('A', DiscountTarget::PRODUCTS);
        $coupon_b = $this->make_coupon('B', DiscountTarget::PRODUCTS);

        $coupon_results = [
            $this->make_coupon_result($coupon_a, [101 => 200]),
            $this->make_coupon_result($coupon_b, [101 => 150]),
        ];

        $this->assertSame(350, $this->get_product_coupon_discount_for_item($coupon_results, 101));
    }

    public function test_returns_zero_when_only_an_order_scoped_coupon_discounts_the_item(): void
    {
        $order_coupon = $this->make_coupon('ORDER10', DiscountTarget::ORDER);
        $coupon_results = [$this->make_coupon_result($order_coupon, [101 => 300])];

        $this->assertSame(0, $this->get_product_coupon_discount_for_item($coupon_results, 101));
    }

    public function test_returns_zero_when_item_has_no_discount_at_all(): void
    {
        $product_coupon = $this->make_coupon('PRODUCT10', DiscountTarget::PRODUCTS);
        $coupon_results = [$this->make_coupon_result($product_coupon, [999 => 500])];

        $this->assertSame(0, $this->get_product_coupon_discount_for_item($coupon_results, 101));
    }

    public function test_ignores_free_shipping_coupon_results_which_carry_no_item_discounts(): void
    {
        $free_shipping = $this->make_coupon('FREESHIP', DiscountTarget::ORDER);
        $result = new CouponDiscountResultDTO();
        $result->coupon = $free_shipping;
        $result->shipping_discount = 500;
        $result->total_discount = 500;

        $this->assertSame(0, $this->get_product_coupon_discount_for_item([$result], 101));
    }

    public function test_returns_zero_for_an_empty_coupon_results_list(): void
    {
        $this->assertSame(0, $this->get_product_coupon_discount_for_item([], 101));
    }

    // get_applied_product_coupons_for_item

    public function test_lists_the_product_coupon_that_discounted_the_item(): void
    {
        $coupon = $this->make_coupon('SAVE5', DiscountTarget::PRODUCTS);
        $coupon_results = [$this->make_coupon_result($coupon, [101 => 500])];

        $applied = $this->get_applied_product_coupons_for_item($coupon_results, 101, 'USD', null);

        $this->assertCount(1, $applied);
        $this->assertSame('SAVE5', $applied[0]['code']);
        $this->assertSame('SAVE5 Title', $applied[0]['title']);
        $this->assertSame(5.0, $applied[0]['display_discount_amount_money_object']->raw);
    }

    public function test_excludes_order_scoped_coupons_from_the_applied_list(): void
    {
        $order_coupon = $this->make_coupon('ORDER10', DiscountTarget::ORDER);
        $coupon_results = [$this->make_coupon_result($order_coupon, [101 => 300])];

        $this->assertSame([], $this->get_applied_product_coupons_for_item($coupon_results, 101, 'USD', null));
    }

    public function test_excludes_product_coupons_that_did_not_discount_this_item(): void
    {
        $coupon = $this->make_coupon('SAVE5', DiscountTarget::PRODUCTS);
        $coupon_results = [$this->make_coupon_result($coupon, [999 => 500])];

        $this->assertSame([], $this->get_applied_product_coupons_for_item($coupon_results, 101, 'USD', null));
    }

    public function test_excludes_a_product_coupon_clamped_down_to_zero_for_this_item(): void
    {
        $coupon = $this->make_coupon('CLAMPED', DiscountTarget::PRODUCTS);
        $coupon_results = [$this->make_coupon_result($coupon, [101 => 0])];

        $this->assertSame([], $this->get_applied_product_coupons_for_item($coupon_results, 101, 'USD', null));
    }

    public function test_lists_multiple_stacked_product_coupons_as_separate_entries(): void
    {
        $coupon_a = $this->make_coupon('A', DiscountTarget::PRODUCTS);
        $coupon_b = $this->make_coupon('B', DiscountTarget::PRODUCTS);
        $coupon_results = [
            $this->make_coupon_result($coupon_a, [101 => 200]),
            $this->make_coupon_result($coupon_b, [101 => 150]),
        ];

        $applied = $this->get_applied_product_coupons_for_item($coupon_results, 101, 'USD', null);

        $this->assertCount(2, $applied);
        $this->assertEqualsCanonicalizing(['A', 'B'], array_column($applied, 'code'));
    }

    // format_tax_breakdown

    public function test_aggregates_tax_amounts_by_name_across_multiple_entries(): void
    {
        $tax_items = [
            TaxItemResultDTO::from_array(['name' => 'GST', 'rate' => 9, 'base_amount' => 100]),
            TaxItemResultDTO::from_array(['name' => 'GST', 'rate' => 9, 'base_amount' => 50]),
            TaxItemResultDTO::from_array(['name' => 'IST', 'rate' => 5, 'base_amount' => 30]),
        ];

        $breakdown = $this->format_tax_breakdown($tax_items, 'USD', null);

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
            TaxItemResultDTO::from_array(['name' => 'Tax', 'rate' => 0, 'base_amount' => 0]),
        ];

        $this->assertSame([], $this->format_tax_breakdown($tax_items, 'USD', null));
    }

    public function test_returns_empty_array_for_no_tax_items(): void
    {
        $this->assertSame([], $this->format_tax_breakdown([], 'USD', null));
    }

    public function test_keeps_shipping_and_product_tax_lines_independent_when_formatted_separately(): void
    {
        $product_tax = [TaxItemResultDTO::from_array(['name' => 'VAT', 'rate' => 20, 'base_amount' => 1000])];
        $shipping_tax = [TaxItemResultDTO::from_array(['name' => 'VAT', 'rate' => 20, 'base_amount' => 100])];

        $product_breakdown = $this->format_tax_breakdown($product_tax, 'USD', null);
        $shipping_breakdown = $this->format_tax_breakdown($shipping_tax, 'USD', null);

        $this->assertSame(10.0, $product_breakdown[0]['display_amount_money_object']->raw);
        $this->assertSame(1.0, $shipping_breakdown[0]['display_amount_money_object']->raw);
    }
}
