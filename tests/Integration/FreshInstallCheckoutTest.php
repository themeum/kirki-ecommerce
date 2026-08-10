<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Install;
use Kirki\Ecommerce\App\Installer;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\ResetsSettingsState;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\App\base_currency;

class FreshInstallCheckoutTest extends RestTestCase
{
    use CreatesTestProducts;
    use ResetsSettingsState;

    /**
     * Variant id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $variant_id;

    /**
     * Model a store that was just activated and never onboarded.
     *
     * Nothing here configures the store beyond running the installer, so the
     * checkout below exercises the shipped defaults exactly as a merchant who
     * skipped onboarding would have them.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();

        Option::delete(Install::INSTALLED_VERSION);
        static::reset_settings_state();

        Installer::run();

        $product = $this->create_product();
        $this->variant_id = $this->default_variant_id($product);
    }

    /**
     * Leave no install or settings state behind for the next test class.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        Option::delete(Install::INSTALLED_VERSION);
        static::reset_settings_state();
        parent::tearDown();
    }

    /**
     * Checkout without a currency code falls back to the installed base.
     *
     * Guards the fatal a fresh install used to hit: an empty currencies table
     * made base_currency() null, and Site\CheckoutController dereferences
     * base_currency()->code whenever the request carries no currency.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_checkout_without_a_currency_code_uses_the_base_currency(): void
    {
        $response = $this->request('POST', 'checkout', $this->checkout_payload());

        $this->assertSame(
            201,
            $response->get_status(),
            'Checkout failed: ' . wp_json_encode($response->get_data())
        );

        $payload = $this->assert_api_success($response, 201);

        $this->assertNotEmpty($payload['data']['order_number']);
    }

    /**
     * Onboarding can still switch the base currency after an install.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_onboarding_switches_the_base_currency_after_install(): void
    {
        $response = $this->request('POST', 'onboarding', [
            'store_name' => 'Test Store',
            'industry' => 'retail',
            'store_address' => [
                'address_line_1' => '123 Main St',
                'city' => 'Dhaka',
                'state' => '5665',
                'postal_code' => '1200',
                'country' => 'BD',
            ],
            'default_currency' => 'EUR',
            'should_import_samples' => false,
        ]);

        $this->assertSame(
            200,
            $response->get_status(),
            'Onboarding failed: ' . wp_json_encode($response->get_data())
        );

        $base = base_currency();

        $this->assertNotNull($base);
        $this->assertSame('EUR', $base->code);
    }

    /**
     * A checkout payload shipping to the default zone.
     *
     * @return array
     * @since 1.0.0
     */
    protected function checkout_payload(): array
    {
        return [
            'items' => [
                [
                    'variant_id' => $this->variant_id,
                    'quantity' => 1,
                ],
            ],
            'payment_provider' => 'cash-on-delivery',
            'shipping_method' => 'standard_delivery',
            'shipping_first_name' => 'John',
            'shipping_last_name' => 'Doe',
            'shipping_address_line1' => '123 Main St',
            'shipping_city' => 'Dhaka',
            'shipping_state' => '5665',
            'shipping_postcode' => '1200',
            'shipping_country' => 'BD',
            'billing_first_name' => 'John',
            'billing_last_name' => 'Doe',
            'billing_address_line1' => '123 Main St',
            'billing_city' => 'Dhaka',
            'billing_state' => '5665',
            'billing_postcode' => '1200',
            'billing_country' => 'BD',
        ];
    }
}
