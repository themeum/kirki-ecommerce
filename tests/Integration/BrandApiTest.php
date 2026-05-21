<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class BrandApiTest extends RestTestCase
{
    /**
     * Brand id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $brand_id;

    /**
     * Create brand returns 201 and persists.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_brand_returns_201_and_persists(): void
    {
        $response = $this->request('POST', 'brands', [
            'name' => 'Acme Corp',
            'slug' => 'acme-corp',
            'description' => 'Premium brand',
            'website_url' => 'https://acme.example',
            'is_active' => true,
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('Acme Corp', $payload['data']['name']);
        $this->assertEquals('acme-corp', $payload['data']['slug']);
        $this->assertEquals('https://acme.example', $payload['data']['website_url']);
        $this->assertTrue($payload['data']['is_active']);

        $this->brand_id = $payload['data']['id'];
    }

    /**
     * Show brand returns resource.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_brand_returns_resource(): void
    {
        $this->brand_id = $this->create_brand()['id'];

        $response = $this->request('GET', 'brands/' . $this->brand_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->brand_id, $payload['data']['id']);
        $this->assertEquals('Test Brand', $payload['data']['name']);
    }

    /**
     * Update brand changes fields.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_brand_changes_fields(): void
    {
        $this->brand_id = $this->create_brand()['id'];

        $response = $this->request('PUT', 'brands/' . $this->brand_id, [
            'id' => $this->brand_id,
            'name' => 'Updated Brand',
            'slug' => 'updated-brand',
            'description' => 'Updated description',
            'website_url' => 'https://updated.example',
            'is_active' => false,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated Brand', $payload['data']['name']);
        $this->assertEquals('updated-brand', $payload['data']['slug']);
        $this->assertEquals('https://updated.example', $payload['data']['website_url']);
        $this->assertFalse($payload['data']['is_active']);
    }

    /**
     * Delete brand removes record.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_brand_removes_record(): void
    {
        $this->brand_id = $this->create_brand()['id'];

        $response = $this->request('DELETE', 'brands/' . $this->brand_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    /**
     * Show deleted brand returns 404.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_deleted_brand_returns_404(): void
    {
        $this->brand_id = $this->create_brand()['id'];
        $this->request('DELETE', 'brands/' . $this->brand_id);

        $response = $this->request('GET', 'brands/' . $this->brand_id);
        $this->assert_api_error($response, 404);
    }

    /**
     * Create brand validation fails without name.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_brand_validation_fails_without_name(): void
    {
        $response = $this->request('POST', 'brands', [
            'slug' => 'no-name-brand',
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

        $response = $this->request('GET', 'brands');
        $this->assert_api_error($response, 401);
    }

    /**
     * List brands returns paginated results.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_brands_returns_paginated_results(): void
    {
        $this->create_brand(['name' => 'Brand Alpha', 'slug' => 'brand-alpha']);
        $this->create_brand(['name' => 'Brand Beta', 'slug' => 'brand-beta']);

        $response = $this->request('GET', 'brands', [
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
     * Bulk action on brands.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_action_on_brands(): void
    {
        $first = $this->create_brand(['name' => 'Bulk One', 'slug' => 'bulk-one']);
        $second = $this->create_brand(['name' => 'Bulk Two', 'slug' => 'bulk-two']);

        $response = $this->request('POST', 'brands/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$first['id'], $second['id']],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $check = $this->request('GET', 'brands/' . $first['id']);
        $this->assert_api_error($check, 404);
    }

    /**
     * Create brand.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_brand(array $overrides = []): array
    {
        $response = $this->request('POST', 'brands', array_merge([
            'name' => 'Test Brand',
            'slug' => 'test-brand-' . wp_generate_password(6, false),
            'description' => 'Test description',
        ], $overrides));

        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }
}
