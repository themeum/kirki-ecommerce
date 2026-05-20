<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class AttributeApiTest extends RestTestCase
{
    private $attribute_id;

    public function test_create_attribute_returns_201_and_persists(): void
    {
        $response = $this->request('POST', 'attributes', [
            'name' => 'Color',
            'slug' => 'color',
            'type' => 'color',
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('Color', $payload['data']['name']);
        $this->assertEquals('color', $payload['data']['slug']);
        $this->assertEquals('color', $payload['data']['type']);

        $this->attribute_id = $payload['data']['id'];
    }

    public function test_show_attribute_returns_resource(): void
    {
        $attribute = $this->create_attribute([
            'name' => 'Show Attribute',
            'slug' => 'show-attribute',
        ]);
        $this->attribute_id = $attribute['id'];

        $response = $this->request('GET', 'attributes/' . $this->attribute_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->attribute_id, $payload['data']['id']);
        $this->assertEquals('Show Attribute', $payload['data']['name']);
    }

    public function test_update_attribute_changes_fields(): void
    {
        $this->attribute_id = $this->create_attribute()['id'];

        $response = $this->request('PUT', 'attributes/' . $this->attribute_id, [
            'id' => $this->attribute_id,
            'name' => 'Updated Attribute',
            'slug' => 'updated-attribute',
            'type' => 'list',
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated Attribute', $payload['data']['name']);
        $this->assertEquals('updated-attribute', $payload['data']['slug']);
        $this->assertEquals('list', $payload['data']['type']);
    }

    public function test_delete_attribute_removes_record(): void
    {
        $this->attribute_id = $this->create_attribute()['id'];

        $response = $this->request('DELETE', 'attributes/' . $this->attribute_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    public function test_show_deleted_attribute_returns_404(): void
    {
        $this->attribute_id = $this->create_attribute()['id'];
        $this->request('DELETE', 'attributes/' . $this->attribute_id);

        $response = $this->request('GET', 'attributes/' . $this->attribute_id);
        $this->assert_api_error($response, 404);
    }

    public function test_create_attribute_validation_fails_without_name(): void
    {
        $response = $this->request('POST', 'attributes', [
            'slug' => 'no-name-attribute',
        ]);

        $this->assert_validation_error($response);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->logout();

        $response = $this->request('GET', 'attributes');
        $this->assert_api_error($response, 401);
    }

    public function test_list_attributes_returns_paginated_results(): void
    {
        $this->create_attribute(['name' => 'Attribute Alpha', 'slug' => 'attribute-alpha']);
        $this->create_attribute(['name' => 'Attribute Beta', 'slug' => 'attribute-beta']);

        $response = $this->request('GET', 'attributes', [
            'page' => 1,
            'limit' => 10,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertArrayHasKey('results', $payload['data']);
        $this->assertArrayHasKey('total', $payload['data']);
        $this->assertGreaterThanOrEqual(2, $payload['data']['total']);
        $this->assertNotEmpty($payload['data']['results']);
    }

    public function test_bulk_action_on_attributes(): void
    {
        $first = $this->create_attribute(['name' => 'Bulk One', 'slug' => 'bulk-one']);
        $second = $this->create_attribute(['name' => 'Bulk Two', 'slug' => 'bulk-two']);

        $response = $this->request('POST', 'attributes/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$first['id'], $second['id']],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $check = $this->request('GET', 'attributes/' . $first['id']);
        $this->assert_api_error($check, 404);
    }

    private function create_attribute(array $overrides = []): array
    {
        $response = $this->request('POST', 'attributes', array_merge([
            'name' => 'Test Attribute ' . wp_generate_password(6, false),
            'slug' => 'test-attribute-' . wp_generate_password(6, false),
            'type' => 'list',
        ], $overrides));

        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }
}
