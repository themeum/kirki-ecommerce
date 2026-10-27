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

    protected function make_order_item(int $id, int $invoiced_catalog_product_coupon_discounted_subtotal, ?int $base_catalog_product_coupon_discounted_subtotal = null): OrderItem
    {
        $item = new OrderItem();
        $item->id = $id;
        $item->invoiced_catalog_product_coupon_discounted_subtotal = $invoiced_catalog_product_coupon_discounted_subtotal;
        $item->base_catalog_product_coupon_discounted_subtotal = $base_catalog_product_coupon_discounted_subtotal ?? $invoiced_catalog_product_coupon_discounted_subtotal;

        return $item;
    }

    protected function make_priced_order_item(int $base_catalog_regular_price, int $base_catalog_sale_price, int $quantity, int $base_catalog_product_coupon_discounted_subtotal, int $exchange_rate = 1): OrderItem
    {
        $item = $this->make_order_item(101, $base_catalog_product_coupon_discounted_subtotal * $exchange_rate, $base_catalog_product_coupon_discounted_subtotal);
        $item->quantity = $quantity;
        $item->base_catalog_regular_price = $base_catalog_regular_price;
        $item->base_catalog_sale_price = $base_catalog_sale_price;
        $item->invoiced_catalog_regular_price = $base_catalog_regular_price * $exchange_rate;
        $item->invoiced_catalog_sale_price = $base_catalog_sale_price * $exchange_rate;
        $item->invoiced_tax_total = 0;
        $item->base_tax_total = 0;

        return $item;
    }

    protected function call(string $method, ...$arguments)
    {
        $reflection = new \ReflectionClass(OrderResource::class);
        $method_reflection = $reflection->getMethod($method);
        $method_reflection->setAccessible(true);

        return $method_reflection->invoke($this->resource, ...$arguments);
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

    public function test_items_subtotal_sums_every_items_total_after_product_coupons(): void
    {
        // Each item's recorded subtotal already excludes the order-wide
        // coupon's attribution, so the sum is taken as is, per currency.
        $items = [
            $this->make_order_item(101, 165000, 1500),
            $this->make_order_item(102, 110000, 1000),
        ];

        $this->assertSame(['invoiced' => 275000, 'base' => 2500], $this->call('get_items_subtotal', $items));
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
            $this->make_order_item(101, 1800),
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

        // items: 1800 (after the product coupon) + 1000 = 2800
        $this->assertSame(['invoiced' => 2800, 'base' => 2800], $this->call('get_items_subtotal', $items));
        // order discount (items-attributed): 270 (order_coupon) + 0 (free shipping) = 270
        $this->assertSame(['invoiced' => 270, 'base' => 270], $this->call('get_order_coupon_discount', $order_coupons));
        // shipping discount (unattributed remainder): 0 (order_coupon, fully attributed) + 500 (free shipping) = 500
        $this->assertSame(['invoiced' => 500, 'base' => 500], $this->call('get_shipping_coupon_discount', $order_coupons));
    }

    // prepare_items: line, strikethrough and per-unit figures read the recorded catalog figures
    // (which baseline is struck through is covered by ResolvesLineItemPricingTest)

    protected function prepare_single_item(OrderItem $item, array $order_coupons = [], ?OrderResource $resource = null): array
    {
        $reflection = new \ReflectionClass(OrderResource::class);
        $method = $reflection->getMethod('prepare_items');
        $method->setAccessible(true);

        $item->set_relation('taxes', collection());

        return $method->invoke($resource ?? $this->resource, [$item], collection($order_coupons))[0];
    }

    public function test_order_coupon_under_tax_inclusive_pricing_does_not_change_the_item_subtotal(): void
    {
        // 110.00 including 10% tax with a 50% order-wide coupon: the item's
        // recorded tax is 5.00, but its catalog figures stay 110.00.
        $item = $this->make_priced_order_item(11000, 11000, 1, 11000);
        $item->invoiced_tax_total = 500;
        $item->base_tax_total = 500;
        $order_coupon = $this->make_order_coupon('HALF', DiscountTarget::ORDER, 5500, [
            ['order_item_id' => 101, 'invoiced_discount_amount' => 5500],
        ]);

        $prepared = $this->prepare_single_item($item, [$order_coupon]);

        $this->assertSame(110.0, $prepared['invoiced_subtotal_money_object']->raw);
        $this->assertSame(110.0, $prepared['base_subtotal_money_object']->raw);
        $this->assertNull($prepared['base_strikethrough_price_money_object']);
        $this->assertSame(['invoiced' => 11000, 'base' => 11000], $this->call('get_items_subtotal', [$item]));
        $this->assertSame(['invoiced' => 5500, 'base' => 5500], $this->call('get_order_coupon_discount', collection([$order_coupon])));
    }

    public function test_unit_price_divides_the_line_subtotal_evenly(): void
    {
        $prepared = $this->prepare_single_item($this->make_priced_order_item(3850, 3850, 2, 7700));

        $this->assertSame(38.5, $prepared['invoiced_unit_price_money_object']->raw);
        $this->assertSame(38.5, $prepared['base_unit_price_money_object']->raw);
    }

    public function test_unit_price_rounds_up_when_the_line_subtotal_does_not_divide_evenly(): void
    {
        $prepared = $this->prepare_single_item($this->make_priced_order_item(334, 334, 3, 1000));

        // 1000 / 3 = 333.33 minor, rounded up to 334; the line subtotal stays 1000.
        $this->assertSame(3.34, $prepared['invoiced_unit_price_money_object']->raw);
        $this->assertSame(10.0, $prepared['invoiced_subtotal_money_object']->raw);
    }

    public function test_product_coupon_strikes_through_the_sale_total(): void
    {
        $prepared = $this->prepare_single_item($this->make_priced_order_item(4000, 4000, 2, 7000));

        // (8000 - 1000) / 2 = 3500; the pre-coupon 8000 / 2 = 4000 is struck through.
        $this->assertSame(35.0, $prepared['invoiced_unit_price_money_object']->raw);
        $this->assertSame(80.0, $prepared['invoiced_strikethrough_price_money_object']->raw);
        $this->assertSame(40.0, $prepared['invoiced_unit_strikethrough_price_money_object']->raw);
    }

    public function test_unit_strikethrough_is_the_regular_price_when_on_sale(): void
    {
        $prepared = $this->prepare_single_item($this->make_priced_order_item(5000, 4000, 2, 8000));

        $this->assertSame(100.0, $prepared['base_strikethrough_price_money_object']->raw);
        $this->assertSame(50.0, $prepared['invoiced_unit_strikethrough_price_money_object']->raw);
        $this->assertSame(50.0, $prepared['base_unit_strikethrough_price_money_object']->raw);
    }

    public function test_unit_strikethrough_is_null_when_the_line_strikethrough_is_null(): void
    {
        $prepared = $this->prepare_single_item($this->make_priced_order_item(2000, 2000, 2, 4000));

        $this->assertNull($prepared['invoiced_strikethrough_price_money_object']);
        $this->assertNull($prepared['base_strikethrough_price_money_object']);
        $this->assertNull($prepared['invoiced_unit_strikethrough_price_money_object']);
        $this->assertNull($prepared['base_unit_strikethrough_price_money_object']);
    }

    public function test_figures_render_in_their_own_currency(): void
    {
        $resource = new OrderResource([
            'currency_code' => 'BDT',
            'base_currency_code' => 'USD',
            'exchange_rate' => 110.0,
        ]);

        $prepared = $this->prepare_single_item($this->make_priced_order_item(5000, 4000, 2, 8000, 110), [], $resource);

        $this->assertSame(4400.0, $prepared['invoiced_unit_price_money_object']->raw);
        $this->assertSame('BDT', $prepared['invoiced_unit_price_money_object']->currency->code);
        $this->assertSame(40.0, $prepared['base_unit_price_money_object']->raw);
        $this->assertSame('USD', $prepared['base_unit_price_money_object']->currency->code);
        $this->assertSame(5500.0, $prepared['invoiced_unit_strikethrough_price_money_object']->raw);
        $this->assertSame(50.0, $prepared['base_unit_strikethrough_price_money_object']->raw);
    }
}
