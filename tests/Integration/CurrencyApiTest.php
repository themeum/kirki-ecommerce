<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class CurrencyApiTest extends RestTestCase
{
    private $currency_id;

    public function test_create_currencies_returns_201(): void
    {
        $code = $this->unique_currency_code();

        $response = $this->request('POST', 'currencies', [
            'items' => [
                [
                    'code' => $code,
                    'name' => 'Test Dollar',
                    'symbol' => '$',
                    'exchange_rate' => 1.0,
                    'is_active' => true,
                    'is_base' => false,
                ],
            ],
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertIsArray($payload['data']);
        $this->assertEmpty($payload['data']);
    }

    public function test_show_currency_returns_resource(): void
    {
        $currency = $this->create_currency(['name' => 'Show Currency']);
        $this->currency_id = $currency['id'];

        $response = $this->request('GET', 'currencies/' . $this->currency_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->currency_id, $payload['data']['id']);
        $this->assertEquals('Show Currency', $payload['data']['name']);
        $this->assertEquals($currency['code'], $payload['data']['code']);
    }

    public function test_update_currencies_changes_fields(): void
    {
        $currency = $this->create_currency();
        $this->currency_id = $currency['id'];

        $response = $this->request('PUT', 'currencies', [
            'items' => [
                [
                    'id' => $this->currency_id,
                    'code' => $currency['code'],
                    'name' => 'Updated Currency',
                    'symbol' => '€',
                    'exchange_rate' => 1.25,
                    'is_active' => true,
                    'is_base' => false,
                ],
            ],
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertNotEmpty($payload['data']);
        $this->assertEquals('Updated Currency', $payload['data'][0]['name']);
        $this->assertEquals('€', $payload['data'][0]['symbol']);
        $this->assertEquals(1.25, (float) $payload['data'][0]['exchange_rate']);
    }

    public function test_delete_currency_removes_record(): void
    {
        $this->currency_id = $this->create_currency()['id'];

        $response = $this->request('DELETE', 'currencies/' . $this->currency_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    public function test_show_deleted_currency_returns_404(): void
    {
        $this->currency_id = $this->create_currency()['id'];
        $this->request('DELETE', 'currencies/' . $this->currency_id);

        $response = $this->request('GET', 'currencies/' . $this->currency_id);
        $this->assert_api_error($response, 404);
    }

    public function test_create_currency_validation_fails_without_items(): void
    {
        $response = $this->request('POST', 'currencies', []);

        $this->assert_validation_error($response);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->logout();

        $response = $this->request('GET', 'currencies');
        $this->assert_api_error($response, 401);
    }

    public function test_list_currencies_returns_paginated_results(): void
    {
        $this->create_currency(['name' => 'Currency Alpha']);
        $this->create_currency(['name' => 'Currency Beta']);

        $response = $this->request('GET', 'currencies', [
            'page' => 1,
            'limit' => 10,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertArrayHasKey('results', $payload['data']);
        $this->assertArrayHasKey('total', $payload['data']);
        $this->assertGreaterThanOrEqual(2, $payload['data']['total']);
        $this->assertNotEmpty($payload['data']['results']);
    }

    public function test_list_available_currencies_returns_collection(): void
    {
        $response = $this->request('GET', 'currencies/list');
        $payload = $this->assert_api_success($response);

        $this->assertIsArray($payload['data']);
        $this->assertNotEmpty($payload['data']);
        $this->assertArrayHasKey('code', $payload['data'][0]);
        $this->assertArrayHasKey('name', $payload['data'][0]);
        $this->assertArrayHasKey('symbol', $payload['data'][0]);
    }

    public function test_bulk_action_on_currencies(): void
    {
        $first = $this->create_currency(['name' => 'Bulk One']);
        $second = $this->create_currency(['name' => 'Bulk Two']);

        $response = $this->request('POST', 'currencies/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$first['id'], $second['id']],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $check = $this->request('GET', 'currencies/' . $first['id']);
        $this->assert_api_error($check, 404);
    }

    private function create_currency(array $overrides = []): array
    {
        $code = $overrides['code'] ?? $this->unique_currency_code();

        $response = $this->request('POST', 'currencies', [
            'items' => [
                array_merge([
                    'code' => $code,
                    'name' => 'Test Currency',
                    'symbol' => '$',
                    'exchange_rate' => 1.0,
                    'is_active' => true,
                    'is_base' => false,
                ], $overrides),
            ],
        ]);

        $this->assert_api_success($response, 201);

        $list = $this->request('GET', 'currencies', [
            'search' => $code,
            'limit' => 10,
        ]);
        $payload = $this->assert_api_success($list);

        foreach ($payload['data']['results'] as $currency) {
            if ($currency['code'] === $code) {
                return $currency;
            }
        }

        $this->fail('Currency not found after create');
    }

    private function unique_currency_code(): string
    {
        return 'T' . strtoupper(substr(wp_generate_password(4, false), 0, 2));
    }
}
