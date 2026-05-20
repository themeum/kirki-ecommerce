<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class AttributeValueApiTest extends RestTestCase
{
    private $attribute_id;
    private $value_id;

    public function test_create_attribute_value_returns_201_and_persists(): void
    {
        $this->attribute_id = $this->create_attribute()['id'];

        $response = $this->request('POST', 'attributes/' . $this->attribute_id . '/values', [
            'attribute_id' => $this->attribute_id,
            'value' => 'Red',
            'color' => '#ff0000',
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('Red', $payload['data']['value']);
        $this->assertEquals('#ff0000', $payload['data']['color']);

        $this->value_id = $payload['data']['id'];
    }

    public function test_show_attribute_value_returns_resource(): void
    {
        $value = $this->create_attribute_value();
        $this->attribute_id = $value['attribute_id'];
        $this->value_id = $value['id'];

        $response = $this->request('GET', 'attributes/' . $this->attribute_id . '/values/' . $this->value_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->value_id, $payload['data']['id']);
        $this->assertEquals('Test Value', $payload['data']['value']);
    }

    public function test_update_attribute_value_changes_fields(): void
    {
        $value = $this->create_attribute_value();
        $this->attribute_id = $value['attribute_id'];
        $this->value_id = $value['id'];

        $response = $this->request('PUT', 'attributes/' . $this->attribute_id . '/values/' . $this->value_id, [
            'id' => $this->value_id,
            'value' => 'Updated Value',
            'color' => '#00ff00',
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated Value', $payload['data']['value']);
        $this->assertEquals('#00ff00', $payload['data']['color']);
    }

    public function test_delete_attribute_value_removes_record(): void
    {
        $value = $this->create_attribute_value();
        $this->attribute_id = $value['attribute_id'];
        $this->value_id = $value['id'];

        $response = $this->request('DELETE', 'attributes/' . $this->attribute_id . '/values/' . $this->value_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    public function test_show_deleted_attribute_value_returns_404(): void
    {
        $value = $this->create_attribute_value();
        $this->attribute_id = $value['attribute_id'];
        $this->value_id = $value['id'];

        $this->request('DELETE', 'attributes/' . $this->attribute_id . '/values/' . $this->value_id);

        $response = $this->request('GET', 'attributes/' . $this->attribute_id . '/values/' . $this->value_id);
        $this->assert_api_error($response, 404);
    }

    public function test_create_attribute_value_validation_fails_without_value(): void
    {
        $this->attribute_id = $this->create_attribute()['id'];

        $response = $this->request('POST', 'attributes/' . $this->attribute_id . '/values', [
            'attribute_id' => $this->attribute_id,
        ]);

        $this->assert_validation_error($response);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->attribute_id = $this->create_attribute()['id'];
        $this->logout();

        $response = $this->request('GET', 'attributes/' . $this->attribute_id . '/values');
        $this->assert_api_error($response, 401);
    }

    public function test_list_attribute_values_returns_collection(): void
    {
        $attribute = $this->create_attribute();
        $this->attribute_id = $attribute['id'];

        $this->create_attribute_value(['value' => 'Value Alpha']);
        $this->create_attribute_value(['value' => 'Value Beta']);

        $response = $this->request('GET', 'attributes/' . $this->attribute_id . '/values');
        $payload = $this->assert_api_success($response);

        $this->assertIsArray($payload['data']);
        $this->assertGreaterThanOrEqual(2, count($payload['data']));
    }

    public function test_bulk_action_on_attribute_values(): void
    {
        $attribute = $this->create_attribute();
        $this->attribute_id = $attribute['id'];

        $first = $this->create_attribute_value(['value' => 'Bulk One']);
        $second = $this->create_attribute_value(['value' => 'Bulk Two']);

        $response = $this->request('POST', 'attributes/' . $this->attribute_id . '/values/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$first['id'], $second['id']],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $check = $this->request('GET', 'attributes/' . $this->attribute_id . '/values/' . $first['id']);
        $this->assert_api_error($check, 404);
    }

    private function create_attribute(array $overrides = []): array
    {
        $response = $this->request('POST', 'attributes', array_merge([
            'name' => 'Color ' . wp_generate_password(6, false),
            'slug' => 'color-' . wp_generate_password(6, false),
            'type' => 'color',
        ], $overrides));

        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }

    private function create_attribute_value(array $overrides = []): array
    {
        if (empty($this->attribute_id)) {
            $this->attribute_id = $this->create_attribute()['id'];
        }

        $response = $this->request('POST', 'attributes/' . $this->attribute_id . '/values', array_merge([
            'attribute_id' => $this->attribute_id,
            'value' => 'Test Value',
            'color' => '#000000',
        ], $overrides));

        $payload = $this->assert_api_success($response, 201);
        $data = $payload['data'];
        $data['attribute_id'] = $this->attribute_id;

        return $data;
    }
}
