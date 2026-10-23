<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Actions\Cart\AddToCartAction;
use Kirki\Ecommerce\App\Actions\Cart\RecalculateCartAction;
use Kirki\Ecommerce\App\Actions\Order\CreateOrderAction;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Constants\Coupon\EligibleItemType;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderTaxType;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Constants\ShippingMethodTypes;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Cart\AddToCartDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderPayloadDTO;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\OrderItemCoupon;
use Kirki\Ecommerce\App\Models\OrderTax;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\EnablesPaymentProviders;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

use function Kirki\Ecommerce\Framework\app;

/**
 * Order calculation previews, order creation inputs, and edits and cancels of
 * orders whose catalog records changed or were deleted.
 *
 * An edit keeps what the customer was promised: line prices, coupon terms,
 * the exchange rate, the tax mode, and the shipping cost and tax rates for
 * an address that did not change.
 */
class OrderEditApiTest extends RestTestCase
{
    use CreatesTestProducts;
    use EnablesPaymentProviders;
    use SeedsTestShipping;

    /** @var int */
    protected $variant_id;

    /**
     * Start every test from tax-disabled settings, a base currency, a flat-rate shipping zone and one product.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->enable_payment_provider();

        $this->assert_api_success($this->request('PUT', 'settings', [
            'key' => OptionKeys::TAX_SETTINGS,
            'data' => [
                'is_tax_inclusive_price' => false,
                'is_shipping_tax_enabled' => false,
                'is_enabled_display_inclusive_taxed_price' => false,
                'tax_regions' => [],
                'tax_services' => [],
                'tax_ids' => [],
            ],
        ]));

        $this->seed_base_currency();
        $this->seed_shipping_settings();

        $this->variant_id = $this->default_variant_id($this->create_product());
    }

    // Preview and create inputs

    public function test_preview_item_ids_are_the_payload_indexes(): void
    {
        $second_variant_id = $this->default_variant_id($this->create_product());

        $payload = $this->preview(['items' => [
            ['variant_id' => $this->variant_id, 'quantity' => 1],
            ['variant_id' => $second_variant_id, 'quantity' => 2],
        ]]);

        $this->assertSame([0, 1], array_column($payload['items'], 'id'));
        $this->assertSame([1, 2], array_column($payload['items'], 'quantity'));
    }

    public function test_create_order_tax_matches_the_preview_for_a_variant_with_its_own_tax_profile(): void
    {
        $this->use_reduced_rate_tax_profile_for($this->variant_id);

        $preview = $this->preview();
        $order = $this->create_order();

        $this->assertEquals(5.0, $preview['tax_lines'][0]['rate']);
        $this->assertEquals($preview['totals']['base_tax_total_money_object']['raw'], Order::find($order['id'])->base_tax_total / 100);
    }

    public function test_checkout_tax_matches_the_cart_total_for_a_variant_with_its_own_tax_profile(): void
    {
        $this->use_reduced_rate_tax_profile_for($this->variant_id);

        $add_to_cart_dto = new AddToCartDTO();
        $add_to_cart_dto->product_id = Variant::find($this->variant_id)->product_id;
        $add_to_cart_dto->variant_id = $this->variant_id;
        $add_to_cart_dto->quantity = 2;
        $cart = app()->make(AddToCartAction::class)->execute($add_to_cart_dto);
        $cart->update([
            'shipping_address' => ['first_name' => 'John', 'last_name' => 'Doe', 'address_line1' => '123 Main St', 'city' => 'New York', 'state' => 'NY', 'postal_code' => '10001', 'country' => 'US'],
            'shipping_method' => 'method-0001',
        ]);

        $cart_result = app()->make(RecalculateCartAction::class)->execute(CalculationContextDTO::from_cart($cart->fresh()));

        $dto = CreateOrderPayloadDTO::from_array($this->order_payload([
            'is_manual' => false,
            'billing_email' => 'tax-profile-' . wp_generate_password(8, false) . '@example.com',
        ]));
        $dto->created_by = get_current_user_id();
        $dto->cart_token = $cart->cart_token;

        $order = app()->make(CreateOrderAction::class)->execute($dto);

        $this->assertGreaterThan(0, $cart_result->base_tax_total);
        $this->assertEquals($cart_result->base_tax_total, $order->base_tax_total);
    }

    public function test_create_order_rejects_the_same_variant_on_two_lines(): void
    {
        $this->assert_api_error($this->request('POST', 'orders', $this->order_payload(['items' => [
            ['variant_id' => $this->variant_id, 'quantity' => 1],
            ['variant_id' => $this->variant_id, 'quantity' => 2],
        ]])), 422);
    }

    public function test_an_order_stores_the_rate_of_a_percentage_coupon_and_not_of_a_fixed_one(): void
    {
        $percentage_coupon = $this->create_percentage_coupon(15);
        $percentage_order = $this->create_order(['coupon_codes' => [$percentage_coupon->code]]);

        $fixed_coupon = $this->create_amount_off_coupon(DiscountTarget::ORDER, DiscountValueType::FIXED, 300);
        $fixed_order = $this->create_order(['coupon_codes' => [$fixed_coupon->code]]);

        $this->assertEquals(15, OrderCoupon::where('order_id', $percentage_order['id'])->first()->discount_rate);
        $this->assertNull(OrderCoupon::where('order_id', $fixed_order['id'])->first()->discount_rate);
        $this->assertNull(OrderCoupon::where('order_id', $percentage_order['id'])->first()->base_max_discount_amount);
        $this->assertSame(300, OrderCoupon::where('order_id', $fixed_order['id'])->first()->base_max_discount_amount);
    }

    // Cancelling orders whose records were deleted

    public function test_cancelling_an_order_whose_variant_was_deleted_succeeds(): void
    {
        $deleted_product = $this->create_product();
        $deleted_variant_id = $this->default_variant_id($deleted_product);
        Variant::query()->where('id', $this->variant_id)->update(['track_inventory' => true]);

        $order = $this->create_order(['items' => [
            ['variant_id' => $this->variant_id, 'quantity' => 2],
            ['variant_id' => $deleted_variant_id, 'quantity' => 1],
        ]]);

        $this->delete_product($deleted_product['id']);
        $available_before_cancel = Variant::find($this->variant_id)->available_quantity;

        $this->assertTrue(OrderManager::mark_as_cancel($order['id']));

        $this->assertNotNull(Order::find($order['id'])->cancelled_at);
        $this->assertEquals($available_before_cancel + 2, Variant::find($this->variant_id)->available_quantity);
    }

    public function test_cancelling_an_order_whose_coupon_was_deleted_succeeds(): void
    {
        $coupon = $this->create_percentage_coupon(10);
        $order = $this->create_order(['coupon_codes' => [$coupon->code]]);

        Coupon::query()->where('id', $coupon->id)->delete();

        $this->assertTrue(OrderManager::mark_as_cancel($order['id']));

        $order_coupon = OrderCoupon::where('order_id', $order['id'])->first();
        $this->assertNull($order_coupon->coupon_id);
        $this->assertNotNull($order_coupon->usage_reversed_at);
    }

    // Which orders can be edited

    /**
     * @return array<string, array{0: array<string, mixed>}>
     */
    public function not_editable_states(): array
    {
        return [
            'paid' => [['payment_status' => PaymentStatus::PAID]],
            'cancelled' => [['cancelled_at' => '2026-10-01 10:00:00']],
            'shipped' => [['fulfillment_status' => FulfillmentStatus::SHIPPED]],
        ];
    }

