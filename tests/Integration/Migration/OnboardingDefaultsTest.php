<?php

namespace Kirki\Ecommerce\Tests\Integration\Migration;

use Kirki\Ecommerce\Tests\Support\RestTestCase;

/**
 * Covers the onboarding defaults that are read from WooCommerce.
 */
class OnboardingDefaultsTest extends RestTestCase
{
    /** The options that the tests set. */
    protected const OPTIONS = ['woocommerce_version', 'woocommerce_currency', 'woocommerce_default_country', 'woocommerce_store_address', 'woocommerce_store_address_2', 'woocommerce_store_city', 'woocommerce_store_postcode', 'woocommerce_calc_taxes', 'woocommerce_prices_include_tax', 'woocommerce_onboarding_profile'];

    /**
     * Start without WooCommerce options.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->delete_options();
    }

    /**
     * Remove the options that the test set.
     *
     * @return void
     */
    protected function tearDown(): void
    {
        $this->delete_options();

        parent::tearDown();
    }

    /**
     * Without WooCommerce the source is null and no value returns.
     *
     * @return void
     */
    public function test_no_woocommerce_returns_no_source()
    {
        $data = $this->defaults();

        $this->assertNull($data['source']);
        $this->assertEmpty($data['values']);
    }

    /**
     * A version below the minimum returns no source.
     *
     * @return void
     */
    public function test_unsupported_version_returns_no_source()
    {
        update_option('woocommerce_version', '6.9.0');

        $this->assertNull($this->defaults()['source']);
    }

    /**
     * A supported store returns each fact, and the state of the country is dropped.
     *
     * @return void
     */
    public function test_supported_store_returns_the_values()
    {
        update_option('woocommerce_version', '8.4.0');
        update_option('woocommerce_currency', 'eur');
        update_option('woocommerce_default_country', 'US:CA');
        update_option('woocommerce_store_address', '1 Shop Way');
        update_option('woocommerce_store_city', 'Woo City');
        update_option('woocommerce_store_postcode', '12345');
        update_option('woocommerce_calc_taxes', 'yes');
        update_option('woocommerce_prices_include_tax', 'yes');
        update_option('woocommerce_onboarding_profile', ['industry' => [['slug' => 'health-beauty']]]);

        $data = $this->defaults();

        $this->assertSame('woocommerce', $data['source']);
        $this->assertSame('EUR', $data['values']['currency']);
        $this->assertSame('US', $data['values']['country']);
        $this->assertSame('1 Shop Way', $data['values']['store_address']['address_line_1']);
        $this->assertSame('Woo City', $data['values']['store_address']['city']);
        $this->assertSame('beauty-cosmetics-and-personal-care', $data['values']['industry']);
        $this->assertTrue($data['values']['is_tax_collected']);
        $this->assertTrue($data['values']['is_tax_inclusive_price']);
    }

    /**
     * Facts that WooCommerce does not have are left out.
     *
     * @return void
     */
    public function test_missing_country_and_unknown_industry_are_left_out()
    {
        update_option('woocommerce_version', '8.4.0');
        update_option('woocommerce_store_address', '1 Shop Way');
        update_option('woocommerce_onboarding_profile', ['industry' => ['unknown-industry']]);

        $values = $this->defaults()['values'];

        $this->assertArrayNotHasKey('country', $values);
        $this->assertArrayNotHasKey('store_address', $values);
        $this->assertArrayNotHasKey('industry', $values);
        $this->assertArrayNotHasKey('is_tax_collected', $values);
    }

    /**
     * Request the defaults and return the data as an array.
     *
     * @return array<string, mixed>
     */
    protected function defaults()
    {
        $body = json_decode(wp_json_encode($this->request('GET', 'onboarding/defaults')->get_data()), true);

        return $body['data'];
    }

    /**
     * Delete the WooCommerce options.
     *
     * @return void
     */
    protected function delete_options()
    {
        foreach (static::OPTIONS as $option) {
            delete_option($option);
        }
    }
}
