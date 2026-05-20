<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class CategoryApiTest extends RestTestCase
{
    private $category_id;

    public function test_create_category_returns_201_and_persists(): void
    {
        $response = $this->request('POST', 'categories', [
            'name' => 'Electronics',
            'slug' => 'electronics',
            'description' => 'Electronic products',
            'is_active' => true,
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('Electronics', $payload['data']['name']);
        $this->assertEquals('electronics', $payload['data']['slug']);
        $this->assertTrue($payload['data']['is_active']);

        $this->category_id = $payload['data']['id'];
    }

    public function test_show_category_returns_resource(): void
    {
        $this->category_id = $this->create_category()['id'];

        $response = $this->request('GET', 'categories/' . $this->category_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->category_id, $payload['data']['id']);
        $this->assertEquals('Test Category', $payload['data']['name']);
    }

    public function test_update_category_changes_fields(): void
    {
        $this->category_id = $this->create_category()['id'];

        $response = $this->request('PUT', 'categories/' . $this->category_id, [
            'id' => $this->category_id,
            'name' => 'Updated Category',
            'slug' => 'updated-category',
            'description' => 'Updated description',
            'is_active' => false,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated Category', $payload['data']['name']);
        $this->assertEquals('updated-category', $payload['data']['slug']);
        $this->assertFalse($payload['data']['is_active']);
    }

    public function test_delete_category_removes_record(): void
    {
        $this->category_id = $this->create_category()['id'];

        $response = $this->request('DELETE', 'categories/' . $this->category_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    public function test_show_deleted_category_returns_404(): void
    {
        $this->category_id = $this->create_category()['id'];
        $this->request('DELETE', 'categories/' . $this->category_id);

        $response = $this->request('GET', 'categories/' . $this->category_id);
        $this->assert_api_error($response, 404);
    }

    public function test_create_category_validation_fails_without_name(): void
    {
        $response = $this->request('POST', 'categories', [
            'slug' => 'no-name-category',
        ]);

        $this->assert_validation_error($response);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->logout();

        $response = $this->request('GET', 'categories');
        $this->assert_api_error($response, 401);
    }

    public function test_list_categories_returns_paginated_results(): void
    {
        $this->create_category(['name' => 'Category Alpha', 'slug' => 'category-alpha']);
        $this->create_category(['name' => 'Category Beta', 'slug' => 'category-beta']);

        $response = $this->request('GET', 'categories', [
            'page' => 1,
            'limit' => 10,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertArrayHasKey('results', $payload['data']);
        $this->assertArrayHasKey('total', $payload['data']);
        $this->assertGreaterThanOrEqual(2, $payload['data']['total']);
        $this->assertNotEmpty($payload['data']['results']);
    }

    public function test_bulk_action_on_categories(): void
    {
        $first = $this->create_category(['name' => 'Bulk One', 'slug' => 'bulk-one']);
        $second = $this->create_category(['name' => 'Bulk Two', 'slug' => 'bulk-two']);

        $response = $this->request('POST', 'categories/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$first['id'], $second['id']],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $check = $this->request('GET', 'categories/' . $first['id']);
        $this->assert_api_error($check, 404);
    }

    private function create_category(array $overrides = []): array
    {
        $response = $this->request('POST', 'categories', array_merge([
            'name' => 'Test Category',
            'slug' => 'test-category-' . wp_generate_password(6, false),
            'description' => 'Test description',
        ], $overrides));

        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }
}
