<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class CollectionApiTest extends RestTestCase
{
    /**
     * Collection id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $collection_id;

    /**
     * Create collection returns 201 and persists.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_collection_returns_201_and_persists(): void
    {
        $response = $this->request('POST', 'collections', [
            'title' => 'Summer Collection',
            'slug' => 'summer-collection',
            'description' => 'Seasonal products',
            'is_active' => true,
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('Summer Collection', $payload['data']['title']);
        $this->assertEquals('summer-collection', $payload['data']['slug']);
        $this->assertTrue($payload['data']['is_active']);

        $this->collection_id = $payload['data']['id'];
    }

    /**
     * Show collection returns resource.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_collection_returns_resource(): void
    {
        $this->collection_id = $this->create_collection()['id'];

        $response = $this->request('GET', 'collections/' . $this->collection_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->collection_id, $payload['data']['id']);
        $this->assertEquals('Test Collection', $payload['data']['title']);
    }

    /**
     * Update collection changes fields.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_collection_changes_fields(): void
    {
        $this->collection_id = $this->create_collection()['id'];

        $response = $this->request('PUT', 'collections/' . $this->collection_id, [
            'id' => $this->collection_id,
            'title' => 'Updated Collection',
            'slug' => 'updated-collection',
            'description' => 'Updated description',
            'is_active' => false,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated Collection', $payload['data']['title']);
        $this->assertEquals('updated-collection', $payload['data']['slug']);
        $this->assertFalse($payload['data']['is_active']);
    }

    /**
     * Delete collection removes record.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_collection_removes_record(): void
    {
        $this->collection_id = $this->create_collection()['id'];

        $response = $this->request('DELETE', 'collections/' . $this->collection_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    /**
     * Show deleted collection returns 404.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_deleted_collection_returns_404(): void
    {
        $this->collection_id = $this->create_collection()['id'];
        $this->request('DELETE', 'collections/' . $this->collection_id);

        $response = $this->request('GET', 'collections/' . $this->collection_id);
        $this->assert_api_error($response, 404);
    }

    /**
     * Create collection validation fails without title.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_collection_validation_fails_without_title(): void
    {
        $response = $this->request('POST', 'collections', [
            'slug' => 'no-title-collection',
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

        $response = $this->request('GET', 'collections');
        $this->assert_api_error($response, 401);
    }

    /**
     * List collections returns paginated results.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_collections_returns_paginated_results(): void
    {
        $this->create_collection(['title' => 'Collection Alpha', 'slug' => 'collection-alpha']);
        $this->create_collection(['title' => 'Collection Beta', 'slug' => 'collection-beta']);

        $response = $this->request('GET', 'collections', [
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
     * Bulk action on collections.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_action_on_collections(): void
    {
        $first = $this->create_collection(['title' => 'Bulk One', 'slug' => 'bulk-one']);
        $second = $this->create_collection(['title' => 'Bulk Two', 'slug' => 'bulk-two']);

        $response = $this->request('POST', 'collections/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$first['id'], $second['id']],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $check = $this->request('GET', 'collections/' . $first['id']);
        $this->assert_api_error($check, 404);
    }

    /**
     * Create collection.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_collection(array $overrides = []): array
    {
        $response = $this->request('POST', 'collections', array_merge([
            'title' => 'Test Collection',
            'slug' => 'test-collection-' . wp_generate_password(6, false),
            'description' => 'Test description',
        ], $overrides));

        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }
}
