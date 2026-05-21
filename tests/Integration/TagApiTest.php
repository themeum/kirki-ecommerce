<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class TagApiTest extends RestTestCase
{
    /**
     * Tag id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $tag_id;

    /**
     * Create tag returns 201 and persists.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_tag_returns_201_and_persists(): void
    {
        $response = $this->request('POST', 'tags', [
            'name' => 'Summer Sale',
            'slug' => 'summer-sale',
            'description' => 'Seasonal discounts',
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('Summer Sale', $payload['data']['name']);
        $this->assertEquals('summer-sale', $payload['data']['slug']);

        $this->tag_id = $payload['data']['id'];
    }

    /**
     * Show tag returns resource.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_tag_returns_resource(): void
    {
        $this->tag_id = $this->create_tag()['id'];

        $response = $this->request('GET', 'tags/' . $this->tag_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->tag_id, $payload['data']['id']);
        $this->assertEquals('Test Tag', $payload['data']['name']);
    }

    /**
     * Update tag changes fields.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_tag_changes_fields(): void
    {
        $this->tag_id = $this->create_tag()['id'];

        $response = $this->request('PUT', 'tags/' . $this->tag_id, [
            'id' => $this->tag_id,
            'name' => 'Updated Tag',
            'slug' => 'updated-tag',
            'description' => 'Updated description',
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated Tag', $payload['data']['name']);
        $this->assertEquals('updated-tag', $payload['data']['slug']);
    }

    /**
     * Delete tag removes record.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_tag_removes_record(): void
    {
        $this->tag_id = $this->create_tag()['id'];

        $response = $this->request('DELETE', 'tags/' . $this->tag_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    /**
     * Show deleted tag returns 404.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_deleted_tag_returns_404(): void
    {
        $this->tag_id = $this->create_tag()['id'];
        $this->request('DELETE', 'tags/' . $this->tag_id);

        $response = $this->request('GET', 'tags/' . $this->tag_id);
        $this->assert_api_error($response, 404);
    }

    /**
     * Create tag validation fails without name.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_tag_validation_fails_without_name(): void
    {
        $response = $this->request('POST', 'tags', [
            'slug' => 'no-name-tag',
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

        $response = $this->request('GET', 'tags');
        $this->assert_api_error($response, 401);
    }

    /**
     * List tags returns paginated results.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_tags_returns_paginated_results(): void
    {
        $this->create_tag(['name' => 'Tag Alpha', 'slug' => 'tag-alpha']);
        $this->create_tag(['name' => 'Tag Beta', 'slug' => 'tag-beta']);

        $response = $this->request('GET', 'tags', [
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
     * Bulk action on tags.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_action_on_tags(): void
    {
        $first = $this->create_tag(['name' => 'Bulk One', 'slug' => 'bulk-one']);
        $second = $this->create_tag(['name' => 'Bulk Two', 'slug' => 'bulk-two']);

        $response = $this->request('POST', 'tags/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$first['id'], $second['id']],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $check = $this->request('GET', 'tags/' . $first['id']);
        $this->assert_api_error($check, 404);
    }

    /**
     * Create tag.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_tag(array $overrides = []): array
    {
        $response = $this->request('POST', 'tags', array_merge([
            'name' => 'Test Tag',
            'slug' => 'test-tag-' . wp_generate_password(6, false),
            'description' => 'Test description',
        ], $overrides));

        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }
}
