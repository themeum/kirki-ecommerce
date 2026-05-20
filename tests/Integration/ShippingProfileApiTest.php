<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class ShippingProfileApiTest extends RestTestCase
{
    private $shipping_profile_id;

    public function test_create_shipping_profile_returns_201_and_persists(): void
    {
        $response = $this->request('POST', 'shipping-profiles', [
            'name' => 'Standard Shipping',
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('Standard Shipping', $payload['data']['name']);

        $this->shipping_profile_id = $payload['data']['id'];
    }

    public function test_show_shipping_profile_returns_resource(): void
    {
        $profile = $this->create_shipping_profile(['name' => 'Show Profile']);
        $this->shipping_profile_id = $profile['id'];

        $response = $this->request('GET', 'shipping-profiles/' . $this->shipping_profile_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->shipping_profile_id, $payload['data']['id']);
        $this->assertEquals('Show Profile', $payload['data']['name']);
    }

    public function test_update_shipping_profile_changes_fields(): void
    {
        $profile = $this->create_shipping_profile();
        $this->shipping_profile_id = $profile['id'];

        $response = $this->request('PUT', 'shipping-profiles/' . $this->shipping_profile_id, [
            'id' => $this->shipping_profile_id,
            'name' => 'Updated Profile',
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated Profile', $payload['data']['name']);
    }

    public function test_delete_shipping_profile_removes_record(): void
    {
        $this->shipping_profile_id = $this->create_shipping_profile()['id'];

        $response = $this->request('DELETE', 'shipping-profiles/' . $this->shipping_profile_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    public function test_show_deleted_shipping_profile_returns_404(): void
    {
        $this->shipping_profile_id = $this->create_shipping_profile()['id'];
        $this->request('DELETE', 'shipping-profiles/' . $this->shipping_profile_id);

        $response = $this->request('GET', 'shipping-profiles/' . $this->shipping_profile_id);
        $this->assert_api_error($response, 404);
    }

    public function test_create_shipping_profile_validation_fails_without_name(): void
    {
        $response = $this->request('POST', 'shipping-profiles', [
            'name' => '',
        ]);

        $this->assert_validation_error($response);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->logout();

        $response = $this->request('GET', 'shipping-profiles');
        $this->assert_api_error($response, 401);
    }

    public function test_list_shipping_profiles_returns_paginated_results(): void
    {
        $this->create_shipping_profile(['name' => 'Profile Alpha']);
        $this->create_shipping_profile(['name' => 'Profile Beta']);

        $response = $this->request('GET', 'shipping-profiles', [
            'page' => 1,
            'limit' => 10,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertArrayHasKey('results', $payload['data']);
        $this->assertGreaterThanOrEqual(2, $payload['data']['total']);
    }

    public function test_bulk_action_on_shipping_profiles(): void
    {
        $first = $this->create_shipping_profile(['name' => 'Bulk One']);
        $second = $this->create_shipping_profile(['name' => 'Bulk Two']);

        $response = $this->request('POST', 'shipping-profiles/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$first['id'], $second['id']],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $check = $this->request('GET', 'shipping-profiles/' . $first['id']);
        $this->assert_api_error($check, 404);
    }

    private function create_shipping_profile(array $overrides = []): array
    {
        $response = $this->request('POST', 'shipping-profiles', array_merge([
            'name' => 'Test Profile',
        ], $overrides));

        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }
}
