<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class AttributeApiTest extends RestTestCase
{
    /**
     * Attribute id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $attribute_id;

    /**
     * Create attribute returns 201 and persists.
     *
     * @return void
     * @since 1.0.0
     */
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

    /**
     * Show attribute returns resource.
     *
     * @return void
     * @since 1.0.0
     */
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

    /**
     * Update attribute changes fields.
     *
     * @return void
     * @since 1.0.0
     */
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

    /**
     * Delete attribute removes record.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_attribute_removes_record(): void
    {
        $this->attribute_id = $this->create_attribute()['id'];

        $response = $this->request('DELETE', 'attributes/' . $this->attribute_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    /**
     * Show deleted attribute returns 404.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_deleted_attribute_returns_404(): void
    {
        $this->attribute_id = $this->create_attribute()['id'];
        $this->request('DELETE', 'attributes/' . $this->attribute_id);

        $response = $this->request('GET', 'attributes/' . $this->attribute_id);
        $this->assert_api_error($response, 404);
    }

    /**
     * Create attribute validation fails without name.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_attribute_validation_fails_without_name(): void
    {
        $response = $this->request('POST', 'attributes', [
            'slug' => 'no-name-attribute',
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

        $response = $this->request('GET', 'attributes');
        $this->assert_api_error($response, 401);
    }

    /**
     * List attributes returns paginated results.
     *
     * @return void
     * @since 1.0.0
     */
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

    /**
     * Bulk action on attributes.
     *
     * @return void
     * @since 1.0.0
     */
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

    /**
     * Create attribute with values persists both in one request.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_attribute_with_values_returns_values(): void
    {
        $response = $this->request('POST', 'attributes', [
            'name' => 'Fabric ' . wp_generate_password(6, false),
            'type' => 'list',
            'values' => [
                ['value' => 'Cotton'],
                ['value' => 'Linen', 'color' => '#faf0e6'],
            ],
        ]);

        $payload = $this->assert_api_success($response, 201);
        $values = array_column($payload['data']['values'], 'value');
        sort($values);

        $this->assertEquals(['Cotton', 'Linen'], $values);
        foreach ($payload['data']['values'] as $value) {
            $this->assertNotEmpty($value['id']);
        }
    }

    /**
     * Duplicate attribute name is rejected and creates no values.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_attribute_with_duplicate_name_creates_nothing(): void
    {
        $existing = $this->create_attribute(['name' => 'Duplicate Name Attribute']);

        $response = $this->request('POST', 'attributes', [
            'name' => $existing['name'],
            'values' => [['value' => 'Orphan Candidate']],
        ]);

        $this->assert_validation_error($response);
        $this->assertSame(0, $this->count_values_named('Orphan Candidate'));
    }

    /**
     * Repeated value names in the payload are rejected, ignoring case.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_attribute_with_duplicate_values_creates_nothing(): void
    {
        $name = 'Dup Values ' . wp_generate_password(6, false);

        $response = $this->request('POST', 'attributes', [
            'name' => $name,
            'values' => [['value' => 'Cotton'], ['value' => ' cotton ']],
        ]);

        $data = $this->assert_validation_error($response);
        $this->assertArrayHasKey('values', $data['errors']);
        $this->assertSame(0, $this->count_attributes_named($name));
    }

    /**
     * An invalid hex color is rejected and creates nothing.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_attribute_with_invalid_color_creates_nothing(): void
    {
        $name = 'Bad Color ' . wp_generate_password(6, false);

        $response = $this->request('POST', 'attributes', [
            'name' => $name,
            'type' => 'color',
            'values' => [['value' => 'Red', 'color' => 'red']],
        ]);

        $this->assert_validation_error($response);
        $this->assertSame(0, $this->count_attributes_named($name));
    }

    /**
     * Count attributes with the given name.
     *
     * @param string $name Attribute name.
     *
     * @return int
     * @since 1.0.0
     */
    protected function count_attributes_named(string $name): int
    {
        return \Kirki\Ecommerce\App\Models\Attribute::where('name', $name)->count();
    }

    /**
     * Count attribute values with the given name.
     *
     * @param string $value Value name.
     *
     * @return int
     * @since 1.0.0
     */
    protected function count_values_named(string $value): int
    {
        return \Kirki\Ecommerce\App\Models\AttributeValue::where('value', $value)->count();
    }

    /**
     * Create attribute.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_attribute(array $overrides = []): array
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
