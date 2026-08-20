<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

class AccountOrderApiTest extends RestTestCase
{
    use CreatesTestProducts;
    use SeedsTestShipping;

    /**
     * Variant id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $variant_id;

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
     * List orders returns only the requester's own orders.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_returns_only_own_orders(): void
    {
        $own = $this->place_order_as_new_shopper();
        $other = $this->place_order_as_new_shopper();

        wp_set_current_user($own['user_id']);

        $response = $this->request('GET', 'account/orders');
        $payload = $this->assert_api_success($response);

        $ids = array_column($payload['data']['results'], 'id');

        $this->assertContains($own['order']['id'], $ids);
        $this->assertNotContains($other['order']['id'], $ids);
    }

    /**
     * A customer_id supplied on the request is ignored in favor of the
     * requester's own customer id.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_ignores_customer_id_query_param(): void
    {
        $own = $this->place_order_as_new_shopper();
        $other = $this->place_order_as_new_shopper();

        wp_set_current_user($own['user_id']);

        $response = $this->request('GET', 'account/orders', [
            'customer_id' => $other['order']['customer_id'],
        ]);
        $payload = $this->assert_api_success($response);

        $ids = array_column($payload['data']['results'], 'id');

        $this->assertContains($own['order']['id'], $ids);
        $this->assertNotContains($other['order']['id'], $ids);
    }

    /**
     * Filters (e.g. search) still narrow the result set within the
     * requester's own orders.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_filters_apply_within_own_orders(): void
    {
        $own = $this->place_order_as_new_shopper();

        wp_set_current_user($own['user_id']);

        $matching = $this->assert_api_success($this->request('GET', 'account/orders', [
            'search' => $own['order']['order_number'],
        ]));

        $this->assertCount(1, $matching['data']['results']);
        $this->assertEquals($own['order']['id'], $matching['data']['results'][0]['id']);

        $non_matching = $this->assert_api_success($this->request('GET', 'account/orders', [
            'search' => 'no-such-order-' . wp_generate_password(8, false),
        ]));

        $this->assertCount(0, $non_matching['data']['results']);
    }

    /**
     * A logged-in user with no linked Customer record gets an empty,
     * successfully-paginated order list rather than an error.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_returns_empty_for_user_without_customer_record(): void
    {
        $user_id = $this->create_shopper_user();
        wp_set_current_user($user_id);

        $payload = $this->assert_api_success($this->request('GET', 'account/orders'));

        $this->assertEquals(0, $payload['data']['total']);
        $this->assertEmpty($payload['data']['results']);
    }

    /**
     * Order details are returned for an order the requester owns, and the
     * response omits internal-only fields while including the next
     * payment step.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_order_returns_own_order(): void
    {
        // An unregistered payment_provider makes PaymentManager::pay()
        // resolve to null instead of calling out to a real gateway (e.g.
        // PayPal, which isn't configured in this test environment) -
        // keeps this test focused on the account-scoped response shape.
        $own = $this->place_order_as_new_shopper(['payment_provider' => 'unregistered-test-provider']);
        wp_set_current_user($own['user_id']);

        $response = $this->request('GET', 'account/orders/' . $own['order']['id']);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($own['order']['id'], $payload['data']['id']);
        $this->assertArrayNotHasKey('admin_notes', $payload['data']);
        $this->assertArrayNotHasKey('flags', $payload['data']);
        $this->assertArrayHasKey('payment_next_step', $payload['data']);
    }

    /**
     * Requesting an order that exists but belongs to another customer
     * fails the same way as a nonexistent order id.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_order_for_other_customer_returns_not_found(): void
    {
        $own = $this->place_order_as_new_shopper();
        $other = $this->place_order_as_new_shopper();

        wp_set_current_user($own['user_id']);

        $response = $this->request('GET', 'account/orders/' . $other['order']['id']);
        $this->assert_api_error($response, 404);
    }

    /**
     * Requesting a nonexistent order id fails the same way as an order
     * belonging to another customer.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_order_nonexistent_id_returns_not_found(): void
    {
        $own = $this->place_order_as_new_shopper();
        wp_set_current_user($own['user_id']);

        $response = $this->request('GET', 'account/orders/999999999');
        $this->assert_api_error($response, 404);
    }

    /**
     * A logged-in user with no linked Customer record cannot view any
     * order, including one that does exist for another customer.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_order_returns_not_found_for_user_without_customer_record(): void
    {
        $other = $this->place_order_as_new_shopper();

        $user_id = $this->create_shopper_user();
        wp_set_current_user($user_id);

        $response = $this->request('GET', 'account/orders/' . $other['order']['id']);
        $this->assert_api_error($response, 404);
    }

    /**
     * Both account order endpoints require an authenticated session.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unauthenticated_requests_return_401(): void
    {
        $this->logout();

        $this->assert_api_error($this->request('GET', 'account/orders'), 401);
        $this->assert_api_error($this->request('GET', 'account/orders/1'), 401);
    }

    /**
     * Create a new shopper user and place an order as them, auto-provisioning
     * their Customer record the same way real checkout does.
     *
     * @param array $order_overrides Order payload overrides.
     *
     * @return array{user_id: int, order: array}
     * @since 1.0.0
     */
    protected function place_order_as_new_shopper(array $order_overrides = []): array
    {
        $user_id = $this->create_shopper_user();
        wp_set_current_user($user_id);

        $order = $this->create_order(array_merge(['is_manual' => false], $order_overrides));

        return ['user_id' => $user_id, 'order' => $order];
    }

    /**
     * Create a non-admin WordPress user.
     *
     * @param array $overrides Factory attribute overrides.
     *
     * @return int
     * @since 1.0.0
     */
    protected function create_shopper_user(array $overrides = []): int
    {
        $unique = wp_generate_password(8, false);

        return static::factory()->user->create(array_merge([
            'role' => 'subscriber',
            'user_email' => 'shopper-' . $unique . '@example.com',
        ], $overrides));
    }

    /**
     * Create an order through the order creation endpoint.
     *
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
     * Order payload.
     *
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
