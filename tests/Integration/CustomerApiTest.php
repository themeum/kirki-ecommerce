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
        $this->assertNotEmpty($payload['data']['addresses']);

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
     * Create customer persists tags.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_customer_persists_tags(): void
    {
        $response = $this->request('POST', 'customers', $this->customer_payload([
            'tags' => ['vip', 'wholesale'],
        ]));

        $payload = $this->assert_api_success($response, 201);
        $this->assertEquals(['vip', 'wholesale'], $payload['data']['tags']);

        $this->customer_id = $payload['data']['id'];
        $fetched = $this->request('GET', 'customers/' . $this->customer_id);
        $fetched_payload = $this->assert_api_success($fetched);
        $this->assertEquals(['vip', 'wholesale'], $fetched_payload['data']['tags']);
    }

    /**
     * Create customer with empty tags persists as an empty array.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_customer_with_empty_tags_persists_empty_array(): void
    {
        $response = $this->request('POST', 'customers', $this->customer_payload([
            'tags' => [],
        ]));

        $payload = $this->assert_api_success($response, 201);
        $this->assertEquals([], $payload['data']['tags']);

        $this->customer_id = $payload['data']['id'];
        $fetched = $this->request('GET', 'customers/' . $this->customer_id);
        $fetched_payload = $this->assert_api_success($fetched);
        $this->assertEquals([], $fetched_payload['data']['tags']);
    }

    /**
     * A customer can be created with no addresses submitted at all -
     * addresses are no longer required up front, since they can be added to
     * the address book later.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_customer_without_any_address_persists(): void
    {
        $response = $this->request('POST', 'customers', [
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'no-address-' . wp_generate_password(8, false) . '@example.com',
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertSame([], $payload['data']['addresses']);

        $this->customer_id = $payload['data']['id'];
    }

    /**
     * A customer created with a single address submitted, with no default
     * flags set, gets that one address as the default for both purposes, not
     * just shipping.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_customer_with_only_shipping_address_defaults_both_purposes(): void
    {
        $unique = wp_generate_password(8, false);

        $response = $this->request('POST', 'customers', [
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'shipping-only-' . $unique . '@example.com',
            'addresses' => [
                [
                    'first_name' => 'Jane',
                    'last_name' => 'Smith',
                    'email' => 'shipping-only-' . $unique . '@example.com',
                    'phone' => '5550100',
                    'address_line1' => '123 Main St',
                    'city' => 'New York',
                    'state' => 'NY',
                    'postal_code' => '10001',
                    'country' => 'US',
                ],
            ],
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertCount(1, $payload['data']['addresses']);
        $this->assertTrue($payload['data']['addresses'][0]['is_default_shipping']);
        $this->assertTrue($payload['data']['addresses'][0]['is_default_billing']);

        $this->customer_id = $payload['data']['id'];
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

        $response = $this->request('PUT', 'customers/' . $this->customer_id, [
            'id' => $this->customer_id,
            'first_name' => 'Updated',
            'last_name' => 'Name',
            'email' => $customer['email'],
            'addresses' => [
                array_merge($customer['addresses'][0], [
                    'first_name' => 'Updated',
                    'last_name' => 'Name',
                ]),
            ],
        ]);

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
     * Creating a customer with an email already used by another customer
     * is rejected with a field-level validation error on `email`.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_customer_with_duplicate_email_returns_validation_error(): void
    {
        $existing = $this->create_customer();
        $this->customer_id = $existing['id'];

        $response = $this->request('POST', 'customers', $this->customer_payload([
            'email' => $existing['email'],
        ]));

        $data = $this->assert_validation_error($response);
        $this->assertArrayHasKey('email', $data['errors']);
    }

    /**
     * Updating a customer's email to one already used by a different
     * customer is rejected with a field-level validation error on `email`.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_customer_with_duplicate_email_returns_validation_error(): void
    {
        $first = $this->create_customer();
        $second = $this->create_customer();
        $this->customer_id = $second['id'];

        $response = $this->request('PUT', 'customers/' . $second['id'], [
            'id' => $second['id'],
            'first_name' => $second['first_name'],
            'last_name' => $second['last_name'],
            'email' => $first['email'],
            'addresses' => [$second['addresses'][0]],
        ]);

        $data = $this->assert_validation_error($response);
        $this->assertArrayHasKey('email', $data['errors']);
    }

    /**
     * Updating a customer while keeping its own current email is not
     * rejected as a duplicate.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_customer_with_own_unchanged_email_is_not_rejected(): void
    {
        $customer = $this->create_customer();
        $this->customer_id = $customer['id'];

        $response = $this->request('PUT', 'customers/' . $customer['id'], [
            'id' => $customer['id'],
            'first_name' => 'Still',
            'last_name' => 'Me',
            'email' => $customer['email'],
            'addresses' => [$customer['addresses'][0]],
        ]);

        $this->assert_api_success($response);
    }

    /**
     * Changing the email of a customer linked to a WordPress user is
     * rejected with a field-level validation error on `email`.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_customer_email_linked_to_wordpress_user_returns_validation_error(): void
    {
        $customer = $this->create_customer(['create_wordpress_user' => true]);
        $this->customer_id = $customer['id'];
        $this->assertNotEmpty($customer['user_id']);

        $response = $this->request('PUT', 'customers/' . $customer['id'], [
            'id' => $customer['id'],
            'first_name' => $customer['first_name'],
            'last_name' => $customer['last_name'],
            'email' => 'changed-' . wp_generate_password(8, false) . '@example.com',
            'addresses' => [$customer['addresses'][0]],
        ]);

        $data = $this->assert_validation_error($response);
        $this->assertArrayHasKey('email', $data['errors']);
    }

    /**
     * Changing the email of a customer with no linked WordPress user is
     * accepted.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_customer_email_without_linked_wordpress_user_is_accepted(): void
    {
        $customer = $this->create_customer();
        $this->customer_id = $customer['id'];
        $this->assertEmpty($customer['user_id']);

        $response = $this->request('PUT', 'customers/' . $customer['id'], [
            'id' => $customer['id'],
            'first_name' => $customer['first_name'],
            'last_name' => $customer['last_name'],
            'email' => 'changed-' . wp_generate_password(8, false) . '@example.com',
            'addresses' => [$customer['addresses'][0]],
        ]);

        $this->assert_api_success($response);
    }

    /**
     * A touched address row (one with any content field filled in) still
     * requires its other core fields.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_customer_with_touched_address_missing_required_field_fails(): void
    {
        $response = $this->request('POST', 'customers', $this->customer_payload([
            'addresses' => [
                [
                    'first_name' => '',
                    'last_name' => 'Doe',
                    'email' => 'address-' . wp_generate_password(8, false) . '@example.com',
                    'phone' => '5550100',
                    'address_line1' => '123 Main St',
                    'city' => 'New York',
                    'state' => 'NY',
                    'postal_code' => '10001',
                    'country' => 'US',
                ],
            ],
        ]));

        $data = $this->assert_validation_error($response);
        $this->assertArrayHasKey('addresses.0.first_name', $data['errors']);
    }

    /**
     * An address of type "others" without a label is rejected.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_customer_with_others_type_address_missing_label_fails(): void
    {
        $response = $this->request('POST', 'customers', $this->customer_payload([
            'addresses' => [
                [
                    'type' => 'others',
                    'label' => '',
                ],
            ],
        ]));

        $data = $this->assert_validation_error($response);
        $this->assertArrayHasKey('addresses.0.label', $data['errors']);
    }

    /**
     * An address in a country that requires a state/province is rejected
     * when that field is left blank.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_customer_with_country_requiring_state_missing_fails(): void
    {
        $response = $this->request('POST', 'customers', $this->customer_payload([
            'addresses' => [
                [
                    'country' => 'US',
                    'state' => '',
                ],
            ],
        ]));

        $data = $this->assert_validation_error($response);
        $this->assertArrayHasKey('addresses.0.state', $data['errors']);
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
     * Customers can be sorted by every field the list presents, including the
     * ones derived from relations rather than stored on the customer.
     *
     * @dataProvider derived_customer_sort_fields
     *
     * @param string $sort_by Sort field.
     * @return void
     */
    public function test_list_customers_accepts_derived_sort_fields(string $sort_by): void
    {
        $this->create_customer(['first_name' => 'Sortable']);

        foreach (['asc', 'desc'] as $direction) {
            $response = $this->request('GET', 'customers', [
                'sort_by' => $sort_by,
                'sort_order' => $direction,
                'limit' => 10,
            ]);

            $payload = $this->assert_api_success($response);
            $this->assertNotEmpty($payload['data']['results'], "{$sort_by} {$direction} returned no rows");
        }
    }

    /**
     * @return array
     */
    public function derived_customer_sort_fields(): array
    {
        return [
            'orders count' => ['orders_count'],
            'lifetime spend' => ['base_amount_spent'],
            'last order date' => ['last_order_date'],
            'location' => ['location'],
            'first name' => ['first_name'],
            'created at' => ['created_at'],
        ];
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
            'addresses' => [
                [
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
                    'type' => 'home',
                ],
            ],
        ];

        if (isset($overrides['email'])) {
            $payload['addresses'][0]['email'] = $overrides['email'];
        }

        if (isset($overrides['first_name'])) {
            $payload['addresses'][0]['first_name'] = $overrides['first_name'];
        }

        if (isset($overrides['last_name'])) {
            $payload['addresses'][0]['last_name'] = $overrides['last_name'];
        }

        return array_replace_recursive($payload, $overrides);
    }

    /**
     * Filtering customers by country narrows the list.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_customers_filters_by_country(): void
    {
        $us = $this->create_customer_in('US', 'New York');
        $ca = $this->create_customer_in('CA', 'Toronto');

        $ids = $this->listed_customer_ids(['country' => 'US']);

        $this->assertContains($us, $ids);
        $this->assertNotContains($ca, $ids);
    }

    /**
     * Filtering customers by city narrows the list.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_customers_filters_by_city(): void
    {
        $new_york = $this->create_customer_in('US', 'New York');
        $boston = $this->create_customer_in('US', 'Boston');

        $ids = $this->listed_customer_ids(['city' => 'Boston']);

        $this->assertContains($boston, $ids);
        $this->assertNotContains($new_york, $ids);
    }

    /**
     * Filtering by country and city together narrows by both.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_customers_filters_by_country_and_city_together(): void
    {
        $us_boston = $this->create_customer_in('US', 'Boston');
        $ca_boston = $this->create_customer_in('CA', 'Boston');
        $us_new_york = $this->create_customer_in('US', 'New York');

        $ids = $this->listed_customer_ids(['country' => 'US', 'city' => 'Boston']);

        $this->assertContains($us_boston, $ids);
        $this->assertNotContains($ca_boston, $ids);
        $this->assertNotContains($us_new_york, $ids);
    }

    /**
     * A customer without a default shipping address drops out while a location filter is in force.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_customers_excludes_customers_without_a_shipping_address(): void
    {
        $located = $this->create_customer_in('US', 'New York');
        $unlocated = $this->create_customer_without_addresses();

        $unfiltered = $this->listed_customer_ids();
        $this->assertContains($unlocated, $unfiltered);

        $filtered = $this->listed_customer_ids(['country' => 'US']);
        $this->assertContains($located, $filtered);
        $this->assertNotContains($unlocated, $filtered);
    }

    /**
     * The locations endpoint offers only locations customers are actually in.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_customer_locations_lists_only_present_values(): void
    {
        $this->create_customer_in('US', 'New York');
        $this->create_customer_in('CA', 'Toronto');

        $response = $this->request('GET', 'customers/locations');
        $payload = $this->assert_api_success($response);

        $this->assertContains('US', $payload['data']['countries']);
        $this->assertContains('CA', $payload['data']['countries']);
        $this->assertNotContains('DE', $payload['data']['countries']);
        $this->assertContains('New York', $payload['data']['cities']);
        $this->assertContains('Toronto', $payload['data']['cities']);
    }

    /**
     * The locations endpoint scopes the cities to the given country.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_customer_locations_scopes_cities_by_country(): void
    {
        $this->create_customer_in('US', 'New York');
        $this->create_customer_in('CA', 'Toronto');

        $response = $this->request('GET', 'customers/locations', ['country' => 'CA']);
        $payload = $this->assert_api_success($response);

        $this->assertContains('Toronto', $payload['data']['cities']);
        $this->assertNotContains('New York', $payload['data']['cities']);
    }

    /**
     * Delete-all filtered by country removes only the customers in that country.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_all_filtered_by_country_deletes_only_matching_customers(): void
    {
        $us_new_york = $this->create_customer_in('US', 'New York');
        $us_boston = $this->create_customer_in('US', 'Boston');
        $ca_toronto = $this->create_customer_in('CA', 'Toronto');

        $response = $this->request('POST', 'customers/bulk', [
            'action' => BulkActions::DELETE_ALL,
            'country' => 'US',
        ]);
        $this->assert_api_success($response);

        $this->assertFalse($this->customer_exists($us_new_york));
        $this->assertFalse($this->customer_exists($us_boston));
        $this->assertTrue($this->customer_exists($ca_toronto));
    }

    /**
     * Delete-all filtered by country and city removes only the customers matching both.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_all_filtered_by_country_and_city_deletes_only_customers_matching_both(): void
    {
        $us_boston = $this->create_customer_in('US', 'Boston');
        $ca_boston = $this->create_customer_in('CA', 'Boston');
        $us_new_york = $this->create_customer_in('US', 'New York');

        $response = $this->request('POST', 'customers/bulk', [
            'action' => BulkActions::DELETE_ALL,
            'country' => 'US',
            'city' => 'Boston',
        ]);
        $this->assert_api_success($response);

        $this->assertFalse($this->customer_exists($us_boston));
        $this->assertTrue($this->customer_exists($ca_boston));
        $this->assertTrue($this->customer_exists($us_new_york));
    }

    /**
     * Delete-all without filters removes every customer.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_all_without_filters_deletes_every_customer(): void
    {
        $us_customer = $this->create_customer_in('US', 'New York');
        $ca_customer = $this->create_customer_in('CA', 'Toronto');
        $unlocated_customer = $this->create_customer_without_addresses();

        $response = $this->request('POST', 'customers/bulk', [
            'action' => BulkActions::DELETE_ALL,
        ]);
        $this->assert_api_success($response);

        $this->assertFalse($this->customer_exists($us_customer));
        $this->assertFalse($this->customer_exists($ca_customer));
        $this->assertFalse($this->customer_exists($unlocated_customer));
    }

    /**
     * Whether a customer can still be retrieved.
     *
     * @param int $id Customer identifier.
     *
     * @return bool
     * @since 1.0.0
     */
    protected function customer_exists(int $id): bool
    {
        return $this->request('GET', 'customers/' . $id)->get_status() === 200;
    }

    /**
     * Create a customer whose default shipping address is in a known place.
     *
     * @param string $country Shipping country.
     * @param string $city    Shipping city.
     *
     * @return int
     * @since 1.0.0
     */
    protected function create_customer_in(string $country, string $city): int
    {
        $payload = $this->customer_payload();
        $payload['addresses'][0]['country'] = $country;
        $payload['addresses'][0]['city'] = $city;

        $customer = $this->create_customer($payload);

        return (int) $customer['id'];
    }

    /**
     * Create a customer with no addresses submitted.
     *
     * @return int
     * @since 1.0.0
     */
    protected function create_customer_without_addresses(): int
    {
        $unique = wp_generate_password(8, false);

        $response = $this->request('POST', 'customers', [
            'first_name' => 'No',
            'last_name' => 'Address',
            'email' => 'no-address-' . $unique . '@example.com',
        ]);
        $payload = $this->assert_api_success($response, 201);

        return (int) $payload['data']['id'];
    }

    /**
     * Request the customer list and return the listed identifiers.
     *
     * @param array $params Query parameters.
     *
     * @return array
     * @since 1.0.0
     */
    protected function listed_customer_ids(array $params = []): array
    {
        $response = $this->request('GET', 'customers', array_merge(['limit' => 100], $params));
        $payload = $this->assert_api_success($response);

        return array_map('intval', array_column($payload['data']['results'], 'id'));
    }
}
