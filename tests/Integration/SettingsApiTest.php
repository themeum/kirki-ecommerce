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
}
