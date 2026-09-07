<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Actions\Cart\AddToCartAction;
use Kirki\Ecommerce\App\Actions\Customer\CreateCustomerAction;
use Kirki\Ecommerce\App\Actions\Order\CreateOrderAction;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\EligibleItemType;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\DTO\Address\CreateAddressDTO;
use Kirki\Ecommerce\App\DTO\Cart\AddToCartDTO;
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderPayloadDTO;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\App\Models\Cart;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Payment\PaymentManager;
use Kirki\Ecommerce\App\Payment\Providers\PayPal;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;
use Exception;
use ReflectionMethod;

use function Kirki\Ecommerce\Framework\app;

class OrderApiTest extends RestTestCase
{
    use CreatesTestProducts;
    use SeedsTestShipping;

    /**
     * Order id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $order_id;
    /**
     * Variant id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $variant_id;
    /**
     * Refund id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $refund_id;

    /**
     * Prepare state before each test.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed_base_currency();
        $this->seed_shipping_settings();

        $product = $this->create_product();
        $this->variant_id = $this->default_variant_id($product);
    }

    /**
     * Store order returns 201.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_store_order_returns_201(): void
    {
        $response = $this->request('POST', 'orders', $this->order_payload());
        $payload = $this->assert_api_success($response, 201);

        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertNotEmpty($payload['data']['order_number']);
        $this->assertEquals('PayPal', $payload['data']['payment_provider_name']);
        $this->assertNotEmpty($payload['data']['payment_provider_icon']);
        $this->assertFalse($payload['data']['payment_provider_is_offline']);
        $this->assertEquals('Standard Delivery', $payload['data']['shipping_method_name']);
        $this->assertEquals('flat_rate', $payload['data']['shipping_method_type']);

        $this->order_id = $payload['data']['id'];
    }

    /**
     * Show order returns resource.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_order_returns_resource(): void
    {
        $order = $this->create_order();
        $this->order_id = $order['id'];

        $response = $this->request('GET', 'orders/' . $this->order_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->order_id, $payload['data']['id']);
        $this->assertEquals('PayPal', $payload['data']['payment_provider_name']);
        $this->assertNotEmpty($payload['data']['payment_provider_icon']);
        $this->assertFalse($payload['data']['payment_provider_is_offline']);
        $this->assertEquals('Standard Delivery', $payload['data']['shipping_method_name']);
        $this->assertEquals('flat_rate', $payload['data']['shipping_method_type']);
    }

    /**
     * List orders returns paginated results.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_orders_returns_paginated_results(): void
    {
        $order = $this->create_order();

        $response = $this->request('GET', 'orders', [
            'page' => 1,
            'limit' => 10,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertArrayHasKey('results', $payload['data']);
        $this->assertGreaterThanOrEqual(1, $payload['data']['total']);

        $listed_order = null;

        foreach ($payload['data']['results'] as $result) {
            if ($result['id'] == $order['id']) {
                $listed_order = $result;
                break;
            }
        }

        $this->assertNotNull($listed_order);
        $this->assertEquals('John Doe', $listed_order['customer_name']);
        $this->assertEquals('PayPal', $listed_order['payment_provider_name']);
        $this->assertNotEmpty($listed_order['payment_provider_icon']);
        $this->assertFalse($listed_order['payment_provider_is_offline']);
        $this->assertEquals('method-0001', $listed_order['shipping_method']);
        $this->assertEquals('Standard Delivery', $listed_order['shipping_method_name']);
    }

    /**
     * Update order changes notes.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_order_changes_notes(): void
    {
        $order = $this->create_order();
        $this->order_id = $order['id'];
        $customer_id = $this->create_customer()['id'];

        $response = $this->request('PUT', 'orders/' . $this->order_id, $this->order_payload([
            'id' => $this->order_id,
            'customer_id' => $customer_id,
            'admin_notes' => 'Updated notes',
            'items' => [
                [
                    'id' => $order['items'][0]['id'] ?? null,
                    'variant_id' => $this->variant_id,
                    'quantity' => 1,
                ],
            ],
        ]));

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated notes', $payload['data']['admin_notes']);
    }

    /**
     * Create order persists order item product data and tax breakdown.
     *
     * `product_data` is not exposed through the order resource, so this
     * asserts persistence at the model layer directly.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_order_persists_item_product_data_and_tax_breakdown(): void
    {
        $order = $this->create_order();
        $this->order_id = $order['id'];

        $this->assertIsArray($order['items'][0]['tax_breakdown']);

        $item = OrderItem::find($order['items'][0]['id']);
        $this->assertIsArray($item->product_data);
        $this->assertArrayHasKey('product', $item->product_data);
        $this->assertArrayHasKey('variant', $item->product_data);
    }

    /**
     * Update order persists flags.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_order_persists_flags(): void
    {
        $order = $this->create_order();
        $this->order_id = $order['id'];
        $customer_id = $this->create_customer()['id'];

        $response = $this->request('PUT', 'orders/' . $this->order_id, $this->order_payload([
            'id' => $this->order_id,
            'customer_id' => $customer_id,
            'flags' => ['gift', 'priority'],
            'items' => [
                [
                    'id' => $order['items'][0]['id'] ?? null,
                    'variant_id' => $this->variant_id,
                    'quantity' => 1,
                ],
            ],
        ]));

        $payload = $this->assert_api_success($response);
        $this->assertEquals(['gift', 'priority'], $payload['data']['flags']);

        $fetched = $this->request('GET', 'orders/' . $this->order_id);
        $fetched_payload = $this->assert_api_success($fetched);
        $this->assertEquals(['gift', 'priority'], $fetched_payload['data']['flags']);
    }

    /**
     * Update order clears flags.
     *
     * Asserts persistence at the model layer rather than the API response's
     * `flags` value: `Model::offsetExists()` (`isset($this->attributes[$key])`)
     * treats a present-but-null attribute as "not set", so `Resource::__get`'s
     * `?? null` short-circuits before calling `Order::get_flags_attribute()`
     * and the response value for a cleared order is `null` instead of the
     * mutator's `[]`. Pre-existing bug in the base Model class, unrelated to
     * this fix and orthogonal to any `set_*_attribute` mutator - out of scope
     * here.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_order_clears_flags(): void
    {
        $order = $this->create_order();
        $this->order_id = $order['id'];
        $customer_id = $this->create_customer()['id'];

        $this->assert_api_success($this->request('PUT', 'orders/' . $this->order_id, $this->order_payload([
            'id' => $this->order_id,
            'customer_id' => $customer_id,
            'flags' => ['gift'],
            'items' => [
                [
                    'id' => $order['items'][0]['id'] ?? null,
                    'variant_id' => $this->variant_id,
                    'quantity' => 1,
                ],
            ],
        ])));

        $response = $this->request('PUT', 'orders/' . $this->order_id, $this->order_payload([
            'id' => $this->order_id,
            'customer_id' => $customer_id,
            'flags' => [],
            'items' => [
                [
                    'id' => $order['items'][0]['id'] ?? null,
                    'variant_id' => $this->variant_id,
                    'quantity' => 1,
                ],
            ],
        ]));

        $this->assert_api_success($response);

        $item = Order::find($this->order_id);
        $this->assertNull($item->get_attributes()['flags']);
    }

    /**
     * Delete order removes record.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_order_removes_record(): void
    {
        $this->order_id = $this->create_order()['id'];

        $response = $this->request('DELETE', 'orders/' . $this->order_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    /**
     * Create refund on order.
     *
     * A refund is only accepted once the order has been paid for and either
     * delivered or cancelled, so the order is moved into that state first.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_refund_on_order(): void
    {
        $order = $this->create_order();
        $this->order_id = $order['id'];

        Order::where('id', $this->order_id)->update([
            'payment_status' => PaymentStatus::PAID,
            'fulfillment_status' => FulfillmentStatus::DELIVERED,
        ]);

        $response = $this->request('POST', 'orders/' . $this->order_id . '/refunds', [
            'order_id' => $this->order_id,
            'invoiced_amount' => 10,
            'reason' => 'Customer request',
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertNotEmpty($payload['data']['refunds']);
    }

    /**
     * Store order validation fails without items.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_store_order_validation_fails_without_items(): void
    {
        $response = $this->request('POST', 'orders', $this->order_payload([
            'items' => [],
        ]));

        $this->assert_validation_error($response);
    }

    /**
     * Unauthenticated request returns 401.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unauthenticated_request_returns_401(): void
    {
        $this->logout();

        $response = $this->request('GET', 'orders');
        $this->assert_api_error($response, 401);
    }

    /**
     * Setting a payment provider fee also derives the base-currency fee
     * using the order's own frozen exchange rate.
     *
     * @return void
     */
    public function test_set_payment_provider_fee_derives_base_currency_fee(): void
    {
        $currency_code = $this->create_test_currency(['code' => 'EUR', 'exchange_rate' => 2.0]);

        $order = $this->create_order(['currency_code' => $currency_code]);
        $this->order_id = $order['id'];

        OrderManager::set_payment_provider_fee($this->order_id, 200);

        $stored = OrderManager::find($this->order_id);

        $this->assertSame(200, $stored->invoiced_payment_provider_fee);
        $this->assertSame(100, $stored->base_payment_provider_fee);
    }

