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

    protected function make_calculation_result(int $variant_id, int $base_subtotal = 1000, int $base_product_total = 1000, int $base_tax_amount = 0): CalculationResultDTO
    {
        $calculated_item = new CalculationItemDTO();
        $calculated_item->variant_id = $variant_id;
        $calculated_item->base_subtotal = $base_subtotal;
        $calculated_item->base_product_total = $base_product_total;
        $calculated_item->base_tax_amount = $base_tax_amount;

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

        $items = $this->call('prepare_items', [$item], $result, null, false);

        $this->assertTrue($items[0]['product']['is_available']);
    }

    public function test_reports_item_as_unavailable_when_product_is_draft(): void
    {
        $item = $this->make_cart_item(101, ProductStatus::DRAFT, true);
        $result = $this->make_calculation_result(101);

        $items = $this->call('prepare_items', [$item], $result, null, false);

        $this->assertFalse($items[0]['product']['is_available']);
    }

    public function test_reports_item_as_unavailable_when_product_is_trashed(): void
    {
        $item = $this->make_cart_item(101, ProductStatus::TRASHED, true);
        $result = $this->make_calculation_result(101);

        $items = $this->call('prepare_items', [$item], $result, null, false);

        $this->assertFalse($items[0]['product']['is_available']);
    }

    public function test_reports_item_as_unavailable_when_variant_is_not_visible(): void
    {
        $item = $this->make_cart_item(101, ProductStatus::PUBLISHED, false);
        $result = $this->make_calculation_result(101);

        $items = $this->call('prepare_items', [$item], $result, null, false);

        $this->assertFalse($items[0]['product']['is_available']);
    }

    // prepare_items - subtotal reconstruction under tax-inclusive pricing
    // (item-pricing-tax-exclusivity makes base_subtotal always net; these
    // prove CartResource's rendered output is unaffected by that fix)

    public function test_subtotal_is_unchanged_under_tax_exclusive_pricing(): void
    {
        $item = $this->make_cart_item(101, ProductStatus::PUBLISHED, true);
        $result = $this->make_calculation_result(101, 1000, 1000, 150);

        $items = $this->call('prepare_items', [$item], $result, null, false);

        $this->assertSame(10.0, $items[0]['display_subtotal_money_object']->raw);
    }

    public function test_subtotal_adds_the_items_own_tax_back_under_tax_inclusive_pricing(): void
    {
        $item = $this->make_cart_item(101, ProductStatus::PUBLISHED, true);
        $result = $this->make_calculation_result(101, 1000, 1000, 150);

        $items = $this->call('prepare_items', [$item], $result, null, true);

        // Reconstructs the pre-fix gross figure: 1000 (net) + 150 (tax) = 1150.
        $this->assertSame(11.5, $items[0]['display_subtotal_money_object']->raw);
    }

    // prepare_strikethrough_price reconstruction under tax-inclusive pricing

    public function test_strikethrough_is_unchanged_under_tax_exclusive_pricing(): void
    {
        $calculated_item = new CalculationItemDTO();
        $calculated_item->base_subtotal = 4500;
        $calculated_item->base_product_total = 6000;
        $calculated_item->base_tax_amount = 450;

        $strikethrough = $this->call('prepare_strikethrough_price', $calculated_item, 0, 4500, false, 'USD', null);

        $this->assertSame(60.0, $strikethrough->raw);
    }

    public function test_strikethrough_on_sale_adds_the_stored_regular_tax_amount_under_tax_inclusive_pricing(): void
    {
        // On sale, no coupon: the strikethrough amount (6000) is exactly
        // the regular-price total, so its own stored tax (600) is added
        // directly rather than derived by rate.
        $calculated_item = new CalculationItemDTO();
        $calculated_item->base_subtotal = 4500;
        $calculated_item->base_product_total = 6000;
        $calculated_item->base_tax_amount = 450;
        $calculated_item->base_regular_tax_amount = 600;

        $strikethrough = $this->call('prepare_strikethrough_price', $calculated_item, 0, 4500, true, 'USD', null);

        // 6000 + 600 = 6600, not the rate-derived 6000 * (1 + 450/4500) = 6600 -
        // same result here since the rate happens to match, so the next test
        // uses a deliberately mismatched value to actually distinguish the two.
        $this->assertSame(66.0, $strikethrough->raw);
    }

    public function test_strikethrough_on_sale_uses_the_stored_regular_tax_amount_directly_not_rate_derivation(): void
    {
        // base_regular_tax_amount (900) is deliberately different from what
        // rate-derivation against the current price's 10% rate would give
        // (600), to prove the fast path (direct addition) is used.
        $calculated_item = new CalculationItemDTO();
        $calculated_item->base_subtotal = 4500;
        $calculated_item->base_product_total = 6000;
        $calculated_item->base_tax_amount = 450;
        $calculated_item->base_regular_tax_amount = 900;

        $strikethrough = $this->call('prepare_strikethrough_price', $calculated_item, 0, 4500, true, 'USD', null);

        // 6000 + 900 = 6900, not 6000 * (1 + 450/4500) = 6600.
        $this->assertSame(69.0, $strikethrough->raw);
    }

    public function test_strikethrough_uses_rate_derivation_when_coupon_and_sale_compound_under_tax_inclusive_pricing(): void
    {
        // On sale (base_product_total 6000 > base_subtotal 4500) AND a
        // coupon discount applied: the coupon branch wins, so the
        // strikethrough amount is the pre-coupon subtotal (4500), not the
        // regular total (6000) - the one case the stored regular tax
        // amount doesn't cover. The stored value (999) is deliberately
        // wrong to prove it's ignored in this branch.
        $calculated_item = new CalculationItemDTO();
        $calculated_item->base_subtotal = 4500;
        $calculated_item->base_product_total = 6000;
        $calculated_item->base_tax_amount = 450;
        $calculated_item->base_regular_tax_amount = 999;

        $strikethrough = $this->call('prepare_strikethrough_price', $calculated_item, 500, 4000, true, 'USD', null);

        // Rate = 450/4000 = 11.25%; scaled onto the pre-coupon 4500 baseline: 4500 * 1.1125 = 5006.25 -> 5006.
        $this->assertSame(50.06, $strikethrough->raw);
        // A wrongly-taken fast path would have added the (deliberately mismatched) stored value: (4500 + 999) / 100 = 54.99.
        $this->assertNotEqualsWithDelta(54.99, $strikethrough->raw, 0.01);
    }

    // get_items_tax_total

    public function test_get_items_tax_total_sums_every_items_own_tax(): void
    {
        $item_a = new CalculationItemDTO();
        $item_a->base_tax_amount = 150;
        $item_b = new CalculationItemDTO();
        $item_b->base_tax_amount = 75;

        $this->assertSame(225, $this->call('get_items_tax_total', [$item_a, $item_b]));
    }
}