    /**
     * @dataProvider not_editable_states
     *
     * @param array<string, mixed> $state Order columns that make the order not editable.
     */
    public function test_saving_an_edit_of_an_order_that_is_not_editable_is_refused_and_changes_nothing(array $state): void
    {
        $this->track_stock($this->variant_id, 10);
        $coupon = $this->create_percentage_coupon(10);
        $order = $this->create_order(['coupon_codes' => [$coupon->code]]);
        Order::find($order['id'])->update($state);

        $this->assert_api_error($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 3)],
            'shipping_city' => 'Albany',
        ])), 422);

        $stored = Order::find($order['id']);
        $this->assertEquals('New York', $stored->shipping_city);
        $this->assertEquals(1, OrderItem::where('order_id', $order['id'])->first()->quantity);
        $this->assertEquals(9, Variant::find($this->variant_id)->available_quantity);
        $this->assertEquals(1, OrderCoupon::where('order_id', $order['id'])->count());
        $this->assertEquals(1, Coupon::find($coupon->id)->current_usage_count);
    }

    public function test_an_order_paid_after_the_preview_cannot_be_saved(): void
    {
        $order = $this->create_order();

        $this->preview(['order_id' => $order['id'], 'items' => [$this->line($order, 2)]]);
        OrderManager::mark_payment_as_paid($order['id']);

        $this->assert_api_error($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 2)],
        ])), 422);

        $this->assertEquals(1, OrderItem::where('order_id', $order['id'])->first()->quantity);
    }

    public function test_saving_an_edit_of_an_unknown_order_is_not_found(): void
    {
        $this->assert_api_error($this->request('PUT', 'orders/999999', $this->order_payload()), 404);
    }

    // Currency and exchange rate

    public function test_an_edit_without_a_currency_keeps_the_order_currency(): void
    {
        $code = $this->create_test_currency(1.3);
        $order = $this->create_order(['currency_code' => $code]);

        $payload = $this->order_payload(['items' => [$this->line($order, 1)]]);
        unset($payload['currency_code']);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $payload));

        $this->assertEquals($code, Order::find($order['id'])->currency_code);
    }

    public function test_an_edit_cannot_change_the_order_currency(): void
    {
        $code = $this->create_test_currency(1.3);
        $order = $this->create_order(['currency_code' => $code]);

        $this->assert_api_error($this->request('PUT', 'orders/' . $order['id'], $this->order_payload(['currency_code' => 'USD', 'items' => [$this->line($order, 1)]])), 422);

        $this->assertEquals($code, Order::find($order['id'])->currency_code);
    }

    public function test_an_edit_converts_amounts_with_the_exchange_rate_the_order_was_placed_with(): void
    {
        $code = $this->create_test_currency(1.3);
        $order = $this->create_order(['currency_code' => $code]);

        Currency::query()->where('code', $code)->update(['exchange_rate' => 1.5]);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload(['currency_code' => $code, 'items' => [$this->line($order, 2)]])));

        $stored = Order::find($order['id']);
        $this->assertEquals(1.3, $stored->exchange_rate);
        $this->assertEquals((int) round($stored->base_total * 1.3), $stored->invoiced_total);
    }

    // Lines

    public function test_an_edit_keeps_every_line_as_it_was_sold(): void
    {
        $order = $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => 2]]]);
        $sold = OrderItem::find($order['items'][0]['id']);

        Variant::query()->where('id', $this->variant_id)->update(['base_price' => $sold->base_price + 500]);
        Product::query()->where('id', $sold->product_id)->update(['title' => 'Renamed Product']);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 3)],
            'shipping_city' => 'Albany',
        ])));

        $item = OrderItem::find($sold->id);
        $this->assertSame($sold->product_name, $item->product_name);
        $this->assertSame($sold->base_price, $item->base_price);
        $this->assertSame($sold->base_catalog_sale_price, $item->base_catalog_sale_price);
        $this->assertSame($sold->base_catalog_regular_price, $item->base_catalog_regular_price);
        $this->assertEquals($sold->base_price * 3, $item->base_subtotal);
        $this->assertSame(3, $item->quantity);
    }

    public function test_a_new_line_takes_the_current_variant_price(): void
    {
        $order = $this->create_order();
        $added_variant_id = $this->default_variant_id($this->create_product());
        Variant::query()->where('id', $added_variant_id)->update(['base_price' => 4321, 'base_sale_price' => null]);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 1), ['variant_id' => $added_variant_id, 'quantity' => 2]],
        ])));

        $added_item = OrderItem::where('order_id', $order['id'])->where('variant_id', $added_variant_id)->first();
        $this->assertEquals(4321, $added_item->base_price);
        $this->assertEquals(4321 * 2, $added_item->base_subtotal);
        $this->assertNotEmpty($added_item->product_name);
    }

    public function test_a_line_whose_product_was_deleted_stays_with_its_stored_values(): void
    {
        $deleted_product = $this->create_product();
        $deleted_variant_id = $this->default_variant_id($deleted_product);
        $order = $this->create_order(['items' => [
            ['variant_id' => $this->variant_id, 'quantity' => 1],
            ['variant_id' => $deleted_variant_id, 'quantity' => 2],
        ]]);
        $stored_line = OrderItem::where('order_id', $order['id'])->where('variant_id', $deleted_variant_id)->first();

        $this->delete_product($deleted_product['id']);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 1, 0), $this->line($order, 2, 1)],
            'shipping_city' => 'Albany',
        ])));

        $line = OrderItem::find($stored_line->id);
        $this->assertNotNull($line);
        $this->assertNull($line->variant_id);
        $this->assertSame($stored_line->base_total, $line->base_total);
        $this->assertSame(2, $line->quantity);
        $this->assertCount(2, OrderItem::where('order_id', $order['id'])->get());
        $this->assertSame(3, Order::find($order['id'])->items_count);
    }

    public function test_removing_a_line_whose_variant_was_deleted_gives_back_no_stock(): void
    {
        $this->track_stock($this->variant_id, 10);
        $deleted_product = $this->create_product();
        $deleted_variant_id = $this->default_variant_id($deleted_product);
        $order = $this->create_order(['items' => [
            ['variant_id' => $this->variant_id, 'quantity' => 1],
            ['variant_id' => $deleted_variant_id, 'quantity' => 1],
        ]]);
        $deleted_line_id = (int) $order['items'][1]['id'];

        $this->delete_product($deleted_product['id']);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 1, 0)],
        ])));

        $this->assertNull(OrderItem::find($deleted_line_id));
        $this->assertEquals(9, Variant::find($this->variant_id)->available_quantity);
        $this->assertEquals(1, Order::find($order['id'])->items_count);
    }

    public function test_an_order_line_of_another_order_is_refused(): void
    {
        $order = $this->create_order();
        $other_order = $this->create_order();

        $this->assert_api_error($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($other_order, 1)],
        ])), 422);
    }

    public function test_a_new_line_for_a_variant_the_order_already_holds_is_refused(): void
    {
        $order = $this->create_order();

        $this->assert_api_error($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 1), ['variant_id' => $this->variant_id, 'quantity' => 1]],
        ])), 422);
    }

    public function test_a_new_line_for_a_draft_product_is_refused(): void
    {
        $order = $this->create_order();
        $draft_product = $this->create_product(['status' => ProductStatus::DRAFT]);

        $this->assert_api_error($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 1), ['variant_id' => $this->default_variant_id($draft_product), 'quantity' => 1]],
        ])), 422);
    }

    // Lines that can no longer be bought

    public function test_the_quantity_of_a_line_whose_product_is_now_a_draft_cannot_change(): void
    {
        $order = $this->create_order();
        Product::query()->where('id', Variant::find($this->variant_id)->product_id)->update(['status' => ProductStatus::DRAFT]);

        $this->assert_api_error($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 3)],
        ])), 422);

        $this->assertSame(1, OrderItem::where('order_id', $order['id'])->first()->quantity);
    }

    public function test_a_line_whose_product_is_now_a_draft_stays_when_its_quantity_is_not_changed(): void
    {
        $order = $this->create_order();
        Product::query()->where('id', Variant::find($this->variant_id)->product_id)->update(['status' => ProductStatus::DRAFT]);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 1)],
            'order_notes' => 'Draft product kept',
        ])));

        $this->assertSame(1, OrderItem::where('order_id', $order['id'])->first()->quantity);
    }

    public function test_the_quantity_of_a_line_whose_variant_was_deleted_cannot_be_lowered(): void
    {
        $deleted_product = $this->create_product();
        $order = $this->create_order(['items' => [['variant_id' => $this->default_variant_id($deleted_product), 'quantity' => 2]]]);

        $this->delete_product($deleted_product['id']);

        $this->assert_api_error($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 1)],
        ])), 422);
    }

    // Stock and the per-order limit

    public function test_an_unchanged_line_on_a_sold_out_variant_can_be_saved(): void
    {
        $this->track_stock($this->variant_id, 5);
        $order = $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => 5]]]);
        $this->assertEquals(0, Variant::find($this->variant_id)->available_quantity);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 5)],
            'shipping_city' => 'Albany',
        ])));

        $this->assertEquals(0, Variant::find($this->variant_id)->available_quantity);
        $this->assertEquals(5, OrderItem::where('order_id', $order['id'])->first()->quantity);
    }

    public function test_raising_a_quantity_beyond_stock_fails_and_changes_nothing(): void
    {
        $this->track_stock($this->variant_id, 3);
        $order = $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => 2]]]);

        $response = $this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 4)],
        ]));

        $this->assertGreaterThanOrEqual(400, $response->get_status());
        $this->assertEquals(2, OrderItem::where('order_id', $order['id'])->first()->quantity);
        $this->assertEquals(1, Variant::find($this->variant_id)->available_quantity);
    }

    public function test_raising_a_quantity_reserves_the_live_stock_for_the_added_units(): void
    {
        $this->track_stock($this->variant_id, 10);
        $order = $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => 2]]]);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 5)],
        ])));

        $this->assertEquals(5, Variant::find($this->variant_id)->available_quantity);
    }

    public function test_lowering_a_quantity_releases_the_difference(): void
    {
        $this->track_stock($this->variant_id, 10);
        $order = $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => 5]]]);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 2)],
        ])));

        $this->assertEquals(8, Variant::find($this->variant_id)->available_quantity);
    }

    /**
     * @return array<string, array{0: int, 1: int, 2: int, 3: bool}>
     */
    public function per_order_limit_changes(): array
    {
        return [
            'limit lowered, room for one more' => [5, 4, 5, true],
            'limit lowered, no room for two more' => [5, 4, 6, false],
            'limit below the stored quantity, quantity kept' => [2, 4, 4, true],
            'limit below the stored quantity, quantity lowered' => [2, 4, 3, true],
            'limit below the stored quantity, quantity raised' => [2, 4, 5, false],
        ];
    }

    /**
     * @dataProvider per_order_limit_changes
     *
     * @param int  $limit           Per-order limit when the edit is saved.
     * @param int  $stored_quantity Quantity on the order.
     * @param int  $new_quantity    Quantity sent.
     * @param bool $is_saved        Whether the edit is accepted.
     */
    public function test_a_per_order_limit_blocks_only_a_raised_quantity(int $limit, int $stored_quantity, int $new_quantity, bool $is_saved): void
    {
        $order = $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => $stored_quantity]]]);
        Variant::query()->where('id', $this->variant_id)->update(['has_limit_per_order' => true, 'max_per_order' => $limit]);

        $response = $this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, $new_quantity)],
        ]));

        if ($is_saved) {
            $this->assert_api_success($response);
            $this->assertSame($new_quantity, OrderItem::where('order_id', $order['id'])->first()->quantity);

            return;
        }

        $this->assert_api_error($response, 422);
        $this->assertSame($stored_quantity, OrderItem::where('order_id', $order['id'])->first()->quantity);
    }

    // Coupons

    public function test_a_stored_coupon_keeps_its_rate_after_the_coupon_changed_and_expired(): void
    {
        $coupon = $this->create_percentage_coupon(10);
        $order = $this->create_order(['coupon_codes' => [$coupon->code]]);

        $coupon->update(['discount_amount_percentage' => 50, 'is_active' => false]);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 3)],
            'coupon_codes' => [$coupon->code],
        ])));

        $item = OrderItem::find($order['items'][0]['id']);
        $order_coupon = OrderCoupon::where('order_id', $order['id'])->first();
        $this->assertEquals(10, $order_coupon->discount_rate);
        $this->assertSame((int) round($item->base_subtotal * 0.10), $order_coupon->base_discount_amount);
        $this->assertEquals($order_coupon->base_discount_amount, Order::find($order['id'])->base_discount_total);
        $this->assertEquals(1, Coupon::find($coupon->id)->current_usage_count);
    }

    public function test_a_stored_coupon_still_applies_when_its_coupon_was_deleted(): void
    {
        $coupon = $this->create_percentage_coupon(10);
        $order = $this->create_order(['coupon_codes' => [$coupon->code]]);

        Coupon::query()->where('id', $coupon->id)->delete();

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 2)],
            'coupon_codes' => [$coupon->code],
        ])));

        $order_coupon = OrderCoupon::where('order_id', $order['id'])->first();
        $item = OrderItem::find($order['items'][0]['id']);
        $this->assertNotNull($order_coupon);
        $this->assertNull($order_coupon->coupon_id);
        $this->assertSame((int) round($item->base_subtotal * 0.10), $order_coupon->base_discount_amount);
    }

    public function test_editing_the_order_that_took_a_coupons_last_use_keeps_the_coupon(): void
    {
        $coupon = $this->create_percentage_coupon(10);
        $coupon->update(['has_usage_limit' => true, 'usage_limit' => 1]);

        $order = $this->create_order(['coupon_codes' => [$coupon->code]]);
        $this->assertEquals(1, Coupon::find($coupon->id)->current_usage_count);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 2)],
            'coupon_codes' => [$coupon->code],
        ])));

        $this->assertEquals(1, OrderCoupon::where('order_id', $order['id'])->count());
        $this->assertEquals(1, Coupon::find($coupon->id)->current_usage_count);
    }

    public function test_another_order_cannot_take_a_coupon_at_its_limit(): void
    {
        $coupon = $this->create_percentage_coupon(10);
        $coupon->update(['has_usage_limit' => true, 'usage_limit' => 1]);

        $this->create_order(['coupon_codes' => [$coupon->code]]);
        $other_order = $this->create_order();

        $this->assert_api_success($this->request('PUT', 'orders/' . $other_order['id'], $this->order_payload([
            'items' => [$this->line($other_order, 1)],
            'coupon_codes' => [$coupon->code],
        ])));

        $this->assertEquals(0, OrderCoupon::where('order_id', $other_order['id'])->count());
        $this->assertEquals(1, Coupon::find($coupon->id)->current_usage_count);
    }

    public function test_a_coupon_removed_from_an_order_after_it_was_deleted_cannot_be_applied_again(): void
    {
        $coupon = $this->create_percentage_coupon(10);
        $order = $this->create_order(['coupon_codes' => [$coupon->code]]);

        Coupon::query()->where('id', $coupon->id)->delete();

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 1)],
            'coupon_codes' => [],
        ])));
        $this->assertEquals(0, OrderCoupon::where('order_id', $order['id'])->count());

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 1)],
            'coupon_codes' => [$coupon->code],
        ])));
        $this->assertEquals(0, OrderCoupon::where('order_id', $order['id'])->count());
        $this->assertEquals(0, Order::find($order['id'])->base_discount_total);
    }

    public function test_a_live_coupon_added_in_an_edit_is_priced_from_the_coupon_and_counts_a_use(): void
    {
        $coupon = $this->create_percentage_coupon(20);
        $order = $this->create_order();

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 2)],
            'coupon_codes' => [$coupon->code],
        ])));

        $order_coupon = OrderCoupon::where('order_id', $order['id'])->first();
        $this->assertEquals(20, $order_coupon->discount_rate);
        $this->assertEquals(1, Coupon::find($coupon->id)->current_usage_count);
    }

    public function test_a_product_coupon_follows_the_new_quantity_of_its_line(): void
    {
        $coupon = $this->create_amount_off_coupon(DiscountTarget::PRODUCTS, DiscountValueType::PERCENTAGE, 10);
        $order = $this->create_order(['coupon_codes' => [$coupon->code]]);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 3)],
            'coupon_codes' => [$coupon->code],
        ])));

        $item = OrderItem::find($order['items'][0]['id']);
        $this->assertEquals((int) round($item->base_subtotal * 0.10), $item->base_discount_amount);
    }

    public function test_a_fixed_product_coupon_keeps_its_amount_for_its_line(): void
    {
        $coupon = $this->create_amount_off_coupon(DiscountTarget::PRODUCTS, DiscountValueType::FIXED, 300);
        $order = $this->create_order(['coupon_codes' => [$coupon->code]]);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 3)],
            'coupon_codes' => [$coupon->code],
        ])));

        $this->assertEquals(300, OrderItem::find($order['items'][0]['id'])->base_discount_amount);
    }

    public function test_an_order_wide_coupon_also_discounts_a_new_line(): void
    {
        $coupon = $this->create_percentage_coupon(10);
        $order = $this->create_order(['coupon_codes' => [$coupon->code]]);
        $added_variant_id = $this->default_variant_id($this->create_product());

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 1), ['variant_id' => $added_variant_id, 'quantity' => 1]],
            'coupon_codes' => [$coupon->code],
        ])));

        $added_item = OrderItem::where('order_id', $order['id'])->where('variant_id', $added_variant_id)->first();
        $this->assertGreaterThan(0, $added_item->base_discount_amount);
        $this->assertEquals((int) round($added_item->base_subtotal * 0.10), $added_item->base_discount_amount);
        $this->assertEquals(OrderItem::where('order_id', $order['id'])->sum('base_discount_amount'), OrderCoupon::where('order_id', $order['id'])->first()->base_discount_amount);
    }

    public function test_a_product_coupon_never_discounts_a_new_line(): void
    {
        $coupon = $this->create_amount_off_coupon(DiscountTarget::PRODUCTS, DiscountValueType::PERCENTAGE, 10);
        $order = $this->create_order(['coupon_codes' => [$coupon->code]]);
        $added_variant_id = $this->default_variant_id($this->create_product());

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 1), ['variant_id' => $added_variant_id, 'quantity' => 1]],
            'coupon_codes' => [$coupon->code],
        ])));

        $this->assertEquals(0, OrderItem::where('order_id', $order['id'])->where('variant_id', $added_variant_id)->first()->base_discount_amount);
        $this->assertGreaterThan(0, OrderItem::find($order['items'][0]['id'])->base_discount_amount);
    }

    public function test_a_fixed_order_coupon_keeps_its_total_and_shares_it_with_a_new_line(): void
    {
        $coupon = $this->create_amount_off_coupon(DiscountTarget::ORDER, DiscountValueType::FIXED, 300);
        $order = $this->create_order(['coupon_codes' => [$coupon->code]]);
        $added_variant_id = $this->default_variant_id($this->create_product());

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 1), ['variant_id' => $added_variant_id, 'quantity' => 1]],
            'coupon_codes' => [$coupon->code],
        ])));

        $this->assertSame(300, OrderCoupon::where('order_id', $order['id'])->first()->base_discount_amount);
        $this->assertSame(300, (int) OrderItem::where('order_id', $order['id'])->sum('base_discount_amount'));
        $this->assertGreaterThan(0, OrderItem::where('order_id', $order['id'])->where('variant_id', $added_variant_id)->first()->base_discount_amount);
    }

    /**
     * @return array<string, array{string}>
     */
    public function fixed_coupon_targets(): array
    {
        return [
            'order coupon' => [DiscountTarget::ORDER],
            'product coupon' => [DiscountTarget::PRODUCTS],
        ];
    }

    /**
     * @dataProvider fixed_coupon_targets
     * @param string $target Scope of the fixed coupon.
     */
    public function test_a_fixed_coupon_keeps_its_maximum_after_a_capped_edit(string $target): void
    {
        Variant::query()->where('id', $this->variant_id)->update(['base_price' => 600, 'base_sale_price' => 600]);
        $coupon = $this->create_amount_off_coupon($target, DiscountValueType::FIXED, 1000);
        $order = $this->create_order([
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 2]],
            'coupon_codes' => [$coupon->code],
        ]);

        Coupon::query()->where('id', $coupon->id)->delete();

        foreach ([1 => 600, 2 => 1000, 3 => 1000] as $quantity => $expected_discount) {
            $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
                'items' => [$this->line($order, $quantity)],
                'coupon_codes' => [$coupon->code],
            ])));

            $order_coupon = OrderCoupon::where('order_id', $order['id'])->first();
            $item_coupon = OrderItemCoupon::where('order_coupon_id', $order_coupon->id)->first();

            $this->assertSame(1000, $order_coupon->base_max_discount_amount);
            $this->assertSame(1000, $item_coupon->base_max_discount_amount);
            $this->assertSame($expected_discount, $order_coupon->base_discount_amount);
            $this->assertSame($expected_discount, $item_coupon->base_discount_amount);
        }
    }

    public function test_a_fixed_product_coupon_keeps_its_maximum_when_an_edit_uses_none_of_it(): void
    {
        Variant::query()->where('id', $this->variant_id)->update(['base_price' => 600, 'base_sale_price' => 600]);
        $stored_coupon = $this->create_amount_off_coupon(DiscountTarget::PRODUCTS, DiscountValueType::FIXED, 1000);
        $order = $this->create_order([
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 2]],
            'coupon_codes' => [$stored_coupon->code],
        ]);
        $new_coupon = $this->create_amount_off_coupon(DiscountTarget::PRODUCTS, DiscountValueType::FIXED, 1200);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 2)],
            'coupon_codes' => [$stored_coupon->code, $new_coupon->code],
        ])));

        $order_coupon = OrderCoupon::where('order_id', $order['id'])->where('code', $stored_coupon->code)->first();
        $item_coupon = OrderItemCoupon::where('order_coupon_id', $order_coupon->id)->first();
        $this->assertSame(0, $item_coupon->base_discount_amount);
        $this->assertSame(1000, $item_coupon->base_max_discount_amount);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 2)],
            'coupon_codes' => [$stored_coupon->code],
        ])));

        $this->assertSame(1000, (int) OrderItem::find($order['items'][0]['id'])->base_discount_amount);
    }

    // Shipping and tax

    /**
     * @return array<string, array{bool}>
     */
    public function free_shipping_starting_states(): array
    {
        return [
            'free shipping added in an edit' => [false],
            'free shipping applied at checkout' => [true],
        ];
    }

    /**
     * @dataProvider free_shipping_starting_states
     * @param bool $starts_with_free_shipping Whether checkout already applies the coupon.
     */
    public function test_shipping_tax_rate_survives_free_shipping_and_is_used_when_it_is_removed(bool $starts_with_free_shipping): void
    {
        $this->enable_tax(false, 10, 10);
        $this->rename_shipping_method('Standard Delivery', 10, true, true);
        $coupon = Coupon::create([
            'title' => 'Free Shipping',
            'code' => 'SHIP' . strtoupper(wp_generate_password(6, false)),
            'discount_type' => DiscountType::FREE_SHIPPING,
            'is_active' => true,
        ]);
        $order = $this->create_order(['coupon_codes' => $starts_with_free_shipping ? [$coupon->code] : []]);

        $this->enable_tax(false, 20, 20);
        $this->rename_shipping_method('Standard Delivery', 15, true, true);

        for ($edit = 0; $edit < 2; $edit++) {
            $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
                'items' => [$this->line($order, 1)],
                'coupon_codes' => [$coupon->code],
            ])));

            $shipping_taxes = OrderTax::where('order_id', $order['id'])->where('type', OrderTaxType::SHIPPING)->get();
            $this->assertCount(1, $shipping_taxes);
            $this->assertEquals(10, $shipping_taxes->first()->rate);
            $this->assertEquals(0, $shipping_taxes->first()->base_amount);
            $this->assertSame(0, (int) Order::find($order['id'])->base_shipping_total);
        }

        Coupon::query()->where('id', $coupon->id)->delete();
        $payload = ['items' => [$this->line($order, 1)], 'coupon_codes' => []];
        $preview = $this->preview(array_merge($payload, ['order_id' => $order['id']]));
        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload($payload)));

        $saved = Order::find($order['id']);
        $this->assertSame(100, $saved->base_shipping_tax_amount);
        $this->assertSame(1100, (int) $saved->base_shipping_total);
        $this->assertSame((int) round($preview['totals']['base_total_money_object']['raw'] * 100), (int) $saved->base_total);
    }

    public function test_an_edit_keeps_the_shipping_cost_and_method_name_for_an_address_that_did_not_change(): void
    {
        $order = $this->create_order();
        $stored = Order::find($order['id']);

        $this->rename_shipping_method('Express Delivery', 15);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 2)],
            'shipping_city' => 'Albany',
        ])));

        $saved = Order::find($order['id']);
        $this->assertSame($stored->base_shipping_total, $saved->base_shipping_total);
        $this->assertSame($stored->shipping_metadata, $saved->shipping_metadata);
    }

    public function test_an_edit_that_changes_the_state_quotes_shipping_again(): void
    {
        $order = $this->create_order();
        $stored = Order::find($order['id']);

        $this->rename_shipping_method('Express Delivery', 15);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 1)],
            'shipping_state' => 'CA',
        ])));

        $saved = Order::find($order['id']);
        $this->assertGreaterThan($stored->base_shipping_total, $saved->base_shipping_total);
        $this->assertEquals('Express Delivery', $saved->shipping_metadata['shipping_method']['name']);
    }

    public function test_an_edit_that_changes_the_state_to_one_the_method_does_not_serve_is_refused(): void
    {
        $order = $this->create_order();

        $this->assert_api_error($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 1)],
            'shipping_country' => 'CA',
            'shipping_state' => 'ON',
        ])), 422);
    }

    public function test_an_edit_keeps_the_tax_rate_for_an_address_that_did_not_change(): void
    {
        $this->enable_tax(false, 10);
        $order = $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => 1]]]);

        $this->enable_tax(false, 20);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 2)],
            'shipping_city' => 'Albany',
        ])));

        $item = OrderItem::find($order['items'][0]['id']);
        $this->assertEquals(10, OrderTax::where('order_id', $order['id'])->first()->rate);
        $this->assertEquals((int) round($item->base_subtotal * 0.10), $item->base_tax_total);
    }

    public function test_an_edit_that_changes_the_state_calculates_the_tax_rate_again(): void
    {
        $this->enable_tax(false, 10);
        $order = $this->create_order();

        $this->enable_tax(false, 20);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 1)],
            'shipping_state' => 'CA',
        ])));

        $item = OrderItem::find($order['items'][0]['id']);
        $this->assertEquals(20, OrderTax::where('order_id', $order['id'])->first()->rate);
        $this->assertEquals((int) round($item->base_subtotal * 0.20), $item->base_tax_total);
    }

    public function test_a_new_line_is_taxed_at_the_current_rate_for_an_address_that_did_not_change(): void
    {
        $this->enable_tax(false, 10);
        $order = $this->create_order();
        $added_variant_id = $this->default_variant_id($this->create_product());

        $this->enable_tax(false, 20);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [$this->line($order, 1), ['variant_id' => $added_variant_id, 'quantity' => 1]],
        ])));

        $old_item = OrderItem::find($order['items'][0]['id']);
        $added_item = OrderItem::where('order_id', $order['id'])->where('variant_id', $added_variant_id)->first();
        $this->assertEquals((int) round($old_item->base_subtotal * 0.10), $old_item->base_tax_total);
        $this->assertEquals((int) round($added_item->base_subtotal * 0.20), $added_item->base_tax_total);
    }

    // Previews

    public function test_previewing_an_edit_of_an_editable_order_succeeds(): void
    {
        $order = $this->create_order();

        $preview = $this->preview(['order_id' => $order['id'], 'items' => [$this->line($order, 1)]]);

        $this->assertSame((int) $order['items'][0]['id'], $preview['items'][0]['order_item_id']);
        $this->assertTrue($preview['items'][0]['is_reachable']);
    }

    public function test_previewing_an_edit_of_a_paid_order_is_refused(): void
    {
        $order = $this->create_order();
        Order::find($order['id'])->update(['payment_status' => PaymentStatus::PAID]);

        $this->assert_api_error($this->request('POST', 'calculate/order', $this->order_payload(['order_id' => $order['id'], 'items' => [$this->line($order, 1)]])), 422);
    }

    public function test_previewing_an_edit_of_an_unknown_order_is_not_found(): void
    {
        $this->assert_api_error($this->request('POST', 'calculate/order', $this->order_payload(['order_id' => 999999])), 404);
    }

    public function test_a_create_preview_has_no_order_line_and_live_stock_values(): void
    {
        $this->track_stock($this->variant_id, 7);
        Variant::query()->where('id', $this->variant_id)->update(['has_limit_per_order' => true, 'max_per_order' => 4]);
        $coupon = $this->create_percentage_coupon(10);

        $preview = $this->preview(['coupon_codes' => [$coupon->code, 'NOSUCHCODE']]);

        $this->assertCount(1, $preview['items']);
        $this->assertNull($preview['items'][0]['order_item_id']);
        $this->assertTrue($preview['items'][0]['is_reachable']);
        $this->assertTrue($preview['items'][0]['track_inventory']);
        $this->assertFalse($preview['items'][0]['allow_back_order']);
        $this->assertSame(7, $preview['items'][0]['available_quantity']);
        $this->assertTrue($preview['items'][0]['in_stock']);
        $this->assertTrue($preview['items'][0]['has_limit_per_order']);
        $this->assertSame(4, $preview['items'][0]['max_per_order']);
        $this->assertSame([$coupon->code], array_column($preview['coupons'], 'code'));
    }

    public function test_an_edit_preview_marks_the_lines_that_are_not_reachable(): void
    {
        $draft_product = $this->create_product();
        $deleted_product = $this->create_product();
        $order = $this->create_order(['items' => [
            ['variant_id' => $this->variant_id, 'quantity' => 1],
            ['variant_id' => $this->default_variant_id($draft_product), 'quantity' => 1],
            ['variant_id' => $this->default_variant_id($deleted_product), 'quantity' => 1],
        ]]);

        Product::query()->where('id', $draft_product['id'])->update(['status' => ProductStatus::DRAFT]);
        $this->delete_product($deleted_product['id']);

        $preview = $this->preview(['order_id' => $order['id'], 'items' => [$this->line($order, 1, 0), $this->line($order, 1, 1), $this->line($order, 1, 2)]]);

        $this->assertSame([true, false, false], array_column($preview['items'], 'is_reachable'));
        $this->assertNotNull($preview['items'][1]['available_quantity']);
        $this->assertNull($preview['items'][2]['available_quantity']);
        $this->assertNull($preview['items'][2]['max_per_order']);
        $this->assertSame(3, $preview['items_count']);
    }

    public function test_a_preview_does_not_block_on_stock_the_per_order_limit_or_a_locked_line_but_the_save_does(): void
    {
        $this->track_stock($this->variant_id, 2);
        Variant::query()->where('id', $this->variant_id)->update(['has_limit_per_order' => true, 'max_per_order' => 3]);
        $order = $this->create_order();

        $payload = ['order_id' => $order['id'], 'items' => [$this->line($order, 5)]];
        $preview = $this->preview($payload);

        $this->assertSame(5, $preview['items'][0]['quantity']);
        $this->assertSame(1, $preview['items'][0]['available_quantity']);
        $this->assertSame(3, $preview['items'][0]['max_per_order']);

        $this->assert_api_error($this->request('PUT', 'orders/' . $order['id'], $this->order_payload($payload)), 422);
    }

    public function test_an_edit_preview_prices_the_order_with_the_promised_terms_and_the_save_matches_it(): void
    {
        $this->enable_tax(false, 10);
        $other_product = $this->create_product();
        $other_variant_id = $this->default_variant_id($other_product);
        $coupon = $this->create_percentage_coupon(10);
        $order = $this->create_order([
            'items' => [
                ['variant_id' => $this->variant_id, 'quantity' => 2],
                ['variant_id' => $other_variant_id, 'quantity' => 1],
            ],
            'coupon_codes' => [$coupon->code],
        ]);
        $stored = Order::find($order['id']);
        $stored_price = OrderItem::find($order['items'][0]['id'])->base_price;

        Variant::query()->where('id', $this->variant_id)->update(['base_price' => $stored_price + 500]);
        $coupon->update(['is_active' => false, 'discount_amount_percentage' => 50]);
        $this->delete_product($other_product['id']);
        $this->rename_shipping_method('Express Delivery', 15);
        $this->enable_tax(false, 20);

        $payload = [
            'order_id' => $order['id'],
            'items' => [$this->line($order, 3, 0), $this->line($order, 1, 1)],
            'coupon_codes' => [$coupon->code],
        ];
        $preview = $this->preview($payload);

        $this->assertSame([true, false], array_column($preview['items'], 'is_reachable'));
        $this->assertEquals(10, $preview['tax_lines'][0]['rate']);
        $this->assertSame([$coupon->code], array_column($preview['coupons'], 'code'));

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload($payload)));

        $saved = Order::find($order['id']);
        $this->assertEquals($preview['totals']['base_total_money_object']['raw'], $saved->base_total / 100);
        $this->assertEquals($preview['totals']['base_tax_total_money_object']['raw'], $saved->base_tax_total / 100);
        $this->assertEquals($preview['totals']['base_shipping_amount_money_object']['raw'], $saved->base_shipping_total / 100);
        $this->assertSame($stored->base_shipping_total, $saved->base_shipping_total);
        $this->assertSame($stored_price, OrderItem::find($order['items'][0]['id'])->base_price);
        $this->assertEquals(1, Coupon::find($coupon->id)->current_usage_count);
        $this->assertCount(2, OrderItem::where('order_id', $order['id'])->get());

        // A new delivery state is the one thing that quotes shipping and tax again, preview and save alike.
        $payload['shipping_state'] = 'CA';
        $moved_preview = $this->preview($payload);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload($payload)));

        $moved = Order::find($order['id']);
        $this->assertGreaterThan($saved->base_shipping_total, $moved->base_shipping_total);
        $this->assertEquals(20, OrderTax::where('order_id', $order['id'])->first()->rate);
        $this->assertEquals($moved_preview['totals']['base_total_money_object']['raw'], $moved->base_total / 100);
        $this->assertEquals($moved_preview['totals']['base_shipping_amount_money_object']['raw'], $moved->base_shipping_total / 100);
        $this->assertEquals($moved_preview['totals']['base_tax_total_money_object']['raw'], $moved->base_tax_total / 100);
        $this->assertEquals(1, Coupon::find($coupon->id)->current_usage_count);
    }

    /**
     * Request an order calculation preview and return its data.
     *
     * @param array<string, mixed> $overrides Payload overrides.
     * @return array<string, mixed>
     */
    protected function preview(array $overrides = []): array
    {
        $response = $this->request('POST', 'calculate/order', $this->order_payload($overrides));

        $this->assertEquals(200, $response->get_status());

        return $this->normalize_response_data($response->get_data())['data'];
    }

    /**
     * Tax US orders at a central rate, inclusive or exclusive of the price.
     *
     * @param bool           $is_tax_inclusive Whether prices include tax.
     * @param int|float      $rate             Tax rate in percent.
     * @param int|float|null $shipping_rate    Shipping tax rate, or null when shipping tax is disabled.
     * @return void
     */
    protected function enable_tax(bool $is_tax_inclusive, $rate = 10, $shipping_rate = null): void
    {
        $this->assert_api_success($this->request('PUT', 'settings', [
            'key' => OptionKeys::TAX_SETTINGS,
            'data' => [
                'is_tax_inclusive_price' => $is_tax_inclusive,
                'is_shipping_tax_enabled' => $shipping_rate !== null,
                'is_enabled_display_inclusive_taxed_price' => false,
                'tax_regions' => [
                    [
                        'code' => 'US',
                        'is_enabled' => true,
                        'type' => null,
                        'is_central_tax_enabled' => true,
                        'central_product_tax' => $rate,
                        'central_shipping_tax' => $shipping_rate ?? 0,
                        'states' => [],
                        'rules' => [],
                    ],
                ],
                'tax_services' => [],
                'tax_ids' => [],
            ],
        ]));
    }

    /**
     * Tax US orders at 10%, except a variant's own tax profile, which is taxed at 5%.
     *
     * @param int $variant_id Variant that gets the reduced-rate tax profile.
     * @return void
     */
    protected function use_reduced_rate_tax_profile_for(int $variant_id): void
    {
        $profile = $this->assert_api_success($this->request('POST', 'tax-profiles', [
            'name' => 'Reduced ' . wp_generate_password(4, false),
            'is_default' => false,
        ]), 201)['data'];

        Variant::query()->where('id', $variant_id)->update(['tax_profile_id' => $profile['id']]);

        $this->assert_api_success($this->request('PUT', 'settings', [
            'key' => OptionKeys::TAX_SETTINGS,
            'data' => [
                'is_tax_inclusive_price' => false,
                'is_shipping_tax_enabled' => false,
                'is_enabled_display_inclusive_taxed_price' => false,
                'tax_regions' => [
                    [
                        'code' => 'US',
                        'is_enabled' => true,
                        'type' => null,
                        'is_central_tax_enabled' => true,
                        'central_product_tax' => 10,
                        'central_shipping_tax' => 0,
                        'states' => [],
                        'rules' => [
                            [
                                'relation' => 'AND',
                                'conditions' => [
                                    ['type' => 'tax_profile', 'operator' => '=', 'value' => $profile['id']],
                                ],
                                'action' => ['type' => 'set_product_tax_rate', 'value' => 5],
                            ],
                        ],
                    ],
                ],
                'tax_services' => [],
                'tax_ids' => [],
            ],
        ]));
    }

    /**
     * Turn on stock tracking for a variant with the given available quantity.
     *
     * @param int $variant_id Variant ID.
     * @param int $quantity   Available quantity.
     * @return void
     */
    protected function track_stock(int $variant_id, int $quantity): void
    {
        Variant::query()->where('id', $variant_id)->update([
            'track_inventory' => true,
            'allow_back_order' => false,
            'in_stock' => true,
            'available_quantity' => $quantity,
            'committed_quantity' => 0,
        ]);
    }

    /**
     * Make GBP an active non-base currency with the given exchange rate.
     *
     * @param float $exchange_rate Rate from the base currency.
     * @return string The currency code.
     */
    protected function create_test_currency($exchange_rate): string
    {
        $code = 'GBP';

        if (Currency::query()->where('code', $code)->count() > 0) {
            Currency::query()->where('code', $code)->update(['exchange_rate' => $exchange_rate, 'is_active' => true]);

            return $code;
        }

        $response = $this->request('POST', 'currencies', [
            'items' => [
                [
                    'code' => $code,
                    'name' => 'Test Currency',
                    'symbol' => '$',
                    'exchange_rate' => $exchange_rate,
                    'is_active' => true,
                    'is_base' => false,
                ],
            ],
        ]);

        $this->assert_api_success($response, 201);

        return $code;
    }

    /**
     * Rename, reprice or disable the test zone's flat-rate method, keeping its ID.
     *
     * @param string $name        New method name.
     * @param int    $base_amount Flat rate, in major units.
     * @param bool   $is_enabled  Whether the method stays enabled.
     * @param bool   $is_taxable  Whether the method is taxable.
     * @return void
     */
    protected function rename_shipping_method(string $name, int $base_amount = 10, bool $is_enabled = true, bool $is_taxable = false): void
    {
        $this->assert_api_success($this->request('PUT', 'settings', [
            'key' => OptionKeys::SHIPPING_SETTINGS,
            'data' => [
                'shipping_zones' => [
                    [
                        'id' => 'zone-test',
                        'is_enabled' => true,
                        'title' => 'Test Zone',
                        'regions' => [['country' => 'US', 'states' => []]],
                        'shipping_methods' => [
                            [
                                'id' => 'method-0001',
                                'is_enabled' => $is_enabled,
                                'name' => $name,
                                'type' => ShippingMethodTypes::FLAT_RATE,
                                'base_amount' => $base_amount,
                                'is_taxable' => $is_taxable,
                                'description' => null,
                                'shipping_rules' => [],
                            ],
                        ],
                    ],
                ],
            ],
        ]));

        static::forget_singleton(ShippingService::class);
    }

    /**
     * Create a manual order through the API and return its resource data.
     *
     * @param array<string, mixed> $overrides Payload overrides.
     * @return array<string, mixed>
     */
    protected function create_order(array $overrides = []): array
    {
        return $this->assert_api_success($this->request('POST', 'orders', $this->order_payload($overrides)), 201)['data'];
    }

    /**
     * Delete a product, and with it its variants, the way the catalog does.
     *
     * @param int $product_id Product ID.
     * @return void
     */
    protected function delete_product(int $product_id): void
    {
        Product::query()->where('id', $product_id)->delete();
    }

    /**
     * Create an active order-wide percentage coupon.
     *
     * @param float $percentage Discount percentage.
     * @return Coupon
     */
    protected function create_percentage_coupon($percentage): Coupon
    {
        return $this->create_amount_off_coupon(DiscountTarget::ORDER, DiscountValueType::PERCENTAGE, $percentage);
    }

    /**
     * Create an active amount-off coupon for every product.
     *
     * @param string    $target     A DiscountTarget value: the whole order, or each product line.
     * @param string    $value_type A DiscountValueType value.
     * @param int|float $amount     Percentage, or fixed amount in minor units.
     * @return Coupon
     */
    protected function create_amount_off_coupon(string $target, string $value_type, $amount): Coupon
    {
        return Coupon::create(array_merge([
            'title' => 'Edit Coupon',
            'code' => 'EDIT' . strtoupper(wp_generate_password(6, false)),
            'discount_type' => DiscountType::AMOUNT_OFF,
            'discount_target' => $target,
            'discount_value_type' => $value_type,
            'eligible_item_type' => EligibleItemType::ALL_PRODUCTS,
            'is_active' => true,
        ], $value_type === DiscountValueType::FIXED ? ['base_discount_amount_fixed' => $amount] : ['discount_amount_percentage' => $amount]));
    }

    /**
     * Build the payload line of a line that is already on the order.
     *
     * @param array<string, mixed> $order    Order resource data, as created.
     * @param int                  $quantity New quantity of the line.
     * @param int                  $index    Position of the line on the order.
     * @return array{order_item_id: int, quantity: int}
     */
    protected function line(array $order, int $quantity, int $index = 0): array
    {
        return ['order_item_id' => (int) $order['items'][$index]['id'], 'quantity' => $quantity];
    }

    /**
     * Build a manual order payload for the default product, shipped to New York.
     *
     * @param array<string, mixed> $overrides Payload overrides.
     * @return array<string, mixed>
     */
    protected function order_payload(array $overrides = []): array
    {
        return array_merge([
            'items' => [
                ['variant_id' => $this->variant_id, 'quantity' => 1],
            ],
            'currency_code' => 'USD',
            'payment_provider' => 'paypal',
            'shipping_method' => 'method-0001',
            'is_manual' => true,
            'customer_first_name' => 'John',
            'customer_last_name' => 'Doe',
            'customer_email' => 'buyer@example.com',
            'shipping_first_name' => 'John',
            'shipping_last_name' => 'Doe',
            'shipping_address_line1' => '123 Main St',
            'shipping_city' => 'New York',
            'shipping_state' => 'NY',
            'shipping_postal_code' => '10001',
            'shipping_country' => 'US',
            'billing_first_name' => 'John',
            'billing_last_name' => 'Doe',
            'billing_address_line1' => '123 Main St',
            'billing_city' => 'New York',
            'billing_state' => 'NY',
            'billing_postal_code' => '10001',
            'billing_country' => 'US',
        ], $overrides);
    }
}
