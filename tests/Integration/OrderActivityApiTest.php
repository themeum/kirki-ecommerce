<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Order\OrderActivityType;
use Kirki\Ecommerce\App\Services\OrderActivityService;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\EnablesPaymentProviders;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

class OrderActivityApiTest extends RestTestCase
{
    use CreatesTestProducts;
    use EnablesPaymentProviders;
    use SeedsTestShipping;

    protected $variant_id;

    protected function setUp(): void
    {
        parent::setUp();
        $this->enable_payment_provider();
        $this->seed_base_currency();
        $this->seed_shipping_settings();

        $product = $this->create_product();
        $this->variant_id = $this->default_variant_id($product);
    }

    /**
     * Placing an order records an order-placed activity with a generated
     * description referencing the order number.
     *
     * @return void
     */
    public function test_order_placed_activity_is_recorded_on_checkout(): void
    {
        $order = $this->create_order();

        $response = $this->request('GET', 'orders/' . $order['id'] . '/activities');
        $payload = $this->assert_api_success($response);

        $placed = $this->find_activity($payload['data']['results'], 'order-placed');

        $this->assertNotNull($placed);
        $this->assertStringContainsString($order['order_number'], $placed['description']);
    }

    /**
     * An admin can add a comment activity to an order.
     *
     * @return void
     */
    public function test_admin_can_add_comment(): void
    {
        $order = $this->create_order();

        $response = $this->request('POST', 'orders/' . $order['id'] . '/activities', [
            'order_id' => $order['id'],
            'message' => 'Customer called about delivery window.',
        ]);
        $payload = $this->assert_api_success($response, 201);

        $this->assertEquals('comment-added', $payload['data']['activity_type']);
        $this->assertEquals('Customer called about delivery window.', $payload['data']['description']);
        $this->assertNotEmpty($payload['data']['created_by']);
    }

    /**
     * An empty comment message is rejected.
     *
     * @return void
     */
    public function test_empty_comment_is_rejected(): void
    {
        $order = $this->create_order();

        $response = $this->request('POST', 'orders/' . $order['id'] . '/activities', [
            'order_id' => $order['id'],
            'message' => '',
        ]);

        $this->assert_validation_error($response);
    }

    /**
     * An admin can delete a comment activity.
     *
     * @return void
     */
    public function test_admin_can_delete_comment(): void
    {
        $order = $this->create_order();

        $create_response = $this->request('POST', 'orders/' . $order['id'] . '/activities', [
            'order_id' => $order['id'],
            'message' => 'Temporary note.',
        ]);
        $comment = $this->assert_api_success($create_response, 201)['data'];

        $delete_response = $this->request('DELETE', 'orders/' . $order['id'] . '/activities/' . $comment['id']);
        $this->assert_api_success($delete_response);

        $list_response = $this->request('GET', 'orders/' . $order['id'] . '/activities');
        $list_payload = $this->assert_api_success($list_response);

        $this->assertNull($this->find_activity($list_payload['data']['results'], 'comment-added'));
    }

    /**
     * Deleting a non-comment activity is rejected.
     *
     * @return void
     */
    public function test_deleting_non_comment_activity_is_rejected(): void
    {
        $order = $this->create_order();

        $list_response = $this->request('GET', 'orders/' . $order['id'] . '/activities');
        $list_payload = $this->assert_api_success($list_response);
        $placed = $this->find_activity($list_payload['data']['results'], 'order-placed');

        $response = $this->request('DELETE', 'orders/' . $order['id'] . '/activities/' . $placed['id']);
        $this->assert_validation_error($response);
    }

    /**
     * Deleting a non-existent comment returns 404.
     *
     * @return void
     */
    public function test_deleting_nonexistent_comment_returns_404(): void
    {
        $order = $this->create_order();

        $response = $this->request('DELETE', 'orders/' . $order['id'] . '/activities/999999');
        $this->assert_api_error($response, 404);
    }

