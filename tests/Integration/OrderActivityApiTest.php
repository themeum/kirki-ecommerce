<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

class OrderActivityApiTest extends RestTestCase
{
    use CreatesTestProducts;
    use SeedsTestShipping;

    protected $variant_id;

    protected function setUp(): void
    {
        parent::setUp();
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
     * A customer can view the full activity timeline (including admin
     * comments) for their own order.
     *
     * @return void
     */
    public function test_customer_can_view_own_order_activities(): void
    {
        $user_id = static::factory()->user->create(['role' => 'subscriber']);
        wp_set_current_user($user_id);

        $checkout_response = $this->request('POST', 'orders', $this->order_payload(['is_manual' => false]));
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
        $this->assertNotNull($this->find_activity($payload['data']['results'], 'comment-added'));
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

        $checkout_response = $this->request('POST', 'orders', $this->order_payload(['is_manual' => false]));
        $order = $this->assert_api_success($checkout_response, 201)['data'];

        $other_user_id = static::factory()->user->create(['role' => 'subscriber']);
        wp_set_current_user($other_user_id);

        $response = $this->request('GET', 'account/orders/' . $order['id'] . '/activities');
        $this->assert_api_error($response, 404);
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