    /**
     * Setting a payment provider fee for an order already in the base
     * currency skips conversion entirely.
     *
     * @return void
     */
    public function test_set_payment_provider_fee_same_currency_skips_conversion(): void
    {
        $order = $this->create_order();
        $this->order_id = $order['id'];

        OrderManager::set_payment_provider_fee($this->order_id, 150);

        $stored = OrderManager::find($this->order_id);

        $this->assertSame(150, $stored->invoiced_payment_provider_fee);
        $this->assertSame(150, $stored->base_payment_provider_fee);
    }

    /**
     * PayPal only records its reported fee when the fee's currency matches
     * the order's invoiced currency.
     *
     * @return void
     */
    public function test_paypal_captures_fee_only_when_currency_matches_order(): void
    {
        $order = $this->create_order();
        $this->order_id = $order['id'];

        $order_model = OrderManager::find($this->order_id);
        $paypal = new PayPal();

        $capture_fee = new ReflectionMethod(PayPal::class, 'capture_payment_provider_fee');
        $capture_fee->setAccessible(true);

        $capture_fee->invoke($paypal, $order_model, [
            'seller_receivable_breakdown' => [
                'paypal_fee' => ['currency_code' => 'EUR', 'value' => '3.30'],
            ],
        ]);

        $this->assertSame(0, OrderManager::find($this->order_id)->invoiced_payment_provider_fee);

        $capture_fee->invoke($paypal, $order_model, [
            'seller_receivable_breakdown' => [
                'paypal_fee' => ['currency_code' => $order_model->currency_code, 'value' => '3.30'],
            ],
        ]);

        $this->assertSame(330, OrderManager::find($this->order_id)->invoiced_payment_provider_fee);
    }

