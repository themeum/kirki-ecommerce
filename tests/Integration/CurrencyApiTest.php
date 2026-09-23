<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class CurrencyApiTest extends RestTestCase
{
    /**
     * Counter that makes every generated currency code unique.
     *
     * @var int
     * @since 1.0.0
     */
    protected static $currency_code_sequence = 0;

    /**
     * Currency id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $currency_id;

    /**
     * Create currencies returns 201.
     *
     * @return void
     * @since 1.0.0
     */
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

    /**
     * Show currency returns resource.
     *
     * @return void
     * @since 1.0.0
     */
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

    /**
     * Update currencies changes fields.
     *
     * @return void
     * @since 1.0.0
     */
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

    /**
     * Update currencies returns 422 when every item fails.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_currencies_all_failing_returns_422(): void
    {
        $response = $this->request('PUT', 'currencies', [
            'items' => [
                [
                    'id' => 999999,
                    'code' => 'ZZZ',
                    'name' => 'Missing Currency',
                    'symbol' => '$',
                    'exchange_rate' => 1.0,
                    'is_active' => true,
                    'is_base' => false,
                ],
            ],
        ]);

        $payload = $this->assert_api_error($response, 422);
        $this->assertArrayHasKey('errors', $payload);
        $this->assertNotEmpty($payload['errors']);
    }

    /**
     * Delete currency removes record.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_currency_removes_record(): void
    {
        $this->currency_id = $this->create_currency()['id'];

        $response = $this->request('DELETE', 'currencies/' . $this->currency_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    /**
     * Show deleted currency returns 404.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_deleted_currency_returns_404(): void
    {
        $this->currency_id = $this->create_currency()['id'];
        $this->request('DELETE', 'currencies/' . $this->currency_id);

        $response = $this->request('GET', 'currencies/' . $this->currency_id);
        $this->assert_api_error($response, 404);
    }

    /**
     * Create currency validation fails without items.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_currency_validation_fails_without_items(): void
    {
        $response = $this->request('POST', 'currencies', []);

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

        $response = $this->request('GET', 'currencies');
        $this->assert_api_error($response, 401);
    }

    /**
     * List currencies returns paginated results.
     *
     * @return void
     * @since 1.0.0
     */
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

    /**
     * List available currencies returns collection.
     *
     * @return void
     * @since 1.0.0
     */
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

    /**
     * Bulk action on currencies.
     *
     * @return void
     * @since 1.0.0
     */
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

    /**
     * Setting a new base with a single-row request demotes the previous base.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_single_row_request_setting_new_base_leaves_exactly_one_base(): void
    {
        $old_base = $this->create_currency(['name' => 'Old Base', 'is_base' => true]);
        $new_base = $this->create_currency(['name' => 'New Base']);

        $response = $this->request('PUT', 'currencies', [
            'items' => [$this->currency_row($new_base, true)],
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayNotHasKey('errors', $payload);
        $this->assertSame([$new_base['id']], $this->base_currency_ids());
        $this->assertNotContains($old_base['id'], $this->base_currency_ids());
    }

    /**
     * A whole-list request sending the old base before the new base leaves one base.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_whole_list_request_with_old_base_first_leaves_exactly_one_base(): void
    {
        $old_base = $this->create_currency(['name' => 'Old Base', 'is_base' => true]);
        $new_base = $this->create_currency(['name' => 'New Base']);

        $response = $this->request('PUT', 'currencies', [
            'items' => [
                $this->currency_row($old_base, false),
                $this->currency_row($new_base, true),
            ],
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayNotHasKey('errors', $payload);
        $this->assertSame([$new_base['id']], $this->base_currency_ids());
    }

    /**
     * A whole-list request sending the new base before the old base leaves one base.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_whole_list_request_with_new_base_first_leaves_exactly_one_base(): void
    {
        $old_base = $this->create_currency(['name' => 'Old Base', 'is_base' => true]);
        $new_base = $this->create_currency(['name' => 'New Base']);

        $response = $this->request('PUT', 'currencies', [
            'items' => [
                $this->currency_row($new_base, true),
                $this->currency_row($old_base, false),
            ],
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayNotHasKey('errors', $payload);
        $this->assertSame([$new_base['id']], $this->base_currency_ids());
    }

    /**
     * Clearing the flag on the only base keeps it as the base.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_clearing_the_only_base_keeps_it_as_base(): void
    {
        $base = $this->create_currency(['name' => 'Only Base', 'is_base' => true]);

        $response = $this->request('PUT', 'currencies', [
            'items' => [array_merge($this->currency_row($base, false), ['name' => 'Renamed Base'])],
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertTrue($payload['data'][0]['is_base']);
        $this->assertEquals('Renamed Base', $payload['data'][0]['name']);
        $this->assertSame([$base['id']], $this->base_currency_ids());
    }

    /**
     * Creating a currency as base demotes the previous base.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_creating_a_currency_as_base_leaves_exactly_one_base(): void
    {
        $old_base = $this->create_currency(['name' => 'Old Base', 'is_base' => true]);
        $this->assertSame([$old_base['id']], $this->base_currency_ids());

        $new_base = $this->create_currency(['name' => 'New Base', 'is_base' => true]);

        $this->assertSame([$new_base['id']], $this->base_currency_ids());
    }

    /**
     * Creating two base currencies in one request is rejected and inserts nothing.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_creating_two_base_currencies_in_one_request_is_rejected(): void
    {
        $existing_base = $this->create_currency(['name' => 'Existing Base', 'is_base' => true]);
        $first_code = $this->unique_currency_code();
        $second_code = $this->unique_currency_code();

        $response = $this->request('POST', 'currencies', [
            'items' => [
                ['code' => $first_code, 'name' => 'First', 'symbol' => '$', 'exchange_rate' => 1.0, 'is_active' => true, 'is_base' => true],
                ['code' => $second_code, 'name' => 'Second', 'symbol' => '$', 'exchange_rate' => 1.0, 'is_active' => true, 'is_base' => true],
            ],
        ]);

        $this->assert_validation_error($response);
        $this->assertSame([$existing_base['id']], $this->base_currency_ids());

        foreach ([$first_code, $second_code] as $code) {
            $list = $this->assert_api_success($this->request('GET', 'currencies', ['search' => $code]));
            $this->assertCount(0, $list['data']['results']);
        }
    }

    /**
     * Create currency.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_currency(array $overrides = []): array
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

    /**
     * Build an update item for a currency from its listed representation.
     *
     * @param array $currency Currency as returned by the API.
     * @param bool  $is_base  Base flag to send.
     *
     * @return array
     * @since 1.0.0
     */
    protected function currency_row(array $currency, bool $is_base): array
    {
        return [
            'id' => $currency['id'],
            'code' => $currency['code'],
            'name' => $currency['name'],
            'symbol' => $currency['symbol'],
            'exchange_rate' => (float) $currency['exchange_rate'],
            'is_active' => true,
            'is_base' => $is_base,
        ];
    }

    /**
     * IDs of the currencies currently flagged as base.
     *
     * @return int[]
     * @since 1.0.0
     */
    protected function base_currency_ids(): array
    {
        $response = $this->request('GET', 'currencies', ['limit' => 50]);
        $payload = $this->assert_api_success($response);

        $ids = [];

        foreach ($payload['data']['results'] as $currency) {
            if ($currency['is_base']) {
                $ids[] = $currency['id'];
            }
        }

        return $ids;
    }

    /**
     * Unique currency code.
     *
     * @return string
     * @since 1.0.0
     */
    protected function unique_currency_code(): string
    {
        static::$currency_code_sequence++;

        return 'T' . strtoupper(base_convert((string) static::$currency_code_sequence, 10, 36));
    }
}
