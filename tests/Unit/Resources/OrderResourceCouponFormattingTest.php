<?php

namespace Kirki\Ecommerce\Tests\Unit\Resources;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\OrderItemCoupon;
use Kirki\Ecommerce\App\Resources\Site\Order\OrderResource;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\collection;

class OrderResourceCouponFormattingTest extends TestCase
{
    protected OrderResource $resource;

    protected function setUp(): void
    {
        parent::setUp();

        $this->bind_money_dependencies();
        app()->alias('money', MoneyManager::class);

        $this->resource = new OrderResource([
            'currency_code' => 'USD',
            'base_currency_code' => 'USD',
            'exchange_rate' => 1.0,
        ]);
    }

    /**
     * @param array<int, array{order_item_id: int, invoiced_discount_amount: int}> $item_attributions
     */
    protected function make_order_coupon(string $code, string $discount_target, int $invoiced_discount_amount, array $item_attributions = []): OrderCoupon
    {
        $coupon = new OrderCoupon();
        $coupon->code = $code;
        $coupon->title = $code . ' Title';
        $coupon->discount_target = $discount_target;
        $coupon->invoiced_discount_amount = $invoiced_discount_amount;
        $coupon->coupon_snapshot = [
            'discount_value_type' => 'fixed',
            'discount_amount_percentage' => null,
            'base_discount_amount_fixed' => 500,
        ];

        $attributions = collection(array_map(function ($attribution) {
            $order_item_coupon = new OrderItemCoupon();
            $order_item_coupon->order_item_id = $attribution['order_item_id'];
            $order_item_coupon->invoiced_discount_amount = $attribution['invoiced_discount_amount'];

            return $order_item_coupon;
        }, $item_attributions));

        $coupon->set_relation('order_item_coupons', $attributions);

        return $coupon;
    }

    protected function make_order_item(int $id, int $invoiced_subtotal): OrderItem
    {
        $item = new OrderItem();
        $item->id = $id;
        $item->invoiced_subtotal = $invoiced_subtotal;

        return $item;
    }

    protected function make_priced_order_item(int $base_regular_price, int $base_price, int $quantity, int $invoiced_subtotal, ?int $invoiced_regular_price = null, int $invoiced_tax_total = 0, int $invoiced_regular_tax_total = 0): OrderItem
    {
        $item = $this->make_order_item(101, $invoiced_subtotal);
        $item->base_regular_price = $base_regular_price;
        $item->invoiced_regular_price = $invoiced_regular_price ?? $base_regular_price;
        $item->base_price = $base_price;
        $item->quantity = $quantity;
        $item->invoiced_tax_total = $invoiced_tax_total;
        $item->invoiced_regular_tax_total = $invoiced_regular_tax_total;

        return $item;
    }

    protected function call(string $method, ...$arguments)
    {
        $reflection = new \ReflectionClass(OrderResource::class);
        $method_reflection = $reflection->getMethod($method);
        $method_reflection->setAccessible(true);

        return $method_reflection->invoke($this->resource, ...$arguments);
    }

    // get_product_coupon_discount_for_item