    /**
     * PaymentManager::pay() resolves the gateway from the order's
     * payment_provider attribute (regression test for the stale
     * payment_provider lookup) instead of silently returning null.
     *
     * @return void
     */
    public function test_pay_resolves_provider_using_payment_provider_attribute(): void
    {
        $order = $this->create_order();
        $this->order_id = $order['id'];

        $order_model = OrderManager::find($this->order_id);

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('PayPal is not enabled.');

        app()->make(PaymentManager::class)->pay($order_model);
    }

    /**
     * An authenticated user with no customer record gets one provisioned
     * for them as part of placing their order.
     *
     * @return void
     */
    public function test_checkout_provisions_customer_for_authenticated_user_without_record(): void
    {
        $unique = wp_generate_password(8, false);
        $user_id = $this->create_shopper_user([
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'user_email' => 'ada-' . $unique . '@example.com',
        ]);

        wp_set_current_user($user_id);

        $response = $this->request('POST', 'orders', $this->order_payload(['is_manual' => false]));
        $payload = $this->assert_api_success($response, 201);
        $this->order_id = $payload['data']['id'];

        $customer = Customer::where('user_id', $user_id)->first();

        $this->assertNotNull($customer);
        $this->assertEquals($customer->id, $payload['data']['customer_id']);
        $this->assertTrue(Address::where('customer_id', $customer->id)->where('is_default_shipping', true)->exists());
    }

    /**
     * An authenticated user who already has a customer record reuses it
     * instead of getting a duplicate one provisioned.
     *
     * @return void
     */
    public function test_checkout_reuses_existing_customer_without_duplicating(): void
    {
        $user_id = $this->create_shopper_user();
        $existing_customer = $this->provision_customer_for_user($user_id);

        wp_set_current_user($user_id);

        $response = $this->request('POST', 'orders', $this->order_payload(['is_manual' => false]));
        $payload = $this->assert_api_success($response, 201);
        $this->order_id = $payload['data']['id'];

        $this->assertEquals($existing_customer->id, $payload['data']['customer_id']);
        $this->assertEquals(1, Customer::where('user_id', $user_id)->count());
    }

    /**
     * A guest checkout does not provision a customer: CreateOrderAction only
     * test_checkout_guest_order_has_no_customer.
     *
     * Exercised directly through CreateOrderAction rather than the HTTP
     *
     * @return void
     */
    public function test_checkout_guest_order_has_no_customer(): void
    {
        $billing_email = 'guest@example.com';

        $dto = CreateOrderPayloadDTO::from_array($this->order_payload([
            'is_manual' => false,
            'billing_first_name' => 'Guest',
            'billing_last_name' => 'Buyer',
            'billing_email' => $billing_email,
        ]));
        $dto->created_by = null;
        $dto->currency_code = 'USD';

        $order = app()->make(CreateOrderAction::class)->execute($dto);
        $this->order_id = $order->id;

        $this->assertNull($order->customer_id);
    }

