<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Actions\Cart\AddToCartAction;
use Kirki\Ecommerce\App\Actions\Cart\RecalculateCartAction;
use Kirki\Ecommerce\App\Actions\Order\CreateOrderAction;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderChangeState;
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
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\EnablesPaymentProviders;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

use function Kirki\Ecommerce\Framework\app;

/**
 * Order calculation previews, order creation inputs, and edits and cancels of
 * orders whose catalog records changed or were deleted.
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

    public function test_editing_an_order_whose_coupon_was_deleted_removes_the_coupon(): void
    {
        $coupon = $this->create_percentage_coupon(10);
        $order = $this->create_order(['coupon_codes' => [$coupon->code]]);

        Coupon::query()->where('id', $coupon->id)->delete();

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'coupon_codes' => [$coupon->code],
        ])));

        $this->assertEquals(0, OrderCoupon::where('order_id', $order['id'])->count());
        $this->assertEquals(0, Order::find($order['id'])->base_discount_total);
    }

    public function test_editing_the_order_that_took_a_coupons_last_use_keeps_the_coupon(): void
    {
        $coupon = $this->create_percentage_coupon(10);
        $coupon->update(['has_usage_limit' => true, 'usage_limit' => 1]);

        $order = $this->create_order(['coupon_codes' => [$coupon->code]]);
        $this->assertEquals(1, Coupon::find($coupon->id)->current_usage_count);

        $preview = $this->preview(['order_id' => $order['id'], 'coupon_codes' => [$coupon->code]]);
        $this->assertSame([[]], array_column($preview['coupons'], 'current_state'));

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
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
            'coupon_codes' => [$coupon->code],
        ])));

        $this->assertEquals(0, OrderCoupon::where('order_id', $other_order['id'])->count());
        $this->assertEquals(1, Coupon::find($coupon->id)->current_usage_count);
    }

    public function test_a_reversed_coupon_use_is_not_held_by_the_order(): void
    {
        $coupon = $this->create_percentage_coupon(10);
        $order = $this->create_order(['coupon_codes' => [$coupon->code]]);
        $order_service = app()->make(OrderService::class);

        $this->assertTrue($order_service->holds_coupon_usage($order['id'], $coupon->id));

        OrderManager::mark_as_cancel($order['id']);

        $this->assertFalse($order_service->holds_coupon_usage($order['id'], $coupon->id));
    }

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
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 3]],
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

        $this->preview(['items' => [['variant_id' => $this->variant_id, 'quantity' => 2]]]);
        OrderManager::mark_payment_as_paid($order['id']);

        $this->assert_api_error($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 2]],
        ])), 422);

        $this->assertEquals(1, OrderItem::where('order_id', $order['id'])->first()->quantity);
    }

    public function test_an_edit_without_a_currency_keeps_the_order_currency(): void
    {
        $code = $this->create_test_currency(1.3);
        $order = $this->create_order(['currency_code' => $code]);

        $payload = $this->order_payload();
        unset($payload['currency_code']);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $payload));

        $this->assertEquals($code, Order::find($order['id'])->currency_code);
    }

    public function test_an_edit_cannot_change_the_order_currency(): void
    {
        $code = $this->create_test_currency(1.3);
        $order = $this->create_order(['currency_code' => $code]);

        $this->assert_api_error($this->request('PUT', 'orders/' . $order['id'], $this->order_payload(['currency_code' => 'USD'])), 422);

        $this->assertEquals($code, Order::find($order['id'])->currency_code);
    }

    public function test_an_edit_converts_amounts_with_the_current_exchange_rate(): void
    {
        $code = $this->create_test_currency(1.3);
        $order = $this->create_order(['currency_code' => $code]);

        Currency::query()->where('code', $code)->update(['exchange_rate' => 1.5]);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload(['currency_code' => $code])));

        $stored = Order::find($order['id']);
        $this->assertEquals(1.5, $stored->exchange_rate);
        $this->assertEquals((int) round($stored->base_total * 1.5), $stored->invoiced_total);
    }

    public function test_an_edit_refreshes_every_line_from_the_current_variant(): void
    {
        $order = $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => 2]]]);
        $old_price = Variant::find($this->variant_id)->base_price;

        Variant::query()->where('id', $this->variant_id)->update(['base_price' => $old_price + 500]);
        Product::query()->where('id', Variant::find($this->variant_id)->product_id)->update(['title' => 'Renamed Product']);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 2]],
            'shipping_city' => 'Albany',
        ])));

        $item = OrderItem::where('order_id', $order['id'])->first();
        $this->assertEquals('Renamed Product', $item->product_name);
        $this->assertEquals($old_price + 500, $item->base_price);
        $this->assertEquals($old_price + 500, $item->base_catalog_sale_price);
        $this->assertEquals($old_price + 500, $item->base_catalog_regular_price);
        $this->assertEquals(($old_price + 500) * 2, $item->base_subtotal);
    }

    public function test_an_edit_removes_a_line_whose_product_was_deleted(): void
    {
        $deleted_product = $this->create_product();
        $deleted_variant_id = $this->default_variant_id($deleted_product);
        $order = $this->create_order(['items' => [
            ['variant_id' => $this->variant_id, 'quantity' => 1],
            ['variant_id' => $deleted_variant_id, 'quantity' => 1],
        ]]);

        $this->delete_product($deleted_product['id']);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload()));

        $items = OrderItem::where('order_id', $order['id'])->get();
        $stored = Order::find($order['id']);
        $this->assertCount(1, $items);
        $this->assertEquals($this->variant_id, $items->first()->variant_id);
        $this->assertEquals(1, $stored->items_count);
        $this->assertEquals($items->first()->base_subtotal, $stored->base_subtotal);
    }

    public function test_a_line_whose_product_is_now_a_draft_can_change_its_quantity(): void
    {
        $order = $this->create_order();
        Product::query()->where('id', Variant::find($this->variant_id)->product_id)->update(['status' => ProductStatus::DRAFT]);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 3]],
        ])));

        $this->assertEquals(3, OrderItem::where('order_id', $order['id'])->first()->quantity);
    }

    public function test_a_new_line_for_a_draft_product_is_refused(): void
    {
        $order = $this->create_order();
        $draft_product = $this->create_product(['status' => ProductStatus::DRAFT]);

        $this->assert_api_error($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [
                ['variant_id' => $this->variant_id, 'quantity' => 1],
                ['variant_id' => $this->default_variant_id($draft_product), 'quantity' => 1],
            ],
        ])), 422);
    }

    public function test_an_unchanged_line_on_a_sold_out_variant_can_be_saved(): void
    {
        $this->track_stock($this->variant_id, 5);
        $order = $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => 5]]]);
        $this->assertEquals(0, Variant::find($this->variant_id)->available_quantity);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 5]],
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
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 4]],
        ]));

        $this->assertGreaterThanOrEqual(400, $response->get_status());
        $this->assertEquals(2, OrderItem::where('order_id', $order['id'])->first()->quantity);
        $this->assertEquals(1, Variant::find($this->variant_id)->available_quantity);
    }

    public function test_lowering_a_quantity_releases_the_difference(): void
    {
        $this->track_stock($this->variant_id, 10);
        $order = $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => 5]]]);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 2]],
        ])));

        $this->assertEquals(8, Variant::find($this->variant_id)->available_quantity);
    }

    public function test_a_per_order_limit_lowered_below_the_stored_quantity_blocks_the_save(): void
    {
        $order = $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => 5]]]);
        Variant::query()->where('id', $this->variant_id)->update(['has_limit_per_order' => true, 'max_per_order' => 3]);

        $this->assert_api_error($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 5]],
        ])), 422);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 3]],
        ])));
    }

    public function test_an_edit_stores_the_shipping_methods_current_name(): void
    {
        $order = $this->create_order();
        $this->rename_shipping_method('Express Delivery');

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload()));

        $this->assertEquals('Express Delivery', Order::find($order['id'])->shipping_metadata['shipping_method']['name']);
    }

    public function test_previewing_an_edit_of_an_editable_order_succeeds(): void
    {
        $order = $this->create_order();

        $preview = $this->preview(['order_id' => $order['id']]);

        $this->assertSame([], $preview['current_state']);
        $this->assertSame((int) $order['items'][0]['id'], $preview['items'][0]['order_item_id']);
        $this->assertSame([], $preview['items'][0]['current_state']);
    }

    public function test_previewing_an_edit_of_a_paid_order_is_refused(): void
    {
        $order = $this->create_order();
        Order::find($order['id'])->update(['payment_status' => PaymentStatus::PAID]);

        $this->assert_api_error($this->request('POST', 'calculate/order', $this->order_payload(['order_id' => $order['id']])), 422);
    }

    public function test_previewing_an_edit_of_an_unknown_order_is_not_found(): void
    {
        $this->assert_api_error($this->request('POST', 'calculate/order', $this->order_payload(['order_id' => 999999])), 404);
    }

    public function test_saving_an_edit_of_an_unknown_order_is_not_found(): void
    {
        $this->assert_api_error($this->request('PUT', 'orders/999999', $this->order_payload()), 404);
    }

    public function test_a_create_preview_has_empty_states_and_live_stock_values(): void
    {
        $this->track_stock($this->variant_id, 7);
        Variant::query()->where('id', $this->variant_id)->update(['has_limit_per_order' => true, 'max_per_order' => 4]);
        $coupon = $this->create_percentage_coupon(10);

        $preview = $this->preview(['coupon_codes' => [$coupon->code, 'NOSUCHCODE']]);

        $this->assertSame([], $preview['current_state']);
        $this->assertCount(1, $preview['items']);
        $this->assertNull($preview['items'][0]['order_item_id']);
        $this->assertSame([], $preview['items'][0]['current_state']);
        $this->assertTrue($preview['items'][0]['track_inventory']);
        $this->assertFalse($preview['items'][0]['allow_back_order']);
        $this->assertSame(7, $preview['items'][0]['available_quantity']);
        $this->assertTrue($preview['items'][0]['in_stock']);
        $this->assertTrue($preview['items'][0]['has_limit_per_order']);
        $this->assertSame(4, $preview['items'][0]['max_per_order']);
        $this->assertSame([$coupon->code], array_column($preview['coupons'], 'code'));
        $this->assertSame([[]], array_column($preview['coupons'], 'current_state'));
    }

    public function test_an_edit_preview_reports_each_change_in_its_place(): void
    {
        $this->enable_tax(false);

        $deleted_product = $this->create_product();
        $deleted_variant_id = $this->default_variant_id($deleted_product);
        $coupon = $this->create_percentage_coupon(10);
        $order = $this->create_order([
            'items' => [
                ['variant_id' => $this->variant_id, 'quantity' => 1],
                ['variant_id' => $deleted_variant_id, 'quantity' => 1],
            ],
            'coupon_codes' => [$coupon->code],
        ]);
        $deleted_line_id = (int) OrderItem::where('order_id', $order['id'])->where('variant_id', $deleted_variant_id)->first()->id;

        $this->delete_product($deleted_product['id']);
        Variant::query()->where('id', $this->variant_id)->update(['base_price' => Variant::find($this->variant_id)->base_price + 500]);
        $coupon->update(['is_active' => false]);
        $this->enable_tax(true);

        $preview = $this->preview(['order_id' => $order['id'], 'coupon_codes' => [$coupon->code]]);

        $states_by_line = array_column($preview['items'], 'current_state', 'order_item_id');
        $this->assertCount(2, $preview['items']);
        $this->assertSame([OrderChangeState::PRICE_CHANGED], $states_by_line[(int) $order['items'][0]['id'] === $deleted_line_id ? (int) $order['items'][1]['id'] : (int) $order['items'][0]['id']]);
        $this->assertSame([OrderChangeState::ITEM_DELETED], $states_by_line[$deleted_line_id]);

        $this->assertSame([$coupon->code], array_column($preview['coupons'], 'code'));
        $this->assertSame([OrderChangeState::COUPON_REMOVED], $preview['coupons'][0]['current_state']);
        $this->assertEquals(0, $preview['coupons'][0]['base_discount_amount_money_object']['raw']);

        $this->assertSame([OrderChangeState::TAX_MODE_CHANGED], $preview['current_state']);

        $live_row = $preview['items'][0]['order_item_id'] === $deleted_line_id ? $preview['items'][1] : $preview['items'][0];
        $this->assertEquals($live_row['base_subtotal_money_object']['raw'], $preview['totals']['base_items_subtotal_money_object']['raw']);
        $this->assertSame(1, $preview['items_count']);
    }

    public function test_an_edit_preview_reports_a_coupon_whose_rules_changed(): void
    {
        $coupon = $this->create_percentage_coupon(10);
        $order = $this->create_order(['coupon_codes' => [$coupon->code]]);

        $unchanged = $this->preview(['order_id' => $order['id'], 'coupon_codes' => [$coupon->code]]);
        $this->assertSame([], $unchanged['coupons'][0]['current_state']);

        $coupon->update(['discount_amount_percentage' => 15]);

        $changed = $this->preview(['order_id' => $order['id'], 'coupon_codes' => [$coupon->code]]);
        $this->assertSame([OrderChangeState::COUPON_CHANGED], $changed['coupons'][0]['current_state']);
    }

    public function test_an_edit_preview_reports_a_removed_shipping_method_and_a_changed_cost(): void
    {
        $order = $this->create_order();

        $this->rename_shipping_method('Standard Delivery', 15);
        $cost_changed = $this->preview(['order_id' => $order['id']]);
        $this->assertSame([OrderChangeState::SHIPPING_COST_CHANGED], $cost_changed['current_state']);

        $this->rename_shipping_method('Standard Delivery', 10, false);
        $removed = $this->preview(['order_id' => $order['id']]);
        $this->assertSame([OrderChangeState::SHIPPING_METHOD_REMOVED], $removed['current_state']);
    }

    public function test_a_preview_does_not_block_on_stock_or_the_per_order_limit_but_the_save_does(): void
    {
        $this->track_stock($this->variant_id, 2);
        Variant::query()->where('id', $this->variant_id)->update(['has_limit_per_order' => true, 'max_per_order' => 3]);
        $order = $this->create_order();

        $preview = $this->preview(['order_id' => $order['id'], 'items' => [['variant_id' => $this->variant_id, 'quantity' => 5]]]);

        $this->assertSame(5, $preview['items'][0]['quantity']);
        $this->assertSame(1, $preview['items'][0]['available_quantity']);
        $this->assertSame(3, $preview['items'][0]['max_per_order']);

        $this->assert_api_error($this->request('PUT', 'orders/' . $order['id'], $this->order_payload([
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 5]],
        ])), 422);
    }

    public function test_an_edit_previews_saves_and_then_reports_no_changes(): void
    {
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
        $live_line_id = (int) OrderItem::where('order_id', $order['id'])->where('variant_id', $this->variant_id)->first()->id;
        $other_line_id = (int) OrderItem::where('order_id', $order['id'])->where('variant_id', $other_variant_id)->first()->id;

        Variant::query()->where('id', $this->variant_id)->update(['base_price' => Variant::find($this->variant_id)->base_price + 500]);
        $this->delete_product($other_product['id']);
        $this->rename_shipping_method('Standard Delivery', 15);

        $payload = [
            'order_id' => $order['id'],
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 2]],
            'coupon_codes' => [$coupon->code],
        ];
        $preview = $this->preview($payload);

        $states_by_line = array_column($preview['items'], 'current_state', 'order_item_id');
        $this->assertSame([OrderChangeState::PRICE_CHANGED], $states_by_line[$live_line_id]);
        $this->assertSame([OrderChangeState::ITEM_DELETED], $states_by_line[$other_line_id]);
        $this->assertSame([OrderChangeState::SHIPPING_COST_CHANGED], $preview['current_state']);
        $this->assertSame([[]], array_column($preview['coupons'], 'current_state'));

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->order_payload($payload)));

        $saved = Order::find($order['id']);
        $this->assertEquals($preview['totals']['base_total_money_object']['raw'], $saved->base_total / 100);
        $this->assertEquals($preview['totals']['base_tax_total_money_object']['raw'], $saved->base_tax_total / 100);
        $this->assertNull(OrderItem::find($other_line_id));
        $this->assertCount(1, OrderItem::where('order_id', $order['id'])->get());
        $this->assertEquals(1, Coupon::find($coupon->id)->current_usage_count);

        $after_save = $this->preview($payload);

        $this->assertSame([], $after_save['current_state']);
        $this->assertSame([[]], array_column($after_save['items'], 'current_state'));
        $this->assertSame([[]], array_column($after_save['coupons'], 'current_state'));
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
     * Tax US orders at 10%, inclusive or exclusive of the price.
     *
     * @param bool $is_tax_inclusive Whether prices include tax.
     * @return void
     */
    protected function enable_tax(bool $is_tax_inclusive): void
    {
        $this->assert_api_success($this->request('PUT', 'settings', [
            'key' => OptionKeys::TAX_SETTINGS,
            'data' => [
                'is_tax_inclusive_price' => $is_tax_inclusive,
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
     * @return void
     */
    protected function rename_shipping_method(string $name, int $base_amount = 10, bool $is_enabled = true): void
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
                                'is_taxable' => false,
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
        return Coupon::create([
            'title' => 'Edit Coupon',
            'code' => 'EDIT' . strtoupper(wp_generate_password(6, false)),
            'discount_type' => DiscountType::AMOUNT_OFF,
            'discount_target' => DiscountTarget::ORDER,
            'discount_value_type' => DiscountValueType::PERCENTAGE,
            'discount_amount_percentage' => $percentage,
            'is_active' => true,
        ]);
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