    public function test_sums_only_product_scoped_coupon_discounts_for_the_item(): void
    {
        $product_coupon = $this->make_order_coupon('PRODUCT10', DiscountTarget::PRODUCTS, 500, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 500],
        ]);
        $order_coupon = $this->make_order_coupon('ORDER10', DiscountTarget::ORDER, 300, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 300],
        ]);

        $order_coupons = collection([$product_coupon, $order_coupon]);

        $this->assertSame(500, $this->call('get_product_coupon_discount_for_item', $order_coupons, 101));
    }

    public function test_returns_zero_when_only_an_order_scoped_coupon_discounts_the_item(): void
    {
        $order_coupon = $this->make_order_coupon('ORDER10', DiscountTarget::ORDER, 300, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 300],
        ]);

        $this->assertSame(0, $this->call('get_product_coupon_discount_for_item', collection([$order_coupon]), 101));
    }

    public function test_returns_zero_for_an_empty_order_coupons_list(): void
    {
        $this->assertSame(0, $this->call('get_product_coupon_discount_for_item', collection(), 101));
    }

    // get_order_coupon_discount (items-attributed share of order-wide coupons)

    public function test_order_discount_sums_only_the_items_attributed_share_of_order_coupons(): void
    {
        $order_coupon = $this->make_order_coupon('ORDER10', DiscountTarget::ORDER, 1000, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 600],
            ['order_item_id' => 102, 'invoiced_discount_amount' => 400],
        ]);

        $this->assertSame(1000, $this->call('get_order_coupon_discount', collection([$order_coupon])));
    }

    public function test_order_discount_ignores_product_scoped_coupons(): void
    {
        $product_coupon = $this->make_order_coupon('PRODUCT10', DiscountTarget::PRODUCTS, 500, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 500],
        ]);

        $this->assertSame(0, $this->call('get_order_coupon_discount', collection([$product_coupon])));
    }

    public function test_order_discount_is_zero_for_a_free_shipping_coupon_with_no_item_attributions(): void
    {
        $free_shipping = $this->make_order_coupon('FREESHIP', DiscountTarget::ORDER, 500, []);

        $this->assertSame(0, $this->call('get_order_coupon_discount', collection([$free_shipping])));
    }

    // get_shipping_coupon_discount (unattributed remainder of order-wide coupons)

    public function test_shipping_discount_is_the_full_amount_for_a_free_shipping_coupon(): void
    {
        $free_shipping = $this->make_order_coupon('FREESHIP', DiscountTarget::ORDER, 500, []);

        $this->assertSame(500, $this->call('get_shipping_coupon_discount', collection([$free_shipping])));
    }

    public function test_shipping_discount_is_zero_when_an_order_coupon_is_fully_attributed_to_items(): void
    {
        $order_coupon = $this->make_order_coupon('ORDER10', DiscountTarget::ORDER, 1000, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 1000],
        ]);

        $this->assertSame(0, $this->call('get_shipping_coupon_discount', collection([$order_coupon])));
    }

    public function test_shipping_discount_ignores_product_scoped_coupons(): void
    {
        $product_coupon = $this->make_order_coupon('PRODUCT10', DiscountTarget::PRODUCTS, 500, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 500],
        ]);

        $this->assertSame(0, $this->call('get_shipping_coupon_discount', collection([$product_coupon])));
    }

    // get_items_subtotal

    public function test_items_subtotal_nets_out_only_the_product_coupon_share(): void
    {
        $items = [
            $this->make_order_item(101, 2000),
            $this->make_order_item(102, 1000),
        ];

        $product_coupon = $this->make_order_coupon('PRODUCT10', DiscountTarget::PRODUCTS, 500, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 500],
        ]);
        $order_coupon = $this->make_order_coupon('ORDER10', DiscountTarget::ORDER, 300, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 180],
            ['order_item_id' => 102, 'invoiced_discount_amount' => 120],
        ]);

        $order_coupons = collection([$product_coupon, $order_coupon]);

        // (2000 - 500) + (1000 - 0) = 2500: the order-coupon's attribution
        // is excluded from each item's own subtotal.
        $this->assertSame(2500, $this->call('get_items_subtotal', $items, $order_coupons));
    }

    public function test_items_subtotal_equals_the_raw_sum_when_there_are_no_coupons_at_all(): void
    {
        $items = [
            $this->make_order_item(101, 2000),
            $this->make_order_item(102, 1000),
        ];

        $this->assertSame(3000, $this->call('get_items_subtotal', $items, collection()));
    }

    // find_product_coupon_discounts_for_item + format_applied_product_coupons
    // (the two-step path prepare_items() actually calls)

    protected function applied_product_coupons_for_item($order_coupons, $order_item_id)
    {
        $item_discounts = $this->call('find_product_coupon_discounts_for_item', $order_coupons, $order_item_id);

        return $this->call('format_applied_product_coupons', $item_discounts);
    }

    public function test_applied_product_coupons_lists_the_coupon_that_discounted_the_item(): void
    {
        $coupon = $this->make_order_coupon('SAVE5', DiscountTarget::PRODUCTS, 500, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 500],
        ]);

        $applied = $this->applied_product_coupons_for_item(collection([$coupon]), 101);

        $this->assertCount(1, $applied);
        $this->assertSame('SAVE5', $applied[0]['code']);
        $this->assertSame(5.0, $applied[0]['invoiced_discount_amount_money_object']->raw);
    }

    public function test_applied_product_coupons_excludes_order_scoped_coupons(): void
    {
        $order_coupon = $this->make_order_coupon('ORDER10', DiscountTarget::ORDER, 300, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 300],
        ]);

        $this->assertSame([], $this->applied_product_coupons_for_item(collection([$order_coupon]), 101));
    }

    public function test_applied_product_coupons_excludes_coupons_that_did_not_discount_this_item(): void
    {
        $coupon = $this->make_order_coupon('SAVE5', DiscountTarget::PRODUCTS, 500, [
            ['order_item_id' => 999, 'invoiced_discount_amount' => 500],
        ]);

        $this->assertSame([], $this->applied_product_coupons_for_item(collection([$coupon]), 101));
    }

    // format_coupon_snapshot_fields / convert_base_amount_to_invoiced

    public function test_snapshot_fixed_amount_is_converted_using_the_orders_own_exchange_rate(): void
    {
        $resource = new OrderResource([
            'currency_code' => 'BDT',
            'base_currency_code' => 'USD',
            'exchange_rate' => 110.0,
        ]);

        $coupon = new OrderCoupon();
        $coupon->coupon_snapshot = [
            'discount_value_type' => 'fixed',
            'discount_amount_percentage' => null,
            'base_discount_amount_fixed' => 500,
        ];

        $reflection = new \ReflectionClass(OrderResource::class);
        $method = $reflection->getMethod('format_coupon_snapshot_fields');
        $method->setAccessible(true);

        $fields = $method->invoke($resource, $coupon);

        // 500 minor USD * 110.0 = 55000 minor BDT = 550.00 BDT.
        $this->assertSame(550.0, $fields['invoiced_discount_amount_fixed_money_object']->raw);
        $this->assertSame('BDT', $fields['invoiced_discount_amount_fixed_money_object']->currency->code);
    }

    public function test_snapshot_percentage_coupon_has_no_fixed_amount_money_object(): void
    {
        $coupon = new OrderCoupon();
        $coupon->coupon_snapshot = [
            'discount_value_type' => 'percentage',
            'discount_amount_percentage' => 10,
            'base_discount_amount_fixed' => null,
        ];

        $fields = $this->call('format_coupon_snapshot_fields', $coupon);

        $this->assertSame(10, $fields['discount_amount_percentage']);
        $this->assertNull($fields['invoiced_discount_amount_fixed_money_object']);
    }

    // format_coupon_results / no coupons at all (task 2.7: pre-existing orders)

    public function test_format_coupon_results_returns_empty_for_no_coupons_at_all(): void
    {
        $this->assertSame([], $this->call('format_coupon_results', collection()));
    }

    // A single scenario mixing an item-scoped coupon, an order-wide coupon,
    // and a free-shipping coupon together, verifying the three root figures
    // split correctly against the same data.

    public function test_multiple_coupons_mixing_item_and_order_scope_split_correctly(): void
    {
        $items = [
            $this->make_order_item(101, 2000),
            $this->make_order_item(102, 1000),
        ];

        $product_coupon = $this->make_order_coupon('PRODUCT10', DiscountTarget::PRODUCTS, 200, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 200],
        ]);
        $order_coupon = $this->make_order_coupon('ORDER10', DiscountTarget::ORDER, 270, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 162],
            ['order_item_id' => 102, 'invoiced_discount_amount' => 108],
        ]);
        $free_shipping = $this->make_order_coupon('FREESHIP', DiscountTarget::ORDER, 500, []);

        $order_coupons = collection([$product_coupon, $order_coupon, $free_shipping]);

        // items: (2000 - 200) + (1000 - 0) = 2800
        $this->assertSame(2800, $this->call('get_items_subtotal', $items, $order_coupons));
        // order discount (items-attributed): 270 (order_coupon) + 0 (free shipping) = 270
        $this->assertSame(270, $this->call('get_order_coupon_discount', $order_coupons));
        // shipping discount (unattributed remainder): 0 (order_coupon, fully attributed) + 500 (free shipping) = 500
        $this->assertSame(500, $this->call('get_shipping_coupon_discount', $order_coupons));
    }

    // prepare_strikethrough_price

    public function test_strikethrough_is_the_regular_price_total_when_only_a_sale_applied(): void
    {
        $item = $this->make_priced_order_item(2000, 1500, 3, 4500);

        $strikethrough = $this->call('prepare_strikethrough_price', $item, 0, $item->invoiced_subtotal, false);

        $this->assertSame(60.0, $strikethrough->raw);
        $this->assertSame('USD', $strikethrough->currency->code);
    }

    public function test_strikethrough_is_the_subtotal_before_the_coupon_when_only_a_product_coupon_applied(): void
    {
        $item = $this->make_priced_order_item(2000, 2000, 1, 2000);

        $strikethrough = $this->call('prepare_strikethrough_price', $item, 500, $item->invoiced_subtotal, false);

        $this->assertSame(20.0, $strikethrough->raw);
    }

    public function test_strikethrough_is_the_sale_adjusted_subtotal_when_a_sale_and_a_product_coupon_both_applied(): void
    {
        $item = $this->make_priced_order_item(2000, 1500, 2, 3000);

        $strikethrough = $this->call('prepare_strikethrough_price', $item, 500, $item->invoiced_subtotal, false);

        $this->assertSame(30.0, $strikethrough->raw);
    }

    public function test_strikethrough_is_null_when_only_an_order_scoped_coupon_discounted_the_item(): void
    {
        $item = $this->make_priced_order_item(2000, 2000, 1, 2000);
        $order_coupon = $this->make_order_coupon('ORDER10', DiscountTarget::ORDER, 300, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 300],
        ]);

        $product_coupon_discount = $this->call('get_product_coupon_discount_for_item', collection([$order_coupon]), 101);

        $this->assertNull($this->call('prepare_strikethrough_price', $item, $product_coupon_discount, $item->invoiced_subtotal, false));
    }

    public function test_strikethrough_is_null_when_there_is_no_sale_and_no_product_coupon(): void
    {
        $item = $this->make_priced_order_item(2000, 2000, 2, 4000);

        $this->assertNull($this->call('prepare_strikethrough_price', $item, 0, $item->invoiced_subtotal, false));
    }

    public function test_strikethrough_is_null_for_an_item_with_no_recorded_regular_price(): void
    {
        $item = $this->make_priced_order_item(0, 1500, 1, 1500);

        $this->assertNull($this->call('prepare_strikethrough_price', $item, 0, $item->invoiced_subtotal, false));
    }

    public function test_strikethrough_still_shows_the_product_coupon_baseline_for_an_item_with_no_recorded_regular_price(): void
    {
        $item = $this->make_priced_order_item(0, 1500, 1, 1500);

        $strikethrough = $this->call('prepare_strikethrough_price', $item, 300, $item->invoiced_subtotal, false);

        $this->assertSame(15.0, $strikethrough->raw);
    }

    public function test_strikethrough_sale_check_ignores_invoiced_rounding_differences(): void
    {
        $item = $this->make_priced_order_item(1000, 1000, 3, 33333, 11112);

        $this->assertNull($this->call('prepare_strikethrough_price', $item, 0, $item->invoiced_subtotal, false));
    }

    public function test_sale_strikethrough_is_in_the_orders_invoiced_currency(): void
    {
        $resource = new OrderResource([
            'currency_code' => 'BDT',
            'base_currency_code' => 'USD',
            'exchange_rate' => 110.0,
        ]);
        $item = $this->make_priced_order_item(2000, 1500, 2, 330000, 220000);

        $reflection = new \ReflectionClass(OrderResource::class);
        $method = $reflection->getMethod('prepare_strikethrough_price');
        $method->setAccessible(true);

        $strikethrough = $method->invoke($resource, $item, 0, $item->invoiced_subtotal, false);

        // 220000 minor BDT per unit * 2 = 440000 minor BDT = 4400.00 BDT.
        $this->assertSame(4400.0, $strikethrough->raw);
        $this->assertSame('BDT', $strikethrough->currency->code);
    }

    // prepare_strikethrough_price - reconstruction under tax-inclusive pricing
    // (item-pricing-tax-exclusivity makes invoiced_subtotal always net; these
    // prove this resource's output is unaffected by that fix)

    public function test_strikethrough_on_sale_adds_the_stored_regular_tax_total_under_tax_inclusive_pricing(): void
    {
        // On sale, no coupon: the strikethrough amount (6000) is exactly
        // the regular-price total, so its own stored tax (600) is added
        // directly rather than derived by rate.
        $item = $this->make_priced_order_item(2000, 1500, 3, 4500, null, 450, 600);

        $strikethrough = $this->call('prepare_strikethrough_price', $item, 0, $item->invoiced_subtotal, true);

        $this->assertSame(66.0, $strikethrough->raw);
    }

    public function test_strikethrough_on_sale_uses_the_stored_regular_tax_total_directly_not_rate_derivation(): void
    {
        // invoiced_regular_tax_total (900) is deliberately different from
        // what rate-derivation against the current price's 10% rate would
        // give (600), to prove the fast path (direct addition) is used.
        $item = $this->make_priced_order_item(2000, 1500, 3, 4500, null, 450, 900);

        $strikethrough = $this->call('prepare_strikethrough_price', $item, 0, $item->invoiced_subtotal, true);

        // 6000 + 900 = 6900, not 6000 * (1 + 450/4500) = 6600.
        $this->assertSame(69.0, $strikethrough->raw);
    }

    public function test_strikethrough_uses_rate_derivation_when_coupon_and_sale_compound_under_tax_inclusive_pricing(): void
    {
        // On sale (regular 2000 > price 1500, quantity 3: regular total
        // 6000 vs sale subtotal 4500) AND a product coupon applied: the
        // coupon branch wins, so the strikethrough amount is the pre-coupon
        // subtotal (4500), not the regular total (6000) - the one case the
        // stored regular tax total doesn't cover. The stored value (999) is
        // deliberately wrong to prove it's ignored in this branch.
        $item = $this->make_priced_order_item(2000, 1500, 3, 4500, null, 450, 999);

        $strikethrough = $this->call('prepare_strikethrough_price', $item, 500, 4000, true);

        // Rate = 450/4000 = 11.25%; scaled onto the pre-coupon 4500 baseline: 4500 * 1.1125 = 5006.25 -> 5006.
        $this->assertSame(50.06, $strikethrough->raw);
        // A wrongly-taken fast path would have added the (deliberately mismatched) stored value: (4500 + 999) / 100 = 54.99.
        $this->assertNotEqualsWithDelta(54.99, $strikethrough->raw, 0.01);
    }

    // get_items_tax_total

    public function test_get_items_tax_total_sums_every_items_own_tax(): void
    {
        $item_a = $this->make_priced_order_item(2000, 1500, 3, 4500, null, 450);
        $item_b = $this->make_priced_order_item(1000, 1000, 1, 1000, null, 100);

        $this->assertSame(550, $this->call('get_items_tax_total', [$item_a, $item_b]));
    }
}
