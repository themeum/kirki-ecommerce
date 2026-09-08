<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class SettingsApiTest extends RestTestCase
{
    /**
     * Get product settings returns resource.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_get_product_settings_returns_resource(): void
    {
        $response = $this->request('GET', 'settings/' . OptionKeys::PRODUCT_SETTINGS);
        $payload = $this->assert_api_success($response);

        $this->assertArrayHasKey('weight_unit', $payload['data']);
        $this->assertArrayHasKey('dimension_unit', $payload['data']);
    }

    /**
     * Update product settings persists changes.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_product_settings_persists_changes(): void
    {
        $response = $this->request('PUT', 'settings', [
            'key' => OptionKeys::PRODUCT_SETTINGS,
            'data' => [
                'weight_unit' => 'kg',
                'dimension_unit' => 'cm',
                'is_enabled_reviews' => true,
                'is_enabled_star_ratings' => true,
                'is_unit_price_visible' => false,
                'low_stock_threshold' => 5,
            ],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals('kg', $payload['data']['weight_unit']);
        $this->assertEquals('cm', $payload['data']['dimension_unit']);
        $this->assertFalse($payload['data']['is_unit_price_visible']);
    }

    /**
     * Get settings with invalid key returns 422.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_get_settings_with_invalid_key_returns_422(): void
    {
        $response = $this->request('GET', 'settings/invalid-key');
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

        $response = $this->request('GET', 'settings/' . OptionKeys::PRODUCT_SETTINGS);
        $this->assert_api_error($response, 401);
    }

    /**
     * Base tax settings payload with a single tax region merged in.
     *
     * @param array $region The tax region to include.
     *
     * @return array
     * @since 1.0.0
     */
    protected function tax_settings_payload(array $region): array
    {
        return [
            'key' => OptionKeys::TAX_SETTINGS,
            'data' => [
                'is_tax_inclusive_price' => false,
                'is_shipping_tax_enabled' => true,
                'is_enabled_taxed_price' => false,
                'tax_regions' => [$region],
                'tax_services' => [],
                'tax_ids' => [],
            ],
        ];
    }

    /**
     * A non-numeric state rate is rejected with 422.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_tax_settings_non_numeric_state_rate_returns_422(): void
    {
        $response = $this->request('PUT', 'settings', $this->tax_settings_payload([
            'code' => 'BD',
            'is_enabled' => true,
            'type' => null,
            'is_central_tax_enabled' => false,
            'states' => [
                [
                    'id' => '771',
                    'name' => 'Dhaka District',
                    'product_tax_rate' => 'twenty',
                    'shipping_tax_rate' => 5,
                    'rules' => [],
                ],
            ],
            'rules' => [],
        ]));

        $data = $this->assert_validation_error($response);
        $this->assertStringContainsString('product_tax_rate', wp_json_encode($data['errors']));
    }

    /**
     * A new central region round-trips with an empty states array.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_tax_settings_central_region_round_trips(): void
    {
        $response = $this->request('PUT', 'settings', $this->tax_settings_payload([
            'code' => 'BD',
            'is_enabled' => true,
            'type' => null,
            'is_central_tax_enabled' => true,
            'central_product_tax' => 15,
            'central_shipping_tax' => 5,
            'states' => [],
            'rules' => [],
        ]));

        $payload = $this->assert_api_success($response);
        $region = $payload['data']['tax_regions'][0];
        $this->assertSame('BD', $region['code']);
        $this->assertSame([], $region['states']);
        $this->assertArrayNotHasKey('product_tax', $region);
    }

    /**
     * A per-state region round-trips keyed by state id, with its per-state rules.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_tax_settings_per_state_region_round_trips(): void
    {
        $response = $this->request('PUT', 'settings', $this->tax_settings_payload([
            'code' => 'BD',
            'is_enabled' => true,
            'type' => null,
            'is_central_tax_enabled' => false,
            'states' => [
                [
                    'id' => '771',
                    'name' => 'Dhaka District',
                    'product_tax_rate' => 20,
                    'shipping_tax_rate' => 5,
                    'rules' => [
                        [
                            'relation' => 'AND',
                            'conditions' => [
                                ['type' => 'tax_profile', 'operator' => '=', 'value' => 'digital'],
                            ],
                            'action' => ['type' => 'set_tax_rate', 'value' => 7],
                        ],
                    ],
                ],
                [
                    'id' => '785',
                    'name' => 'Chittagong District',
                    'product_tax_rate' => 21,
                    'shipping_tax_rate' => 6,
                    'rules' => [],
                ],
            ],
            'rules' => [],
        ]));

        $payload = $this->assert_api_success($response);
        $region = $payload['data']['tax_regions'][0];
        $this->assertCount(2, $region['states']);
        $this->assertSame('771', $region['states'][0]['id']);
        $this->assertSame(20.0, (float) $region['states'][0]['product_tax_rate']);
        $this->assertSame(5.0, (float) $region['states'][0]['shipping_tax_rate']);
        $this->assertCount(1, $region['states'][0]['rules']);
        $this->assertSame('set_tax_rate', $region['states'][0]['rules'][0]['action']['type']);
    }

    /**
     * Toggling a per-state region to central clears its states on save.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_tax_settings_central_toggle_clears_states(): void
    {
        $response = $this->request('PUT', 'settings', $this->tax_settings_payload([
            'code' => 'BD',
            'is_enabled' => true,
            'type' => null,
            'is_central_tax_enabled' => true,
            'central_product_tax' => 15,
            'central_shipping_tax' => 5,
            'states' => [
                [
                    'id' => '771',
                    'name' => 'Dhaka District',
                    'product_tax_rate' => 20,
                    'shipping_tax_rate' => 5,
                    'rules' => [],
                ],
            ],
            'rules' => [],
        ]));

        $payload = $this->assert_api_success($response);
        $this->assertSame([], $payload['data']['tax_regions'][0]['states']);
    }

    /**
     * A region's display name and flag round-trip alongside its code.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_tax_settings_region_name_and_flag_round_trip(): void
    {
        $response = $this->request('PUT', 'settings', $this->tax_settings_payload([
            'code' => 'BD',
            'name' => 'Bangladesh',
            'flag' => '🇧🇩',
            'is_enabled' => true,
            'type' => null,
            'is_central_tax_enabled' => true,
            'central_product_tax' => 15,
            'central_shipping_tax' => 5,
            'states' => [],
            'rules' => [],
        ]));

        $payload = $this->assert_api_success($response);
        $region = $payload['data']['tax_regions'][0];
        $this->assertSame('Bangladesh', $region['name']);
        $this->assertSame('🇧🇩', $region['flag']);
    }

    /**
     * The EU region round-trips its per-country single VAT rate keyed by
     * country code.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_tax_settings_eu_region_round_trips(): void
    {
        $response = $this->request('PUT', 'settings', $this->tax_settings_payload([
            'code' => 'EU',
            'name' => 'European Union',
            'flag' => '🇪🇺',
            'is_enabled' => true,
            'type' => 'oss',
            'countries' => [
                [
                    'code' => 'AT',
                    'name' => 'Austria',
                    'flag' => '🇦🇹',
                    'rate' => 20,
                ],
            ],
            'rules' => [],
        ]));

        $payload = $this->assert_api_success($response);
        $region = $payload['data']['tax_regions'][0];
        $this->assertSame('AT', $region['countries'][0]['code']);
        $this->assertSame(20.0, (float) $region['countries'][0]['rate']);
    }
}
