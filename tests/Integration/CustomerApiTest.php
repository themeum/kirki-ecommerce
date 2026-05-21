<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestCurrency;

class CustomerApiTest extends RestTestCase
{
    use SeedsTestCurrency;

    /**
     * Customer id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $customer_id;

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
    }

    /**
     * Create customer returns 201 and persists.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_customer_returns_201_and_persists(): void
    {
        $response = $this->request('POST', 'customers', $this->customer_payload([
            'first_name' => 'Jane',
            'last_name' => 'Smith',
        ]));

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('Jane', $payload['data']['first_name']);
        $this->assertEquals('Smith', $payload['data']['last_name']);
        $this->assertNotEmpty($payload['data']['email']);
        $this->assertNotEmpty($payload['data']['shipping_address']);

        $this->customer_id = $payload['data']['id'];
    }

    /**
     * Show customer returns resource.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_customer_returns_resource(): void
    {
        $customer = $this->create_customer([
            'first_name' => 'Show',
            'last_name' => 'Customer',
        ]);
        $this->customer_id = $customer['id'];

        $response = $this->request('GET', 'customers/' . $this->customer_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->customer_id, $payload['data']['id']);
        $this->assertEquals('Show', $payload['data']['first_name']);
        $this->assertEquals('Customer', $payload['data']['last_name']);
    }

    /**
     * Update customer changes fields.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_customer_changes_fields(): void
    {
        $customer = $this->create_customer();
        $this->customer_id = $customer['id'];

        $response = $this->request('PUT', 'customers/' . $this->customer_id, $this->customer_payload([
            'id' => $this->customer_id,
            'first_name' => 'Updated',
            'last_name' => 'Name',
            'email' => $customer['email'],
            'shipping_address' => array_merge($customer['shipping_address'], [
                'first_name' => 'Updated',
                'last_name' => 'Name',
            ]),
        ]));

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated', $payload['data']['first_name']);
        $this->assertEquals('Name', $payload['data']['last_name']);
    }

    /**
     * Delete customer removes record.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_customer_removes_record(): void
    {
        $this->customer_id = $this->create_customer()['id'];

        $response = $this->request('DELETE', 'customers/' . $this->customer_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    /**
     * Show deleted customer returns 404.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_deleted_customer_returns_404(): void
    {
        $this->customer_id = $this->create_customer()['id'];
        $this->request('DELETE', 'customers/' . $this->customer_id);

        $response = $this->request('GET', 'customers/' . $this->customer_id);
        $this->assert_api_error($response, 404);
    }

    /**
     * Create customer validation fails without email.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_customer_validation_fails_without_email(): void
    {
        $response = $this->request('POST', 'customers', $this->customer_payload([
            'email' => '',
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

        $response = $this->request('GET', 'customers');
        $this->assert_api_error($response, 401);
    }

    /**
     * List customers returns paginated results.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_customers_returns_paginated_results(): void
    {
        $this->create_customer(['first_name' => 'List Alpha']);
        $this->create_customer(['first_name' => 'List Beta']);

        $response = $this->request('GET', 'customers', [
            'page' => 1,
            'limit' => 10,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertArrayHasKey('results', $payload['data']);
        $this->assertArrayHasKey('total', $payload['data']);
        $this->assertGreaterThanOrEqual(2, $payload['data']['total']);
        $this->assertNotEmpty($payload['data']['results']);
    }

    /**
     * Bulk action on customers.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_action_on_customers(): void
    {
        $first = $this->create_customer(['first_name' => 'Bulk One']);
        $second = $this->create_customer(['first_name' => 'Bulk Two']);

        $response = $this->request('POST', 'customers/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$first['id'], $second['id']],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $check = $this->request('GET', 'customers/' . $first['id']);
        $this->assert_api_error($check, 404);
    }

    /**
     * Create customer.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_customer(array $overrides = []): array
    {
        $response = $this->request('POST', 'customers', $this->customer_payload($overrides));
        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }

    /**
     * Customer payload.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function customer_payload(array $overrides = []): array
    {
        $unique = wp_generate_password(8, false);

        $payload = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'customer-' . $unique . '@example.com',
            'phone' => '5550100',
            'is_billing_same_as_shipping' => true,
            'shipping_address' => [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'customer-' . $unique . '@example.com',
                'phone' => '5550100',
                'address_line1' => '123 Main St',
                'address_line2' => '',
                'city' => 'New York',
                'state' => 'NY',
                'postal_code' => '10001',
                'country' => 'US',
            ],
        ];

        if (isset($overrides['email'])) {
            $payload['shipping_address']['email'] = $overrides['email'];
        }

        if (isset($overrides['first_name'])) {
            $payload['shipping_address']['first_name'] = $overrides['first_name'];
        }

        if (isset($overrides['last_name'])) {
            $payload['shipping_address']['last_name'] = $overrides['last_name'];
        }

        return array_replace_recursive($payload, $overrides);
    }
}
