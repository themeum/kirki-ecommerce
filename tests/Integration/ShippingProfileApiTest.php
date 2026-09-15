<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class ShippingProfileApiTest extends RestTestCase
{
    /**
     * Shipping profile id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $shipping_profile_id;

    /**
     * Create shipping profile returns 201 and persists.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_shipping_profile_returns_201_and_persists(): void
    {
        $response = $this->request('POST', 'shipping-profiles', [
            'name' => 'Standard Shipping',
            'is_default' => false,
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('Standard Shipping', $payload['data']['name']);

        $this->shipping_profile_id = $payload['data']['id'];
    }

    /**
     * Show shipping profile returns resource.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_shipping_profile_returns_resource(): void
    {
        $profile = $this->create_shipping_profile(['name' => 'Show Profile']);
        $this->shipping_profile_id = $profile['id'];

        $response = $this->request('GET', 'shipping-profiles/' . $this->shipping_profile_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->shipping_profile_id, $payload['data']['id']);
        $this->assertEquals('Show Profile', $payload['data']['name']);
    }

    /**
     * Update shipping profile changes fields.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_shipping_profile_changes_fields(): void
    {
        $profile = $this->create_shipping_profile();
        $this->shipping_profile_id = $profile['id'];

        $response = $this->request('PUT', 'shipping-profiles/' . $this->shipping_profile_id, [
            'id' => $this->shipping_profile_id,
            'name' => 'Updated Profile',
            'is_default' => false,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated Profile', $payload['data']['name']);
    }

    /**
     * Delete shipping profile removes record.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_shipping_profile_removes_record(): void
    {
        $this->shipping_profile_id = $this->create_shipping_profile()['id'];

        $response = $this->request('DELETE', 'shipping-profiles/' . $this->shipping_profile_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    /**
     * Show deleted shipping profile returns 404.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_deleted_shipping_profile_returns_404(): void
    {
        $this->shipping_profile_id = $this->create_shipping_profile()['id'];
        $this->request('DELETE', 'shipping-profiles/' . $this->shipping_profile_id);

        $response = $this->request('GET', 'shipping-profiles/' . $this->shipping_profile_id);
        $this->assert_api_error($response, 404);
    }

    /**
     * Create shipping profile validation fails without name.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_shipping_profile_validation_fails_without_name(): void
    {
        $response = $this->request('POST', 'shipping-profiles', [
            'name' => '',
        ]);

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

        $response = $this->request('GET', 'shipping-profiles');
        $this->assert_api_error($response, 401);
    }

    /**
     * List shipping profiles returns paginated results.
     *
     * @return void
     * @since 1.0.0
     */
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

    /**
     * Bulk action on shipping profiles.
     *
     * @return void
     * @since 1.0.0
     */
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

    /**
     * Resource exposes the is_default flag.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_shipping_profile_resource_exposes_is_default(): void
    {
        $profile = $this->create_shipping_profile(['name' => 'Flagged', 'is_default' => true]);
        $this->shipping_profile_id = $profile['id'];

        $this->assertArrayHasKey('is_default', $profile);
        $this->assertTrue($profile['is_default']);

        $response = $this->request('GET', 'shipping-profiles/' . $this->shipping_profile_id);
        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']['is_default']);
    }

    /**
     * Marking a profile default unsets the previously default profile.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_setting_default_unsets_previous_default(): void
    {
        $first = $this->create_shipping_profile(['name' => 'First Default', 'is_default' => true]);
        $second = $this->create_shipping_profile(['name' => 'Second Default', 'is_default' => true]);
        $this->shipping_profile_id = $second['id'];

        $first_check = $this->request('GET', 'shipping-profiles/' . $first['id']);
        $this->assertFalse($this->assert_api_success($first_check)['data']['is_default']);

        $this->request('PUT', 'shipping-profiles/' . $first['id'], [
            'id' => $first['id'],
            'name' => 'First Default',
            'is_default' => true,
        ]);

        $second_check = $this->request('GET', 'shipping-profiles/' . $second['id']);
        $this->assertFalse($this->assert_api_success($second_check)['data']['is_default']);
    }

    /**
     * Unsetting the default profile is allowed and leaves no default.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_default_can_be_unset(): void
    {
        $profile = $this->create_shipping_profile(['name' => 'Toggle', 'is_default' => true]);
        $this->shipping_profile_id = $profile['id'];

        $response = $this->request('PUT', 'shipping-profiles/' . $profile['id'], [
            'id' => $profile['id'],
            'name' => 'Toggle',
            'is_default' => false,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertFalse($payload['data']['is_default']);
    }

    /**
     * Create shipping profile.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_shipping_profile(array $overrides = []): array
    {
        $response = $this->request('POST', 'shipping-profiles', array_merge([
            'name' => 'Test Profile',
            'is_default' => false,
        ], $overrides));

        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }
}