    /**
     * The provisioned customer's name is sourced from the WordPress user
     * profile, falling back to the checkout billing fields for anything
     * the profile doesn't have.
     *
     * @return void
     */
    public function test_checkout_customer_prefers_wp_profile_then_falls_back_to_billing(): void
    {
        $user_id = $this->create_shopper_user();
        $wp_user = get_userdata($user_id);

        wp_set_current_user($user_id);

        $response = $this->request('POST', 'orders', $this->order_payload([
            'is_manual' => false,
            'billing_first_name' => 'Fallback',
            'billing_last_name' => 'Billing',
        ]));
        $payload = $this->assert_api_success($response, 201);
        $this->order_id = $payload['data']['id'];

        $customer = Customer::where('user_id', $user_id)->first();

        $this->assertEquals('Fallback', $customer->first_name);
        $this->assertEquals('Billing', $customer->last_name);
        $this->assertEquals($wp_user->user_email, $customer->email);
    }

    /**
     * The order's own customer contact snapshot is sourced from the
     * WordPress user profile when it has all four fields, even when
     * billing carries different values.
     *
     * @return void
     */
    public function test_order_customer_contact_uses_wp_profile_when_complete(): void
    {
        $user_id = $this->create_shopper_user([
            'first_name' => 'Jordan',
            'last_name' => 'Rivers',
        ]);
        update_user_meta($user_id, 'phone', '555-0100');
        $wp_user = get_userdata($user_id);

        wp_set_current_user($user_id);

        $response = $this->request('POST', 'orders', $this->order_payload([
            'is_manual' => false,
            'billing_first_name' => 'Fallback',
            'billing_last_name' => 'Billing',
            'billing_phone' => '555-9999',
        ]));
        $payload = $this->assert_api_success($response, 201);
        $this->order_id = $payload['data']['id'];

        $order = Order::find($this->order_id);

        $this->assertEquals('Jordan', $order->customer_first_name);
        $this->assertEquals('Rivers', $order->customer_last_name);
        $this->assertEquals($wp_user->user_email, $order->customer_email);
        $this->assertEquals('555-0100', $order->customer_phone);
    }

    /**
     * When the WordPress profile is missing a contact field, the order's
     * snapshot falls back to the corresponding billing field for that
     * field only, leaving fields the profile does provide untouched.
     *
     * @return void
     */
    public function test_order_customer_contact_falls_back_to_billing_for_missing_wp_fields(): void
    {
        $user_id = $this->create_shopper_user();
        $wp_user = get_userdata($user_id);

        wp_set_current_user($user_id);

        $response = $this->request('POST', 'orders', $this->order_payload([
            'is_manual' => false,
            'billing_first_name' => 'Fallback',
            'billing_last_name' => 'Billing',
            'billing_phone' => '555-9999',
        ]));
        $payload = $this->assert_api_success($response, 201);
        $this->order_id = $payload['data']['id'];

        $order = Order::find($this->order_id);

        $this->assertEquals('Fallback', $order->customer_first_name);
        $this->assertEquals('Billing', $order->customer_last_name);
        $this->assertEquals($wp_user->user_email, $order->customer_email);
        $this->assertEquals('555-9999', $order->customer_phone);
    }

    /**
     * A guest checkout (no WordPress user behind the order) sources the
     * order's customer contact snapshot entirely from the billing fields.
     *
     * The session is left signed in so that customers.created_by stays a
     * valid foreign key while the order itself takes the guest path - see
     * test_checkout_guest_order_provisions_customer_from_billing.
     *
     * @return void
     */
    public function test_order_customer_contact_uses_billing_for_guest_checkout(): void
    {
        $billing_email = 'guest-shopper-' . wp_generate_password(8, false) . '@example.com';

        $dto = CreateOrderPayloadDTO::from_array($this->order_payload([
            'is_manual' => false,
            'billing_first_name' => 'Guest',
            'billing_last_name' => 'Shopper',
            'billing_email' => $billing_email,
            'billing_phone' => '555-1234',
        ]));
        $dto->created_by = null;
        $dto->currency_code = 'USD';

        $order = app()->make(CreateOrderAction::class)->execute($dto);
        $this->order_id = $order->id;

        $this->assertEquals('Guest', $order->customer_first_name);
        $this->assertEquals('Shopper', $order->customer_last_name);
        $this->assertEquals($billing_email, $order->customer_email);
        $this->assertEquals('555-1234', $order->customer_phone);
    }

