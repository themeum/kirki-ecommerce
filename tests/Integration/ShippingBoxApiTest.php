<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class ShippingBoxApiTest extends RestTestCase
{
    private $shipping_box_id;

    public function test_create_shipping_box_returns_201_and_persists(): void
    {
        $response = $this->request('POST', 'shipping-boxes', $this->shipping_box_payload([
            'name' => 'Medium Box',
        ]));

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('Medium Box', $payload['data']['name']);

        $this->shipping_box_id = $payload['data']['id'];
    }

    public function test_show_shipping_box_returns_resource(): void
    {
        $box = $this->create_shipping_box(['name' => 'Show Box']);
        $this->shipping_box_id = $box['id'];

        $response = $this->request('GET', 'shipping-boxes/' . $this->shipping_box_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->shipping_box_id, $payload['data']['id']);
        $this->assertEquals('Show Box', $payload['data']['name']);
    }

    public function test_update_shipping_box_changes_fields(): void
    {
        $box = $this->create_shipping_box();
        $this->shipping_box_id = $box['id'];

        $response = $this->request('PUT', 'shipping-boxes/' . $this->shipping_box_id, array_merge(
            $this->shipping_box_payload(),
            [
                'id' => $this->shipping_box_id,
                'name' => 'Updated Box',
                'description' => 'Updated description',
                'is_default' => true,
            ]
        ));

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated Box', $payload['data']['name']);
    }

    public function test_delete_shipping_box_removes_record(): void
    {
        $this->shipping_box_id = $this->create_shipping_box()['id'];

        $response = $this->request('DELETE', 'shipping-boxes/' . $this->shipping_box_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    public function test_show_deleted_shipping_box_returns_404(): void
    {
        $this->shipping_box_id = $this->create_shipping_box()['id'];
        $this->request('DELETE', 'shipping-boxes/' . $this->shipping_box_id);

        $response = $this->request('GET', 'shipping-boxes/' . $this->shipping_box_id);
        $this->assert_api_error($response, 404);
    }

    public function test_create_shipping_box_validation_fails_without_name(): void
    {
        $response = $this->request('POST', 'shipping-boxes', $this->shipping_box_payload([
            'name' => '',
        ]));

        $this->assert_validation_error($response);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->logout();

        $response = $this->request('GET', 'shipping-boxes');
        $this->assert_api_error($response, 401);
    }

    public function test_list_shipping_boxes_returns_paginated_results(): void
    {
        $this->create_shipping_box(['name' => 'Box Alpha']);
        $this->create_shipping_box(['name' => 'Box Beta']);

        $response = $this->request('GET', 'shipping-boxes', [
            'page' => 1,
            'limit' => 10,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertArrayHasKey('results', $payload['data']);
        $this->assertGreaterThanOrEqual(2, $payload['data']['total']);
    }

    public function test_bulk_action_on_shipping_boxes(): void
    {
        $first = $this->create_shipping_box(['name' => 'Bulk One']);
        $second = $this->create_shipping_box(['name' => 'Bulk Two']);

        $response = $this->request('POST', 'shipping-boxes/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$first['id'], $second['id']],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $check = $this->request('GET', 'shipping-boxes/' . $first['id']);
        $this->assert_api_error($check, 404);
    }

    private function create_shipping_box(array $overrides = []): array
    {
        $response = $this->request('POST', 'shipping-boxes', $this->shipping_box_payload($overrides));
        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }

    private function shipping_box_payload(array $overrides = []): array
    {
        $payload = [
            'name' => 'Test Box',
            'description' => 'Standard shipping box',
            'width' => 10.5,
            'height' => 8.0,
            'length' => 12.0,
            'unit' => 'cm',
            'is_default' => false,
        ];

        return array_merge($payload, $overrides);
    }
}
