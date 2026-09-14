<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class TaxProfileApiTest extends RestTestCase
{
    /**
     * Tax profile id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $tax_profile_id;

    /**
     * Create tax profile returns 201 and persists.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_tax_profile_returns_201_and_persists(): void
    {
        $response = $this->request('POST', 'tax-profiles', [
            'name' => 'Standard Tax',
            'is_default' => false,
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('Standard Tax', $payload['data']['name']);

        $this->tax_profile_id = $payload['data']['id'];
    }

    /**
     * Show tax profile returns resource.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_tax_profile_returns_resource(): void
    {
        $profile = $this->create_tax_profile(['name' => 'Show Tax Profile']);
        $this->tax_profile_id = $profile['id'];

        $response = $this->request('GET', 'tax-profiles/' . $this->tax_profile_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->tax_profile_id, $payload['data']['id']);
        $this->assertEquals('Show Tax Profile', $payload['data']['name']);
    }

    /**
     * Update tax profile changes fields.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_tax_profile_changes_fields(): void
    {
        $profile = $this->create_tax_profile();
        $this->tax_profile_id = $profile['id'];

        $response = $this->request('PUT', 'tax-profiles/' . $this->tax_profile_id, [
            'id' => $this->tax_profile_id,
            'name' => 'Updated Tax Profile',
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated Tax Profile', $payload['data']['name']);
    }

    /**
     * Delete tax profile removes record.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_tax_profile_removes_record(): void
    {
        $this->tax_profile_id = $this->create_tax_profile()['id'];

        $response = $this->request('DELETE', 'tax-profiles/' . $this->tax_profile_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    /**
     * Show deleted tax profile returns 404.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_deleted_tax_profile_returns_404(): void
    {
        $this->tax_profile_id = $this->create_tax_profile()['id'];
        $this->request('DELETE', 'tax-profiles/' . $this->tax_profile_id);

        $response = $this->request('GET', 'tax-profiles/' . $this->tax_profile_id);
        $this->assert_api_error($response, 404);
    }

    /**
     * Create tax profile validation fails without name.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_tax_profile_validation_fails_without_name(): void
    {
        $response = $this->request('POST', 'tax-profiles', [
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

        $response = $this->request('GET', 'tax-profiles');
        $this->assert_api_error($response, 401);
    }

    /**
     * List tax profiles returns paginated results.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_tax_profiles_returns_paginated_results(): void
    {
        $this->create_tax_profile(['name' => 'Tax Alpha']);
        $this->create_tax_profile(['name' => 'Tax Beta']);

        $response = $this->request('GET', 'tax-profiles', [
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
     * Bulk action on tax profiles.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_action_on_tax_profiles(): void
    {
        $first = $this->create_tax_profile(['name' => 'Bulk One']);
        $second = $this->create_tax_profile(['name' => 'Bulk Two']);

        $response = $this->request('POST', 'tax-profiles/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$first['id'], $second['id']],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $check = $this->request('GET', 'tax-profiles/' . $first['id']);
        $this->assert_api_error($check, 404);
    }

    /**
     * Resource exposes the is_default flag.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_tax_profile_resource_exposes_is_default(): void
    {
        $profile = $this->create_tax_profile(['name' => 'Flagged', 'is_default' => true]);
        $this->tax_profile_id = $profile['id'];

        $this->assertArrayHasKey('is_default', $profile);
        $this->assertTrue($profile['is_default']);

        $response = $this->request('GET', 'tax-profiles/' . $this->tax_profile_id);
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
        $first = $this->create_tax_profile(['name' => 'First Default', 'is_default' => true]);
        $second = $this->create_tax_profile(['name' => 'Second Default', 'is_default' => true]);
        $this->tax_profile_id = $second['id'];

        $first_check = $this->request('GET', 'tax-profiles/' . $first['id']);
        $this->assertFalse($this->assert_api_success($first_check)['data']['is_default']);

        $this->request('PUT', 'tax-profiles/' . $first['id'], [
            'id' => $first['id'],
            'name' => 'First Default',
            'is_default' => true,
        ]);

        $second_check = $this->request('GET', 'tax-profiles/' . $second['id']);
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
        $profile = $this->create_tax_profile(['name' => 'Toggle', 'is_default' => true]);
        $this->tax_profile_id = $profile['id'];

        $response = $this->request('PUT', 'tax-profiles/' . $profile['id'], [
            'id' => $profile['id'],
            'name' => 'Toggle',
            'is_default' => false,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertFalse($payload['data']['is_default']);
    }

    /**
     * Create tax profile.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_tax_profile(array $overrides = []): array
    {
        $response = $this->request('POST', 'tax-profiles', array_merge([
            'name' => 'Test Tax Profile',
            'is_default' => false,
        ], $overrides));

        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }
}