    /**
     * A guest checkout that submits a distinct customer_email persists that
     * value on the order rather than falling back to billing_email, and
     * rejects the submission with a validation error when it's missing.
     *
     * @return void
     */
    public function test_checkout_guest_order_saves_submitted_customer_email(): void
    {
        $admin_id = get_current_user_id();
        $this->logout();

        $customer_email = 'shopper-' . wp_generate_password(8, false) . '@example.com';
        $billing_email = 'billing-' . wp_generate_password(8, false) . '@example.com';

        $response = $this->request('POST', 'checkout', $this->order_payload([
            'is_manual' => false,
            'payment_provider' => 'unregistered-test-provider',
            'customer_email' => $customer_email,
            'billing_email' => $billing_email,
        ]));
        $payload = $this->assert_api_success($response, 201);
        $this->order_id = $payload['data']['id'];

        wp_set_current_user($admin_id);

        $order = Order::find($this->order_id);
        $this->assertEquals($customer_email, $order->customer_email);
        $this->assertNotEquals($billing_email, $order->customer_email);
    }

    /**
     * A guest checkout without a customer_email fails validation, since
     * there's no WordPress account to source the order's contact email from.
     *
     * @return void
     */
    public function test_checkout_guest_order_requires_customer_email(): void
    {
        $this->logout();

        $response = $this->request('POST', 'checkout', $this->order_payload([
            'is_manual' => false,
            'payment_provider' => 'unregistered-test-provider',
            'billing_email' => 'billing-' . wp_generate_password(8, false) . '@example.com',
        ]));

        $data = $this->assert_validation_error($response);
        $this->assertArrayHasKey('customer_email', $data['errors']);
    }

    /**
     * When the checkout request's billing fields already match its shipping
     * fields (e.g. because the shopper checked "same as shipping" in the
     * UI), the provisioned customer's two default addresses end up with the
     * same field values - the backend does not do any copying itself, it
     * just persists whatever billing fields were submitted.
     *
     * @return void
     */
    public function test_checkout_duplicates_billing_address_from_shipping_when_same(): void
    {
        $user_id = $this->create_shopper_user();
        wp_set_current_user($user_id);

        $response = $this->request('POST', 'orders', $this->order_payload([
            'is_manual' => false,
        ]));
        $payload = $this->assert_api_success($response, 201);
        $this->order_id = $payload['data']['id'];

        $customer = Customer::where('user_id', $user_id)->first();

        $shipping_address = Address::where('customer_id', $customer->id)->where('is_default_shipping', true)->first();
        $billing_address = Address::where('customer_id', $customer->id)->where('is_default_billing', true)->first();

        $this->assertNotNull($shipping_address);
        $this->assertNotNull($billing_address);
        $this->assertEquals($shipping_address->address_line1, $billing_address->address_line1);
        $this->assertEquals('123 Main St', $shipping_address->address_line1);
    }

    /**
     * When order creation fails after customer provisioning already
     * succeeded, the provisioned customer, its WordPress user, and its
     * addresses remain persisted - provisioning is no longer rolled back
     * together with the order.
     *
     * @return void
     */
    public function test_checkout_failure_leaves_provisioned_customer_behind(): void
    {
        $limited_product = $this->create_product([
            'variants' => [
                [
                    'base_price' => 29.99,
                    'sku' => 'SKU-' . wp_generate_password(6, false),
                    'available_quantity' => 1,
                    'in_stock' => true,
                    'track_inventory' => true,
                    'is_default' => true,
                    'attribute_values' => [],
                ],
            ],
        ]);
        $limited_variant_id = $this->default_variant_id($limited_product);

        $user_id = $this->create_shopper_user();
        wp_set_current_user($user_id);

        $order_count_before = Order::count();

        $response = $this->request('POST', 'orders', $this->order_payload([
            'is_manual' => false,
            'items' => [
                ['variant_id' => $limited_variant_id, 'quantity' => 2],
            ],
        ]));

        $this->assert_api_error($response, 500);

        $customer = Customer::where('user_id', $user_id)->first();

        $this->assertNotNull($customer);
        $this->assertTrue(Address::where('customer_id', $customer->id)->where('is_default_shipping', true)->exists());
        $this->assertTrue(Address::where('customer_id', $customer->id)->where('is_default_billing', true)->exists());
        $this->assertEquals($order_count_before, Order::count());
    }

