<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Tests\Support\RestTestCase;

class AddressApiTest extends RestTestCase
{
    /**
     * Build a valid address payload.
     *
     * @param array $overrides
     * @return array
     * @since 1.0.0
     */
    protected function address_payload(array $overrides = []): array
    {
        return array_merge([
            'type' => 'home',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'address_line1' => '123 Main St',
            'address_line2' => '',
            'city' => 'New York',
            'state' => 'NY',
            'postal_code' => '10001',
            'country' => 'US',
        ], $overrides);
    }

    /**
     * Log in as a fresh WordPress user with no existing Customer record.
     *
     * @return int the created user id
     * @since 1.0.0
     */
    protected function login_as_new_customer(): int
    {
        $user_id = static::factory()->user->create([
            'role' => 'subscriber',
        ]);
        wp_set_current_user($user_id);

        return $user_id;
    }

    public function test_create_address_returns_201_and_persists(): void
    {
        $this->login_as_new_customer();

        $response = $this->request('POST', 'account/addresses', $this->address_payload());

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('home', $payload['data']['type']);
        $this->assertEquals('123 Main St', $payload['data']['address_line1']);
        $this->assertNull($payload['data']['label']);
        $this->assertFalse($payload['data']['is_default_shipping']);
        $this->assertFalse($payload['data']['is_default_billing']);
    }

    public function test_create_address_persists_label(): void
    {
        $this->login_as_new_customer();

        $response = $this->request('POST', 'account/addresses', $this->address_payload([
            'label' => "Mom's House",
        ]));

        $payload = $this->assert_api_success($response, 201);
        $this->assertEquals("Mom's House", $payload['data']['label']);
    }

    public function test_create_address_provisions_customer_when_none_exists(): void
    {
        $this->login_as_new_customer();

        $response = $this->request('POST', 'account/addresses', $this->address_payload());

        $this->assert_api_success($response, 201);

        $list_response = $this->request('GET', 'account/addresses');
        $list = $this->assert_api_success($list_response, 200);
        $this->assertCount(1, $list['data']);
    }

    public function test_create_address_rejects_invalid_type(): void
    {
        $this->login_as_new_customer();

        $response = $this->request('POST', 'account/addresses', $this->address_payload(['type' => 'billing']));

        $this->assert_validation_error($response);
    }

    public function test_create_address_rejects_missing_required_field(): void
    {
        $this->login_as_new_customer();

        $payload = $this->address_payload();
        unset($payload['city']);

        $response = $this->request('POST', 'account/addresses', $payload);

        $this->assert_validation_error($response);
    }

    public function test_create_address_without_contact_details_succeeds(): void
    {
        $this->login_as_new_customer();

        $response = $this->request('POST', 'account/addresses', $this->address_payload());

        $payload = $this->assert_api_success($response, 201);
        $this->assertEmpty($payload['data']['email']);
        $this->assertEmpty($payload['data']['phone']);
    }

    public function test_list_addresses_returns_only_own_addresses(): void
    {
        $this->login_as_new_customer();
        $this->request('POST', 'account/addresses', $this->address_payload(['type' => 'home']));
        $this->request('POST', 'account/addresses', $this->address_payload(['type' => 'office']));

        $this->login_as_new_customer();
        $this->request('POST', 'account/addresses', $this->address_payload(['type' => 'others']));

        $response = $this->request('GET', 'account/addresses');
        $payload = $this->assert_api_success($response, 200);

        $this->assertCount(1, $payload['data']);
        $this->assertEquals('others', $payload['data'][0]['type']);
    }

    public function test_list_addresses_empty_when_none(): void
    {
        $this->login_as_new_customer();

        $response = $this->request('GET', 'account/addresses');
        $payload = $this->assert_api_success($response, 200);

        $this->assertSame([], $payload['data']);
    }

    public function test_show_address_returns_full_data(): void
    {
        $this->login_as_new_customer();
        $create = $this->assert_api_success(
            $this->request('POST', 'account/addresses', $this->address_payload()),
            201
        );

        $response = $this->request('GET', 'account/addresses/' . $create['data']['id']);
        $payload = $this->assert_api_success($response, 200);

        $this->assertEquals($create['data']['id'], $payload['data']['id']);
    }

    public function test_show_address_not_owned_returns_404(): void
    {
        $this->login_as_new_customer();
        $create = $this->assert_api_success(
            $this->request('POST', 'account/addresses', $this->address_payload()),
            201
        );

        $this->login_as_new_customer();
        $response = $this->request('GET', 'account/addresses/' . $create['data']['id']);

        $this->assert_api_error($response, 404);
    }

    public function test_update_address_persists_changes(): void
    {
        $this->login_as_new_customer();
        $create = $this->assert_api_success(
            $this->request('POST', 'account/addresses', $this->address_payload()),
            201
        );

        $response = $this->request('PUT', 'account/addresses/' . $create['data']['id'], $this->address_payload([
            'city' => 'Los Angeles',
        ]));

        $payload = $this->assert_api_success($response, 200);
        $this->assertEquals('Los Angeles', $payload['data']['city']);
    }

    public function test_update_address_persists_label(): void
    {
        $this->login_as_new_customer();
        $create = $this->assert_api_success(
            $this->request('POST', 'account/addresses', $this->address_payload(['label' => 'Old Label'])),
            201
        );

        $response = $this->request('PUT', 'account/addresses/' . $create['data']['id'], $this->address_payload([
            'label' => 'New Label',
        ]));

        $payload = $this->assert_api_success($response, 200);
        $this->assertEquals('New Label', $payload['data']['label']);
    }

