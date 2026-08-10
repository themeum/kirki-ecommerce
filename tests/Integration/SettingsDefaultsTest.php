<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Database\Seeders\CurrencySeeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Tests\Support\ResetsSettingsState;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class SettingsDefaultsTest extends RestTestCase
{
    use ResetsSettingsState;

    /**
     * Give the store the base currency the installer provisions.
     *
     * Any settings section carrying a money value is rendered through the
     * Money layer, which resolves the base currency, so these reads model a
     * post-activation store rather than an empty database.
     *
     * @return void
     * @since 1.0.0
     */
    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();
        (new CurrencySeeder())->run();
    }

    /**
     * Start each test with no stored settings option.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        static::reset_settings_state();
    }

    /**
     * Leave no cached settings behind for the next test class.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        static::reset_settings_state();
        parent::tearDown();
    }

    /**
     * Every section resolves to a complete payload with nothing stored.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_every_section_resolves_without_a_stored_option(): void
    {
        foreach (static::settings_keys() as $key) {
            $this->assertNull(Option::get($key), "Expected no stored option for [{$key}]");

            $response = $this->request('GET', 'settings/' . $key);

            $this->assertSame(
                200,
                $response->get_status(),
                "Expected [{$key}] to resolve, got: " . wp_json_encode($response->get_data())
            );

            $payload = $this->assert_api_success($response);

            $this->assertIsArray($payload['data'], "Expected [{$key}] to resolve to an array");
        }
    }

    /**
     * Tax collection is off and no region is enabled on a fresh install.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_tax_defaults_are_disabled(): void
    {
        $response = $this->request('GET', 'settings/' . OptionKeys::TAX_SETTINGS);
        $payload = $this->assert_api_success($response);

        $this->assertFalse($payload['data']['is_enabled_taxed_price']);
        $this->assertFalse($payload['data']['is_tax_inclusive_price']);
        $this->assertFalse($payload['data']['is_shipping_tax_enabled']);

        foreach ($payload['data']['tax_regions'] as $region) {
            $this->assertFalse($region['is_enabled'], "Expected region [{$region['code']}] to be disabled");
        }
    }

    /**
     * The shipped general defaults carry no placeholder contact address.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_general_defaults_have_no_placeholder_store_email(): void
    {
        $response = $this->request('GET', 'settings/' . OptionKeys::GENERAL_SETTINGS);
        $payload = $this->assert_api_success($response);

        $this->assertEmpty($payload['data']['store_email']);
    }

    /**
     * Advance settings always expose a complete storefront page map.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_advance_defaults_expose_an_empty_page_map(): void
    {
        $response = $this->request('GET', 'settings/' . OptionKeys::ADVANCE_SETTINGS);
        $payload = $this->assert_api_success($response);

        $this->assertArrayHasKey('pages', $payload['data']);

        foreach (['shop', 'cart', 'checkout', 'account'] as $view) {
            $this->assertArrayHasKey($view, $payload['data']['pages']);
            $this->assertNull($payload['data']['pages'][$view]);
        }
    }

    /**
     * Product settings no longer carry a page reference.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_product_settings_have_no_shop_page(): void
    {
        $response = $this->request('GET', 'settings/' . OptionKeys::PRODUCT_SETTINGS);
        $payload = $this->assert_api_success($response);

        $this->assertArrayNotHasKey('shop_page', $payload['data']);
    }

    /**
     * A shop page submitted to the product section is discarded.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_product_settings_update_discards_a_submitted_shop_page(): void
    {
        $response = $this->request('PUT', 'settings', [
            'key' => OptionKeys::PRODUCT_SETTINGS,
            'data' => [
                'shop_page' => 4242,
                'weight_unit' => 'kg',
                'dimension_unit' => 'cm',
                'is_enabled_reviews' => true,
                'is_enabled_star_ratings' => true,
                'is_unit_price_visible' => false,
            ],
        ]);

        $payload = $this->assert_api_success($response);

        $this->assertArrayNotHasKey('shop_page', $payload['data']);
        $this->assertSame('cm', $payload['data']['dimension_unit']);
        $this->assertFalse($payload['data']['is_unit_price_visible']);

        $this->assertArrayNotHasKey('shop_page', Option::get(OptionKeys::PRODUCT_SETTINGS));
    }
}