    /**
     * A first_time_buyer_only coupon is actually applied (free shipping
     * takes effect) for an authenticated user with no existing customer
     * record - the customer is now resolved before coupon validation
     * runs, so their customer_id is available at that point instead of
     * being unavailable (which, before this fix, made validate_coupon()
     * throw "please login"; that failure is swallowed by
     * RecalculateCartAction::get_discount_result(), so checkout would
     * still return 201 but silently without the discount - asserting
     * only the 201 status does not distinguish fixed from broken).
     *
     * Asserts on the shipping total rather than the order's
     * discount_details field: discount_details is a separate,
     * pre-existing bug (storing a raw Coupon model into a JSON column
     * loses it on persist) unrelated to this fix - discovered while
     * writing this test, out of scope here.
     *
     * @return void
     */
    public function test_checkout_accepts_first_time_buyer_coupon_for_new_customer(): void
    {
        $coupon = Coupon::create([
            'title' => 'First Time Buyer',
            'code' => 'FIRSTBUY' . wp_generate_password(6, false),
            'discount_type' => DiscountType::FREE_SHIPPING,
            'eligible_item_type' => EligibleItemType::ALL_PRODUCTS,
            'first_time_buyer_only' => true,
            'is_active' => true,
        ]);

        $user_id = $this->create_shopper_user();
        wp_set_current_user($user_id);

        $response = $this->request('POST', 'orders', $this->order_payload([
            'is_manual' => false,
            'coupon_code' => $coupon->code,
        ]));

        $payload = $this->assert_api_success($response, 201);
        $this->assertEquals(0.0, $payload['data']['totals']['base_shipping']);
    }

    /**
     * A first_time_buyer_only coupon is silently not applied (order still
     * succeeds without it, at full shipping cost - RecalculateCartAction
     * ::get_discount_result() swallows coupon validation failures rather
     * than failing checkout) for a customer who has already placed a
     * prior (non-cancelled/non-returned) order. The resolved customer's
     * order count is now available at coupon validation time, not just
     * their customer_id.
     *
     * @return void
     */
    public function test_checkout_ignores_first_time_buyer_coupon_for_repeat_customer(): void
    {
        $user_id = $this->create_shopper_user();
        wp_set_current_user($user_id);

        $this->provision_customer_for_user($user_id);

        $this->assert_api_success($this->request('POST', 'orders', $this->order_payload([
            'is_manual' => false,
        ])), 201);

        $coupon = Coupon::create([
            'title' => 'First Time Buyer',
            'code' => 'FIRSTBUY' . wp_generate_password(6, false),
            'discount_type' => DiscountType::FREE_SHIPPING,
            'eligible_item_type' => EligibleItemType::ALL_PRODUCTS,
            'first_time_buyer_only' => true,
            'is_active' => true,
        ]);

        $response = $this->request('POST', 'orders', $this->order_payload([
            'is_manual' => false,
            'coupon_code' => $coupon->code,
        ]));

        $payload = $this->assert_api_success($response, 201);
        $this->assertEquals(10.0, $payload['data']['totals']['base_shipping']);
    }

    /**
     * A has_customer_limit coupon is actually applied (free shipping
     * takes effect) for an authenticated user with no existing customer
     * record - their resolved customer_id (with zero prior usage) is
     * available at coupon validation time instead of being unavailable
     * (see the first_time_buyer test above for why asserting only the
     * 201 status would not distinguish fixed from broken here).
     *
     * @return void
     */
    public function test_checkout_accepts_customer_usage_limit_coupon_for_new_customer(): void
    {
        $coupon = Coupon::create([
            'title' => 'Limited Per Customer',
            'code' => 'LIMITED' . wp_generate_password(6, false),
            'discount_type' => DiscountType::FREE_SHIPPING,
            'eligible_item_type' => EligibleItemType::ALL_PRODUCTS,
            'has_customer_limit' => true,
            'customer_limit' => 1,
            'is_active' => true,
        ]);

        $user_id = $this->create_shopper_user();
        wp_set_current_user($user_id);

        $response = $this->request('POST', 'orders', $this->order_payload([
            'is_manual' => false,
            'coupon_code' => $coupon->code,
        ]));

        $payload = $this->assert_api_success($response, 201);
        $this->assertEquals(0.0, $payload['data']['totals']['base_shipping']);
    }

    /**
     * Placing a checkout order empties the authenticated shopper's owned
     * cart, resolved by their user id.
     *
     * @return void
     */
    public function test_checkout_empties_cart_for_authenticated_user(): void
    {
        $user_id = $this->create_shopper_user();
        wp_set_current_user($user_id);

        $add_response = $this->request('POST', 'cart/items', [
            'variant_id' => $this->variant_id,
            'quantity' => 1,
        ]);
        $cart_payload = $this->assert_api_success($add_response)['data'];

        $this->assertNotEmpty($cart_payload['items']);

        $response = $this->request('POST', 'checkout', $this->order_payload([
            'is_manual' => false,
            'payment_provider' => 'unregistered-test-provider',
        ]));
        $payload = $this->assert_api_success($response, 201);
        $this->order_id = $payload['data']['id'];

        $cart_response = $this->request('GET', 'cart');
        $cart_after = $this->assert_api_success($cart_response);

        $this->assertEmpty($cart_after['data']);
    }