    public function test_update_address_does_not_change_default_status(): void
    {
        $this->login_as_new_customer();
        $create = $this->assert_api_success(
            $this->request('POST', 'account/addresses', $this->address_payload(['is_default_billing' => true])),
            201
        );
        $this->assertTrue($create['data']['is_default_billing']);

        $response = $this->request('PUT', 'account/addresses/' . $create['data']['id'], $this->address_payload([
            'city' => 'Los Angeles',
        ]));

        $payload = $this->assert_api_success($response, 200);
        $this->assertTrue($payload['data']['is_default_billing']);
    }

    public function test_update_address_not_owned_returns_404(): void
    {
        $this->login_as_new_customer();
        $create = $this->assert_api_success(
            $this->request('POST', 'account/addresses', $this->address_payload()),
            201
        );

        $this->login_as_new_customer();
        $response = $this->request('PUT', 'account/addresses/' . $create['data']['id'], $this->address_payload());

        $this->assert_api_error($response, 404);
    }

    public function test_delete_address_removes_it(): void
    {
        $this->login_as_new_customer();
        $create = $this->assert_api_success(
            $this->request('POST', 'account/addresses', $this->address_payload()),
            201
        );

        $delete_response = $this->request('DELETE', 'account/addresses/' . $create['data']['id']);
        $this->assert_api_success($delete_response, 200);

        $show_response = $this->request('GET', 'account/addresses/' . $create['data']['id']);
        $this->assert_api_error($show_response, 404);
    }

    public function test_delete_default_address_does_not_promote_another(): void
    {
        $this->login_as_new_customer();
        $first = $this->assert_api_success(
            $this->request('POST', 'account/addresses', $this->address_payload(['is_default_billing' => true])),
            201
        );
        $this->request('POST', 'account/addresses', $this->address_payload(['type' => 'office']));

        $this->request('DELETE', 'account/addresses/' . $first['data']['id']);

        $list = $this->assert_api_success($this->request('GET', 'account/addresses'), 200);
        foreach ($list['data'] as $address) {
            $this->assertFalse($address['is_default_billing']);
        }
    }

    public function test_set_default_shipping_only(): void
    {
        $this->login_as_new_customer();
        $create = $this->assert_api_success(
            $this->request('POST', 'account/addresses', $this->address_payload()),
            201
        );

        $response = $this->request('PATCH', 'account/addresses/' . $create['data']['id'] . '/set-default', [
            'purpose' => 'shipping',
        ]);

        $payload = $this->assert_api_success($response, 200);
        $this->assertTrue($payload['data']['is_default_shipping']);
        $this->assertFalse($payload['data']['is_default_billing']);
    }

    public function test_set_default_shipping_and_billing_with_two_calls(): void
    {
        $this->login_as_new_customer();
        $create = $this->assert_api_success(
            $this->request('POST', 'account/addresses', $this->address_payload()),
            201
        );

        $this->request('PATCH', 'account/addresses/' . $create['data']['id'] . '/set-default', [
            'purpose' => 'shipping',
        ]);
        $response = $this->request('PATCH', 'account/addresses/' . $create['data']['id'] . '/set-default', [
            'purpose' => 'billing',
        ]);

        $payload = $this->assert_api_success($response, 200);
        $this->assertTrue($payload['data']['is_default_shipping']);
        $this->assertTrue($payload['data']['is_default_billing']);
    }

    public function test_set_default_unsets_previous_default_shipping(): void
    {
        $this->login_as_new_customer();
        $first = $this->assert_api_success(
            $this->request('POST', 'account/addresses', $this->address_payload(['is_default_shipping' => true])),
            201
        );
        $second = $this->assert_api_success(
            $this->request('POST', 'account/addresses', $this->address_payload(['type' => 'office'])),
            201
        );

        $this->request('PATCH', 'account/addresses/' . $second['data']['id'] . '/set-default', [
            'purpose' => 'shipping',
        ]);

        $first_after = $this->assert_api_success(
            $this->request('GET', 'account/addresses/' . $first['data']['id']),
            200
        );
        $second_after = $this->assert_api_success(
            $this->request('GET', 'account/addresses/' . $second['data']['id']),
            200
        );

        $this->assertFalse($first_after['data']['is_default_shipping']);
        $this->assertTrue($second_after['data']['is_default_shipping']);
    }

    public function test_set_default_does_not_affect_other_purpose(): void
    {
        $this->login_as_new_customer();
        $billing = $this->assert_api_success(
            $this->request('POST', 'account/addresses', $this->address_payload(['is_default_billing' => true])),
            201
        );
        $shipping_candidate = $this->assert_api_success(
            $this->request('POST', 'account/addresses', $this->address_payload(['type' => 'office'])),
            201
        );

        $this->request('PATCH', 'account/addresses/' . $shipping_candidate['data']['id'] . '/set-default', [
            'purpose' => 'shipping',
        ]);

        $billing_after = $this->assert_api_success(
            $this->request('GET', 'account/addresses/' . $billing['data']['id']),
            200
        );

        $this->assertTrue($billing_after['data']['is_default_billing']);
    }

    public function test_set_default_rejects_invalid_purpose(): void
    {
        $this->login_as_new_customer();
        $create = $this->assert_api_success(
            $this->request('POST', 'account/addresses', $this->address_payload()),
            201
        );

        $response = $this->request('PATCH', 'account/addresses/' . $create['data']['id'] . '/set-default', [
            'purpose' => 'home',
        ]);

        $this->assert_validation_error($response);
    }

    public function test_unauthenticated_request_rejected(): void
    {
        $this->logout();

        $response = $this->request('GET', 'account/addresses');

        $this->assert_api_error($response, 401);
    }
}
