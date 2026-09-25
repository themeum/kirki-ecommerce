<?php

namespace Kirki\Ecommerce\Tests\Unit\Resources;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\OrderItemCoupon;
use Kirki\Ecommerce\App\Resources\Order\OrderResource;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\collection;

class AdminOrderResourceCouponFormattingTest extends TestCase
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
     * @param array<int, array{order_item_id: int, invoiced_discount_amount: int, base_discount_amount?: int}> $item_attributions
     */
    protected function make_order_coupon(string $code, string $discount_target, int $invoiced_discount_amount, array $item_attributions = [], ?int $base_discount_amount = null): OrderCoupon
    {
        $coupon = new OrderCoupon();
        $coupon->code = $code;
        $coupon->title = $code . ' Title';
        $coupon->discount_target = $discount_target;
        $coupon->invoiced_discount_amount = $invoiced_discount_amount;
        $coupon->base_discount_amount = $base_discount_amount ?? $invoiced_discount_amount;
        $coupon->coupon_snapshot = [
            'discount_value_type' => 'fixed',
            'discount_amount_percentage' => null,
            'base_discount_amount_fixed' => 500,
        ];

        $attributions = collection(array_map(function ($attribution) {
            $order_item_coupon = new OrderItemCoupon();
            $order_item_coupon->order_item_id = $attribution['order_item_id'];
            $order_item_coupon->invoiced_discount_amount = $attribution['invoiced_discount_amount'];
            $order_item_coupon->base_discount_amount = $attribution['base_discount_amount'] ?? $attribution['invoiced_discount_amount'];

            return $order_item_coupon;
        }, $item_attributions));

        $coupon->set_relation('order_item_coupons', $attributions);

        return $coupon;
    }

    protected function make_order_item(int $id, int $invoiced_subtotal, ?int $base_subtotal = null): OrderItem
    {
        $item = new OrderItem();
        $item->id = $id;
        $item->invoiced_subtotal = $invoiced_subtotal;
        $item->base_subtotal = $base_subtotal ?? $invoiced_subtotal;

        return $item;
    }

    protected function make_priced_order_item(int $base_regular_price, int $base_price, int $quantity, int $invoiced_subtotal, ?int $invoiced_regular_price = null, int $invoiced_tax_total = 0, ?int $base_tax_total = null, int $invoiced_regular_tax_total = 0, ?int $base_regular_tax_total = null): OrderItem
    {
        $item = $this->make_order_item(101, $invoiced_subtotal);
        $item->base_regular_price = $base_regular_price;
        $item->invoiced_regular_price = $invoiced_regular_price ?? $base_regular_price;
        $item->base_price = $base_price;
        $item->quantity = $quantity;
        $item->invoiced_tax_total = $invoiced_tax_total;
        $item->base_tax_total = $base_tax_total ?? $invoiced_tax_total;
        $item->invoiced_regular_tax_total = $invoiced_regular_tax_total;
        $item->base_regular_tax_total = $base_regular_tax_total ?? $invoiced_regular_tax_total;

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

        $discount = $this->call('get_product_coupon_discount_for_item', $order_coupons, 101);

        $this->assertSame(['invoiced' => 500, 'base' => 500], $discount);
    }

    public function test_returns_zero_when_only_an_order_scoped_coupon_discounts_the_item(): void
    {
        $order_coupon = $this->make_order_coupon('ORDER10', DiscountTarget::ORDER, 300, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 300],
        ]);

        $discount = $this->call('get_product_coupon_discount_for_item', collection([$order_coupon]), 101);

        $this->assertSame(['invoiced' => 0, 'base' => 0], $discount);
    }

    public function test_returns_zero_for_an_empty_order_coupons_list(): void
    {
        $discount = $this->call('get_product_coupon_discount_for_item', collection(), 101);

        $this->assertSame(['invoiced' => 0, 'base' => 0], $discount);
    }

    // get_order_coupon_discount (items-attributed share of order-wide coupons)

    public function test_order_discount_sums_only_the_items_attributed_share_of_order_coupons(): void
    {
        $order_coupon = $this->make_order_coupon('ORDER10', DiscountTarget::ORDER, 1000, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 600],
            ['order_item_id' => 102, 'invoiced_discount_amount' => 400],
        ]);

        $discount = $this->call('get_order_coupon_discount', collection([$order_coupon]));

        $this->assertSame(['invoiced' => 1000, 'base' => 1000], $discount);
    }

    public function test_order_discount_ignores_product_scoped_coupons(): void
    {
        $product_coupon = $this->make_order_coupon('PRODUCT10', DiscountTarget::PRODUCTS, 500, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 500],
        ]);

        $discount = $this->call('get_order_coupon_discount', collection([$product_coupon]));

        $this->assertSame(['invoiced' => 0, 'base' => 0], $discount);
    }

    // get_shipping_coupon_discount (unattributed remainder of order-wide coupons)

    public function test_shipping_discount_is_the_full_amount_for_a_free_shipping_coupon(): void
    {
        $free_shipping = $this->make_order_coupon('FREESHIP', DiscountTarget::ORDER, 500, []);

        $discount = $this->call('get_shipping_coupon_discount', collection([$free_shipping]));

        $this->assertSame(['invoiced' => 500, 'base' => 500], $discount);
    }

    public function test_shipping_discount_is_zero_when_an_order_coupon_is_fully_attributed_to_items(): void
    {
        $order_coupon = $this->make_order_coupon('ORDER10', DiscountTarget::ORDER, 1000, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 1000],
        ]);

        $discount = $this->call('get_shipping_coupon_discount', collection([$order_coupon]));

        $this->assertSame(['invoiced' => 0, 'base' => 0], $discount);
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
        $subtotal = $this->call('get_items_subtotal', $items, $order_coupons);

        $this->assertSame(['invoiced' => 2500, 'base' => 2500], $subtotal);
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
        $this->assertSame(5.0, $applied[0]['base_discount_amount_money_object']->raw);
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
        // The base twin reads the snapshot directly, in the store's base currency, with no conversion.
        $this->assertSame(5.0, $fields['base_discount_amount_fixed_money_object']->raw);
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
        $this->assertNull($fields['base_discount_amount_fixed_money_object']);
    }

    // format_coupon_results / no coupons at all

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
        $this->assertSame(['invoiced' => 2800, 'base' => 2800], $this->call('get_items_subtotal', $items, $order_coupons));
        // order discount (items-attributed): 270 (order_coupon) + 0 (free shipping) = 270
        $this->assertSame(['invoiced' => 270, 'base' => 270], $this->call('get_order_coupon_discount', $order_coupons));
        // shipping discount (unattributed remainder): 0 (order_coupon, fully attributed) + 500 (free shipping) = 500
        $this->assertSame(['invoiced' => 500, 'base' => 500], $this->call('get_shipping_coupon_discount', $order_coupons));
    }

    // prepare_strikethrough_price

    public function test_strikethrough_is_the_regular_price_total_when_only_a_sale_applied(): void
    {
        // No discount: current-price exclusive is the raw subtotal (4500), taxed at 450 (10%).
        // Regular-price tax total (600) is consistent with that same 10% rate applied to the regular total (6000).
        $item = $this->make_priced_order_item(2000, 1500, 3, 4500, null, 450, null, 600);

        $strikethrough = $this->call('prepare_strikethrough_price', $item, 0, $item->invoiced_subtotal, $item->invoiced_regular_price, $item->invoiced_regular_tax_total, $item->invoiced_subtotal, $item->invoiced_tax_total, 'USD');

        $this->assertSame(60.0, $strikethrough['exclusive']->raw);
        $this->assertSame('USD', $strikethrough['exclusive']->currency->code);
        // Direct addition of the stored regular tax total: 6000 + 600 = 6600.
        $this->assertSame(66.0, $strikethrough['inclusive']->raw);
    }

    public function test_strikethrough_on_sale_uses_the_stored_regular_tax_total_directly_not_rate_derivation(): void
    {
        // Regular total is 2000*3=6000; the stored regular tax total (900)
        // is deliberately different from what rate-derivation against the
        // current price's 10% rate would produce (600), to prove the fast
        // path (direct addition) is used, not derive_inclusive_amount_at_rate().
        $item = $this->make_priced_order_item(2000, 1500, 3, 4500, null, 450, null, 900);

        $strikethrough = $this->call('prepare_strikethrough_price', $item, 0, $item->invoiced_subtotal, $item->invoiced_regular_price, $item->invoiced_regular_tax_total, $item->invoiced_subtotal, $item->invoiced_tax_total, 'USD');

        $this->assertSame(60.0, $strikethrough['exclusive']->raw);
        // 6000 + 900 = 6900, not 6000 * (1 + 450/4500) = 6600.
        $this->assertSame(69.0, $strikethrough['inclusive']->raw);
    }

    public function test_strikethrough_is_the_subtotal_before_the_coupon_when_only_a_product_coupon_applied(): void
    {
        // Not on sale (regular price equals current price), so the
        // pre-coupon subtotal (2000) equals the regular-price total
        // (2000*1) exactly - the fast path applies here too.
        $item = $this->make_priced_order_item(2000, 2000, 1, 2000, null, 200, null, 1000);

        // The item's own current-price exclusive amount is post-discount (2000 - 500 = 1500).
        $strikethrough = $this->call('prepare_strikethrough_price', $item, 500, $item->invoiced_subtotal, $item->invoiced_regular_price, $item->invoiced_regular_tax_total, 1500, $item->invoiced_tax_total, 'USD');

        $this->assertSame(20.0, $strikethrough['exclusive']->raw);
        // Direct addition of the stored regular tax total: 2000 + 1000 = 3000 -
        // not the rate-derived 2000 * (1 + 200/1500) = 2266.67 a pre-fast-path
        // implementation would have produced.
        $this->assertSame(30.0, $strikethrough['inclusive']->raw);
    }

    public function test_strikethrough_uses_rate_derivation_when_coupon_and_sale_compound(): void
    {
        // On sale (regular 2500 > price 2000) AND a product coupon applied:
        // the coupon branch wins, so the strikethrough amount is the
        // pre-coupon subtotal at the *sale* price (2000), not the regular
        // total (2500*1=2500) - the one case the stored regular tax total
        // doesn't cover, so the rate-derivation fallback is still used. The
        // stored regular tax total (999) is deliberately an obviously-wrong
        // value to prove it's ignored in this branch.
        $item = $this->make_priced_order_item(2500, 2000, 1, 2000, null, 200, null, 999);

        $strikethrough = $this->call('prepare_strikethrough_price', $item, 500, $item->invoiced_subtotal, $item->invoiced_regular_price, $item->invoiced_regular_tax_total, 1500, $item->invoiced_tax_total, 'USD');

        $this->assertSame(20.0, $strikethrough['exclusive']->raw);
        // Rate = 200/1500; scaled onto the pre-coupon 2000 baseline: 2000 * (1 + 200/1500) = 2266.67.
        $this->assertEqualsWithDelta(22.6667, $strikethrough['inclusive']->raw, 0.01);
    }

    public function test_strikethrough_is_null_when_there_is_no_sale_and_no_product_coupon(): void
    {
        $item = $this->make_priced_order_item(2000, 2000, 2, 4000);

        $strikethrough = $this->call('prepare_strikethrough_price', $item, 0, $item->invoiced_subtotal, $item->invoiced_regular_price, $item->invoiced_regular_tax_total, $item->invoiced_subtotal, $item->invoiced_tax_total, 'USD');

        $this->assertNull($strikethrough['exclusive']);
        $this->assertNull($strikethrough['inclusive']);
    }

    public function test_strikethrough_is_null_for_an_item_with_no_recorded_regular_price(): void
    {
        $item = $this->make_priced_order_item(0, 1500, 1, 1500);

        $strikethrough = $this->call('prepare_strikethrough_price', $item, 0, $item->invoiced_subtotal, $item->invoiced_regular_price, $item->invoiced_regular_tax_total, $item->invoiced_subtotal, $item->invoiced_tax_total, 'USD');

        $this->assertNull($strikethrough['exclusive']);
        $this->assertNull($strikethrough['inclusive']);
    }

    public function test_strikethrough_renders_in_the_base_currency_when_no_currency_code_given(): void
    {
        $item = $this->make_priced_order_item(2000, 1500, 3, 4500, null, 450, null, 600);

        $strikethrough = $this->call('prepare_strikethrough_price', $item, 0, $item->base_subtotal, $item->base_regular_price, $item->base_regular_tax_total, $item->base_subtotal, $item->base_tax_total, null);

        $this->assertSame(60.0, $strikethrough['exclusive']->raw);
        $this->assertSame('USD', $strikethrough['exclusive']->currency->code);
    }

    public function test_strikethrough_inclusive_is_unaffected_when_current_price_exclusive_is_zero(): void
    {
        // A coupon-and-sale compound (forces the rate-derivation fallback,
        // not the fast path - see test_strikethrough_uses_rate_derivation_when_coupon_and_sale_compound())
        // with a fully-discounted current price: the zero-guard in
        // derive_inclusive_amount_at_rate() leaves the exclusive amount
        // unchanged rather than dividing by zero.
        $item = $this->make_priced_order_item(2000, 1500, 1, 0, null, 0, null, 999);

        $strikethrough = $this->call('prepare_strikethrough_price', $item, 500, $item->invoiced_subtotal, $item->invoiced_regular_price, $item->invoiced_regular_tax_total, 0, 0, 'USD');

        $this->assertSame(0.0, $strikethrough['exclusive']->raw);
        $this->assertSame(0.0, $strikethrough['inclusive']->raw);
    }

    // derive_inclusive_amount / derive_inclusive_amount_at_rate / get_items_tax_total

    public function test_derive_inclusive_amount_adds_the_tax_directly(): void
    {
        $this->assertSame(1200, $this->call('derive_inclusive_amount', 1000, 200));
    }

    public function test_derive_inclusive_amount_at_rate_scales_by_the_current_price_rate(): void
    {
        // Rate = 100/1000 = 10%, applied to a 5000 baseline: 5000 * 1.1 = 5500.
        $this->assertSame(5500, $this->call('derive_inclusive_amount_at_rate', 5000, 1000, 100));
    }

    public function test_derive_inclusive_amount_at_rate_returns_the_exclusive_amount_when_current_price_is_zero(): void
    {
        $this->assertSame(5000, $this->call('derive_inclusive_amount_at_rate', 5000, 0, 0));
    }

    public function test_get_items_tax_total_sums_every_items_own_tax(): void
    {
        $items = [
            $this->make_priced_order_item(2000, 1500, 3, 4500, null, 450, 400),
            $this->make_priced_order_item(1000, 1000, 1, 1000, null, 100, 90),
        ];

        $this->assertSame(['invoiced' => 550, 'base' => 490], $this->call('get_items_tax_total', $items));
    }
}