    /**
     * Checkout reuses an authenticated shopper's existing customer record
     * instead of creating a duplicate one.
     *
     * @return void
     */
    public function test_checkout_reuses_existing_customer(): void
    {
        $user_id = $this->create_shopper_user();
        $existing_customer = $this->provision_customer_for_user($user_id);

        wp_set_current_user($user_id);

        $this->request('POST', 'cart/items', [
            'variant_id' => $this->variant_id,
            'quantity' => 1,
        ]);

        $response = $this->request('POST', 'checkout', $this->order_payload([
            'is_manual' => false,
            'payment_provider' => 'unregistered-test-provider',
        ]));
        $payload = $this->assert_api_success($response, 201);
        $this->order_id = $payload['data']['id'];

        $this->assertEquals($existing_customer->id, $payload['data']['customer_id']);
        $this->assertEquals(1, Customer::where('user_id', $user_id)->count());
    }

    /**
     * Placing a guest order empties the cart matched by its token - the only
     * identifier available for a guest, since there's no customer_id.
     *
     * Exercised directly through CreateOrderAction rather than the HTTP
     * `/checkout` endpoint, for the same reason as
     * test_checkout_guest_order_provisions_customer_from_billing above. The
     * cart is built signed out so it is a genuine token-owned guest cart,
     * then the admin session is restored for the checkout itself to keep
     * customers.created_by a valid foreign key - cart resolution reads the
     * token off the DTO, not the session, so the guest path is unaffected.
     *
     * @return void
     */
    public function test_checkout_empties_guest_cart_by_token(): void
    {
        $product = $this->create_product();
        $variant_id = $this->default_variant_id($product);
        $admin_id = get_current_user_id();

        $this->logout();

        $add_to_cart_dto = new AddToCartDTO();
        $add_to_cart_dto->product_id = $product['id'];
        $add_to_cart_dto->variant_id = $variant_id;
        $add_to_cart_dto->quantity = 1;

        $cart = app()->make(AddToCartAction::class)->execute($add_to_cart_dto);
        $cart_token = $cart->cart_token;

        $this->assertNotNull(Cart::where('cart_token', $cart_token)->first());

        wp_set_current_user($admin_id);

        $dto = CreateOrderPayloadDTO::from_array($this->order_payload([
            'is_manual' => false,
            'billing_email' => 'guest-cart-' . wp_generate_password(8, false) . '@example.com',
            'items' => [
                ['variant_id' => $variant_id, 'quantity' => 1],
            ],
        ]));
        $dto->created_by = null;
        $dto->currency_code = 'USD';
        $dto->cart_token = $cart_token;

        $order = app()->make(CreateOrderAction::class)->execute($dto);
        $this->order_id = $order->id;

        $this->assertNull(Cart::where('cart_token', $cart_token)->first());
    }

    /**
     * A guest cart token that has already been adopted by an account no
     * longer resolves, so checking out with it is rejected.
     *
     * Session handling matches test_checkout_empties_guest_cart_by_token
     * above: signed out while the guest cart is built, signed back in for the
     * checkout so customer provisioning - which now runs before the cart is
     * resolved - gets far enough for the cart error to surface.
     *
     * @return void
     */
    public function test_checkout_rejects_consumed_guest_cart_token(): void
    {
        $admin_id = get_current_user_id();

        $this->logout();

        $add_to_cart_dto = new AddToCartDTO();
        $add_to_cart_dto->product_id = app()->make(VariantService::class)->find($this->variant_id)->product_id;
        $add_to_cart_dto->variant_id = $this->variant_id;
        $add_to_cart_dto->quantity = 1;

        $guest_cart = app()->make(AddToCartAction::class)->execute($add_to_cart_dto);
        $cart_token = $guest_cart->cart_token;
        $user_id = $this->create_shopper_user();

        app()->make(CartService::class)->get_cart($user_id, $cart_token);

        wp_set_current_user($admin_id);

        $dto = CreateOrderPayloadDTO::from_array($this->order_payload([
            'is_manual' => false,
            'billing_email' => 'guest-consumed-' . wp_generate_password(8, false) . '@example.com',
        ]));
        $dto->created_by = null;
        $dto->currency_code = 'USD';
        $dto->cart_token = $cart_token;

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Cart not found.');

        app()->make(CreateOrderAction::class)->execute($dto);
    }