    /**
     * The activity list is paginated: limit controls page size, and total
     * reflects every activity on the order regardless of page size.
     *
     * @return void
     */
    public function test_list_activities_is_paginated(): void
    {
        $order = $this->create_order();

        foreach (['First note.', 'Second note.', 'Third note.'] as $message) {
            $this->request('POST', 'orders/' . $order['id'] . '/activities', [
                'order_id' => $order['id'],
                'message' => $message,
            ]);
        }

        // 1 order-placed + 3 comments = 4 activities total.
        $response = $this->request('GET', 'orders/' . $order['id'] . '/activities', [
            'limit' => 2,
            'page' => 1,
        ]);
        $payload = $this->assert_api_success($response);

        $this->assertCount(2, $payload['data']['results']);
        $this->assertEquals(4, $payload['data']['total']);
        $this->assertEquals(2, $payload['data']['per_page']);
        $this->assertEquals(1, $payload['data']['current_page']);
        $this->assertEquals(2, $payload['data']['last_page']);
        $this->assertTrue($payload['data']['has_more_pages']);

        $second_page = $this->request('GET', 'orders/' . $order['id'] . '/activities', [
            'limit' => 2,
            'page' => 2,
        ]);
        $second_payload = $this->assert_api_success($second_page);

        $this->assertCount(2, $second_payload['data']['results']);
        $this->assertFalse($second_payload['data']['has_more_pages']);

        $first_page_ids = array_column($payload['data']['results'], 'id');
        $second_page_ids = array_column($second_payload['data']['results'], 'id');
        $this->assertEmpty(array_intersect($first_page_ids, $second_page_ids));
    }

    /**
     * A customer can view the customer-visible activity timeline for their
     * own order; admin comments are not part of it.
     *
     * @return void
     */
    public function test_customer_can_view_own_order_activities(): void
    {
        $user_id = static::factory()->user->create(['role' => 'subscriber']);
        wp_set_current_user($user_id);
        $this->request('POST', 'cart/items', ['variant_id' => $this->variant_id, 'quantity' => 1]);

        $checkout_response = $this->request('POST', 'checkout', $this->order_payload(['is_manual' => false]));
        $order = $this->assert_api_success($checkout_response, 201)['data'];

        $this->login_as_admin();
        $this->request('POST', 'orders/' . $order['id'] . '/activities', [
            'order_id' => $order['id'],
            'message' => 'Packed and ready to ship.',
        ]);

        wp_set_current_user($user_id);

        $response = $this->request('GET', 'account/orders/' . $order['id'] . '/activities');
        $payload = $this->assert_api_success($response);

        $this->assertNotNull($this->find_activity($payload['data']['results'], 'order-placed'));
        $this->assertNull($this->find_activity($payload['data']['results'], 'comment-added'));
    }

    /**
     * Payment and refund activities are hidden from the customer timeline.
     *
     * @return void
     */
    public function test_customer_timeline_hides_non_allow_listed_activities(): void
    {
        [$user_id, $order] = $this->place_customer_order();
        $this->record_activities($order['id'], [OrderActivityType::PAYMENT_COMPLETED, OrderActivityType::REFUNDED, OrderActivityType::SHIPPED]);

        wp_set_current_user($user_id);

        $payload = $this->assert_api_success($this->request('GET', 'account/orders/' . $order['id'] . '/activities'));

        $this->assertNotNull($this->find_activity($payload['data']['results'], 'shipped'));
        $this->assertNull($this->find_activity($payload['data']['results'], 'payment-completed'));
        $this->assertNull($this->find_activity($payload['data']['results'], 'refunded'));
    }

    /**
     * Customer entries keep the admin shape but carry no notify_customer key.
     *
     * @return void
     */
    public function test_customer_timeline_entries_omit_notify_customer(): void
    {
        [$user_id, $order] = $this->place_customer_order();

        wp_set_current_user($user_id);

        $payload = $this->assert_api_success($this->request('GET', 'account/orders/' . $order['id'] . '/activities'));
        $entry = $this->find_activity($payload['data']['results'], 'order-placed');

        $this->assertArrayNotHasKey('notify_customer', $entry);
        $this->assertArrayHasKey('description', $entry);
        $this->assertArrayHasKey('created_at', $entry);
    }

