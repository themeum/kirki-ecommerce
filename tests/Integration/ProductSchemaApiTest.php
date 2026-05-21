<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class ProductSchemaApiTest extends RestTestCase
{
    /**
     * Schema id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $schema_id;

    /**
     * Create product schema returns 201 and persists.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_product_schema_returns_201_and_persists(): void
    {
        $response = $this->request('POST', 'product-schemas', [
            'name' => 'Default Schema',
            'is_default' => false,
            'schema' => ['@type' => 'Product'],
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('Default Schema', $payload['data']['name']);

        $this->schema_id = $payload['data']['id'];
    }

    /**
     * Show product schema returns resource.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_product_schema_returns_resource(): void
    {
        $schema = $this->create_product_schema(['name' => 'Show Schema']);
        $this->schema_id = $schema['id'];

        $response = $this->request('GET', 'product-schemas/' . $this->schema_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->schema_id, $payload['data']['id']);
        $this->assertEquals('Show Schema', $payload['data']['name']);
    }

    /**
     * Update product schema changes fields.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_product_schema_changes_fields(): void
    {
        $schema = $this->create_product_schema();
        $this->schema_id = $schema['id'];

        $response = $this->request('PUT', 'product-schemas/' . $this->schema_id, [
            'id' => $this->schema_id,
            'name' => 'Updated Schema',
            'is_default' => false,
            'schema' => ['@type' => 'Product'],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated Schema', $payload['data']['name']);
    }

    /**
     * Delete product schema removes record.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_product_schema_removes_record(): void
    {
        $this->schema_id = $this->create_product_schema()['id'];

        $response = $this->request('DELETE', 'product-schemas/' . $this->schema_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    /**
     * Show deleted product schema returns 404.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_deleted_product_schema_returns_404(): void
    {
        $this->schema_id = $this->create_product_schema()['id'];
        $this->request('DELETE', 'product-schemas/' . $this->schema_id);

        $response = $this->request('GET', 'product-schemas/' . $this->schema_id);
        $this->assert_api_error($response, 404);
    }

    /**
     * Create product schema validation fails without name.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_product_schema_validation_fails_without_name(): void
    {
        $response = $this->request('POST', 'product-schemas', [
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

        $response = $this->request('GET', 'product-schemas');
        $this->assert_api_error($response, 401);
    }

    /**
     * List product schemas returns paginated results.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_product_schemas_returns_paginated_results(): void
    {
        $this->create_product_schema(['name' => 'Schema Alpha']);
        $this->create_product_schema(['name' => 'Schema Beta']);

        $response = $this->request('GET', 'product-schemas', [
            'page' => 1,
            'limit' => 10,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertArrayHasKey('results', $payload['data']);
        $this->assertGreaterThanOrEqual(2, $payload['data']['total']);
    }

    /**
     * Bulk action on product schemas.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_action_on_product_schemas(): void
    {
        $first = $this->create_product_schema(['name' => 'Bulk One']);
        $second = $this->create_product_schema(['name' => 'Bulk Two']);

        $response = $this->request('POST', 'product-schemas/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$first['id'], $second['id']],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $check = $this->request('GET', 'product-schemas/' . $first['id']);
        $this->assert_api_error($check, 404);
    }

    /**
     * Create product schema.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_product_schema(array $overrides = []): array
    {
        $response = $this->request('POST', 'product-schemas', array_merge([
            'name' => 'Test Schema',
            'is_default' => false,
            'schema' => ['@type' => 'Product'],
        ], $overrides));

        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }
}