    /**
     * Create a non-admin WordPress user for checkout-provisioning tests.
     *
     * @param array $overrides Factory attribute overrides.
     *
     * @return int
     * @since 1.0.0
     */
    protected function create_shopper_user(array $overrides = []): int
    {
        return static::factory()->user->create(array_merge([
            'role' => 'subscriber',
        ], $overrides));
    }

    /**
     * Provision a customer record (with addresses) linked to an existing
     * WordPress user, simulating a shopper who already has one.
     *
     * @param int $user_id WordPress user id.
     *
     * @return Customer
     * @since 1.0.0
     */
    protected function provision_customer_for_user(int $user_id): Customer
    {
        $unique = wp_generate_password(8, false);

        $customer_payload = new CreateCustomerDTO();
        $customer_payload->user_id = $user_id;
        $customer_payload->first_name = 'Existing';
        $customer_payload->last_name = 'Customer';
        $customer_payload->email = 'existing-' . $unique . '@example.com';

        $address_payload = new CreateAddressDTO();
        $address_payload->first_name = 'Existing';
        $address_payload->last_name = 'Customer';
        $address_payload->address_line1 = '456 Existing Ave';
        $address_payload->city = 'New York';
        $address_payload->state = 'NY';
        $address_payload->country = 'US';
        $address_payload->postal_code = '10001';
        $address_payload->email = $customer_payload->email;

        return app()->make(CreateCustomerAction::class)->execute($customer_payload, $address_payload, $address_payload);
    }

    /**
     * Create order.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_order(array $overrides = []): array
    {
        $response = $this->request('POST', 'orders', $this->order_payload($overrides));
        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }

    /**
     * Create customer.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_customer(): array
    {
        $unique = wp_generate_password(8, false);
        $response = $this->request('POST', 'customers', [
            'first_name' => 'Order',
            'last_name' => 'Customer',
            'email' => 'order-customer-' . $unique . '@example.com',
            'phone' => '5550100',
            'shipping_address' => [
                'first_name' => 'Order',
                'last_name' => 'Customer',
                'email' => 'order-customer-' . $unique . '@example.com',
                'phone' => '5550100',
                'address_line1' => '123 Main St',
                'address_line2' => '',
                'city' => 'New York',
                'state' => 'NY',
                'postal_code' => '10001',
                'country' => 'US',
            ],
            'billing_address' => [
                'first_name' => 'Order',
                'last_name' => 'Customer',
                'email' => 'order-customer-' . $unique . '@example.com',
                'phone' => '5550100',
                'address_line1' => '123 Main St',
                'address_line2' => '',
                'city' => 'New York',
                'state' => 'NY',
                'postal_code' => '10001',
                'country' => 'US',
            ],
        ]);

        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }

    /**
     * Create a non-base currency for exchange-rate conversion tests.
     * @param array $overrides Overrides.
     *
     * @return string The created currency's code.
     */
    protected function create_test_currency(array $overrides = []): string
    {
        $code = $overrides['code'] ?? 'T' . strtoupper(substr(wp_generate_password(4, false), 0, 2));

        $response = $this->request('POST', 'currencies', [
            'items' => [
                array_merge([
                    'name' => 'Test Currency',
                    'symbol' => '$',
                    'exchange_rate' => 1.0,
                    'is_active' => true,
                    'is_base' => false,
                ], $overrides, ['code' => $code]),
            ],
        ]);

        $this->assert_api_success($response, 201);

        return $code;
    }

    /**
     * Order payload.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function order_payload(array $overrides = []): array
    {
        $payload = [
            'items' => [
                [
                    'variant_id' => $this->variant_id,
                    'quantity' => 1,
                ],
            ],
            'currency_code' => 'USD',
            'payment_provider' => 'paypal',
            'shipping_method' => 'method-0001',
            'is_manual' => true,
            'shipping_first_name' => 'John',
            'shipping_last_name' => 'Doe',
            'shipping_address_line1' => '123 Main St',
            'shipping_city' => 'New York',
            'shipping_state' => 'NY',
            'shipping_postcode' => '10001',
            'shipping_country' => 'US',
            'billing_first_name' => 'John',
            'billing_last_name' => 'Doe',
            'billing_address_line1' => '123 Main St',
            'billing_city' => 'New York',
            'billing_state' => 'NY',
            'billing_postcode' => '10001',
            'billing_country' => 'US',
            'customer_notes' => 'Test order',
            'admin_notes' => 'Test order',
        ];

        return array_merge($payload, $overrides);
    }
}