    /**
     * The customer pagination total and the "all" option count only visible activities.
     *
     * @return void
     */
    public function test_customer_timeline_total_counts_only_visible_activities(): void
    {
        [$user_id, $order] = $this->place_customer_order();
        $this->record_activities($order['id'], [OrderActivityType::PAYMENT_FAILED, OrderActivityType::REFUND_REQUESTED, OrderActivityType::DELIVERED]);

        wp_set_current_user($user_id);

        $paged = $this->assert_api_success($this->request('GET', 'account/orders/' . $order['id'] . '/activities', ['limit' => 1, 'page' => 1]));
        $all = $this->assert_api_success($this->request('GET', 'account/orders/' . $order['id'] . '/activities', ['limit' => -1]));

        $visible_types = array_column($all['data']['results'], 'activity_type');

        $this->assertSame([], array_diff($visible_types, OrderActivityType::customer_visible()));
        $this->assertContains('delivered', $visible_types);
        $this->assertSame(count($all['data']['results']), $paged['data']['total']);
        $this->assertCount(1, $paged['data']['results']);
    }

    /**
     * The admin timeline still returns activities that are hidden from customers.
     *
     * @return void
     */
    public function test_admin_timeline_still_returns_hidden_activities(): void
    {
        [, $order] = $this->place_customer_order();
        $this->record_activities($order['id'], [OrderActivityType::PAYMENT_COMPLETED]);

        $this->login_as_admin();
        $this->request('POST', 'orders/' . $order['id'] . '/activities', ['order_id' => $order['id'], 'message' => 'Internal note.']);

        $payload = $this->assert_api_success($this->request('GET', 'orders/' . $order['id'] . '/activities'));

        $this->assertNotNull($this->find_activity($payload['data']['results'], 'payment-completed'));
        $this->assertNotNull($this->find_activity($payload['data']['results'], 'comment-added'));
    }

    /**
     * The service keeps only allow-listed types for the customer pages.
     *
     * @return void
     */
    public function test_get_order_activity_keeps_only_allow_listed_types(): void
    {
        [, $order] = $this->place_customer_order();
        $this->record_activities($order['id'], array_keys(OrderActivityType::get_list()));

        $types = (new OrderActivityService())->get_order_activity($order['id'])->pluck('activity_type')->all();

        $this->assertEqualsCanonicalizing(OrderActivityType::customer_visible(), array_values(array_unique($types)));
    }

    /**
     * A customer cannot view another customer's order activity timeline.
     *
     * @return void
     */
    public function test_customer_cannot_view_other_customers_order_activities(): void
    {
        $owner_id = static::factory()->user->create(['role' => 'subscriber']);
        wp_set_current_user($owner_id);
        $this->request('POST', 'cart/items', ['variant_id' => $this->variant_id, 'quantity' => 1]);

        $checkout_response = $this->request('POST', 'checkout', $this->order_payload(['is_manual' => false]));
        $order = $this->assert_api_success($checkout_response, 201)['data'];

        $other_user_id = static::factory()->user->create(['role' => 'subscriber']);
        wp_set_current_user($other_user_id);

        $response = $this->request('GET', 'account/orders/' . $order['id'] . '/activities');
        $this->assert_api_error($response, 404);
    }

    /**
     * Place an order as a new subscriber customer, leaving that customer as the current user.
     *
     * @return array{0: int, 1: array<string, mixed>} The customer's user ID and the created order.
     */
    protected function place_customer_order(): array
    {
        $user_id = static::factory()->user->create(['role' => 'subscriber']);
        wp_set_current_user($user_id);
        $this->request('POST', 'cart/items', ['variant_id' => $this->variant_id, 'quantity' => 1]);

        $checkout_response = $this->request('POST', 'checkout', $this->order_payload(['is_manual' => false]));

        return [$user_id, $this->assert_api_success($checkout_response, 201)['data']];
    }

    /**
     * Record one activity of each given type on an order.
     *
     * @param int      $order_id Order ID.
     * @param string[] $types    Activity types to record.
     * @return void
     */
    protected function record_activities(int $order_id, array $types): void
    {
        $service = new OrderActivityService();

        foreach ($types as $type) {
            $service->create($order_id, $type, null, null, null);
        }
    }

    protected function find_activity(array $activities, string $activity_type): ?array
    {
        foreach ($activities as $activity) {
            if ($activity['activity_type'] === $activity_type) {
                return $activity;
            }
        }

        return null;
    }

    protected function create_order(array $overrides = []): array
    {
        $response = $this->request('POST', 'orders', $this->order_payload($overrides));
        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }

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
            'customer_notes' => 'Test order',
            'admin_notes' => 'Test order',
        ];

        return array_merge($payload, $overrides);
    }
}
