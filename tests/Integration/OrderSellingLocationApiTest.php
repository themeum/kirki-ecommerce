<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\SellingLocationType;
use Kirki\Ecommerce\App\Constants\ShippingMethodTypes;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\EnablesPaymentProviders;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

/**
 * Orders are accepted only for shipping and billing countries the store sells to,
 * whether a shopper checks out, an admin creates a manual order, or an order is edited.
 */
class OrderSellingLocationApiTest extends RestTestCase
{
    use CreatesTestProducts;
    use EnablesPaymentProviders;

    /** @var int */
    protected $variant_id;

    /**
     * Start from a store that sells everywhere and ships to the US and Great Britain.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        CountryData::flush();
        $this->enable_payment_provider();
        $this->seed_base_currency();
        $this->seed_shipping_to(['US', 'GB']);
        $this->variant_id = $this->default_variant_id($this->create_product());
    }

    /**
     * Restore selling everywhere after the rollback, which does not undo a saved settings write, so the setting does not leak into later tests.
     *
     * @return void
     */
    protected function tearDown(): void
    {
        parent::tearDown();

        $this->login_as_admin();
        $this->set_selling_locations(SellingLocationType::ALL_COUNTRIES, []);
    }

    public function test_an_unsupported_shipping_country_is_rejected(): void
    {
        $this->set_selling_locations(SellingLocationType::SELECTED_COUNTRIES, ['GB']);

        $errors = $this->assert_validation_error($this->request('POST', 'orders', $this->order_payload()));

        $this->assertArrayHasKey('shipping_country', $errors['errors']);
    }

    public function test_a_supported_shipping_country_is_accepted(): void
    {
        $this->set_selling_locations(SellingLocationType::SELECTED_COUNTRIES, ['US']);

        $this->assert_api_success($this->request('POST', 'orders', $this->order_payload()), 201);
    }

    public function test_every_country_is_accepted_when_the_store_sells_everywhere(): void
    {
        $this->set_selling_locations(SellingLocationType::ALL_COUNTRIES, []);

        $this->assert_api_success($this->request('POST', 'orders', $this->order_payload()), 201);
    }

    public function test_an_excluded_country_is_rejected(): void
    {
        $this->set_selling_locations(SellingLocationType::EXCLUDED_COUNTRIES, ['US']);

        $errors = $this->assert_validation_error($this->request('POST', 'orders', $this->order_payload()));

        $this->assertArrayHasKey('shipping_country', $errors['errors']);
    }

    public function test_an_unsupported_separate_billing_country_is_rejected(): void
    {
        $this->set_selling_locations(SellingLocationType::SELECTED_COUNTRIES, ['US']);

        $errors = $this->assert_validation_error($this->request('POST', 'orders', $this->order_payload([
            'is_billing_same_as_shipping' => false,
            'billing_country' => 'GB',
            'billing_state' => '',
            'billing_city' => 'London',
            'billing_postal_code' => 'SW1A 1AA',
        ])));

        $this->assertArrayHasKey('billing_country', $errors['errors']);
        $this->assertArrayNotHasKey('shipping_country', $errors['errors']);
    }

    public function test_billing_the_same_as_shipping_passes_with_a_supported_shipping_country(): void
    {
        $this->set_selling_locations(SellingLocationType::SELECTED_COUNTRIES, ['US']);

        $this->assert_api_success($this->request('POST', 'orders', $this->order_payload([
            'is_billing_same_as_shipping' => true,
            'billing_country' => 'GB',
        ])), 201);
    }

    public function test_both_unsupported_countries_are_reported(): void
    {
        $this->set_selling_locations(SellingLocationType::SELECTED_COUNTRIES, ['JP']);

        $errors = $this->assert_validation_error($this->request('POST', 'orders', $this->order_payload([
            'is_billing_same_as_shipping' => false,
        ])));

        $this->assertArrayHasKey('shipping_country', $errors['errors']);
        $this->assertArrayHasKey('billing_country', $errors['errors']);
    }

    public function test_a_shopper_checkout_with_an_unsupported_country_is_rejected(): void
    {
        $this->set_selling_locations(SellingLocationType::SELECTED_COUNTRIES, ['GB']);
        $this->login_as_new_customer();

        $errors = $this->assert_validation_error($this->request('POST', 'checkout', $this->order_payload([
            'is_manual' => false,
            'billing_email' => 'shopper@example.com',
            'customer_email' => 'shopper@example.com',
        ])));

        $this->assertArrayHasKey('shipping_country', $errors['errors']);
    }

    public function test_an_edit_that_sets_an_unsupported_country_is_rejected(): void
    {
        $order = $this->create_order();
        $this->set_selling_locations(SellingLocationType::SELECTED_COUNTRIES, ['US']);

        $errors = $this->assert_validation_error($this->request('PUT', 'orders/' . $order['id'], $this->edit_payload($order, [
            'shipping_country' => 'GB',
            'shipping_state' => '',
            'shipping_city' => 'London',
            'shipping_postal_code' => 'SW1A 1AA',
        ])));

        $this->assertArrayHasKey('shipping_country', $errors['errors']);
        $this->assertSame('US', $this->stored_shipping_country($order));
    }

    public function test_an_unrelated_edit_is_rejected_when_the_stored_country_is_no_longer_sold(): void
    {
        $order = $this->create_order();
        $this->set_selling_locations(SellingLocationType::EXCLUDED_COUNTRIES, ['US']);

        $errors = $this->assert_validation_error($this->request('PUT', 'orders/' . $order['id'], $this->edit_payload($order, [
            'order_notes' => 'Only the note changed.',
        ])));

        $this->assertArrayHasKey('shipping_country', $errors['errors']);
        $this->assertArrayHasKey('billing_country', $errors['errors']);
    }

    public function test_an_edit_that_moves_the_order_to_a_selling_country_is_accepted(): void
    {
        $order = $this->create_order();
        $this->set_selling_locations(SellingLocationType::EXCLUDED_COUNTRIES, ['US']);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $this->edit_payload($order, [
            'shipping_country' => 'GB',
            'shipping_state' => '',
            'shipping_city' => 'London',
            'shipping_postal_code' => 'SW1A 1AA',
            'billing_country' => 'GB',
            'billing_state' => '',
            'billing_city' => 'London',
            'billing_postal_code' => 'SW1A 1AA',
        ])));

        $this->assertSame('GB', $this->stored_shipping_country($order));
    }

    /**
     * Save the selling location settings and drop the cached list.
     *
     * @param string   $type      A SellingLocationType value.
     * @param string[] $countries Country codes the type applies to.
     * @return void
     */
    protected function set_selling_locations(string $type, array $countries): void
    {
        $this->assert_api_success($this->request('PUT', 'settings', [
            'key' => OptionKeys::GENERAL_SETTINGS,
            'data' => [
                'store_name' => 'Kirki Ecommerce',
                'store_email' => 'store@example.com',
                'selling_location_type' => $type,
                'selling_countries' => $countries,
                'order_number' => ['prefix' => '', 'suffix' => ''],
                'invoice_number' => [
                    'prefix' => '',
                    'suffix' => '',
                    'sequence' => '000001',
                    'apply_year_prefix' => false,
                    'reset_sequence_every_year' => false,
                ],
            ],
        ]));

        CountryData::flush();
    }

    /**
     * Ship to the given countries with one flat-rate method.
     *
     * @param string[] $countries Country codes.
     * @return void
     */
    protected function seed_shipping_to(array $countries): void
    {
        $regions = array_map(function ($country) {
            return ['country' => $country, 'states' => []];
        }, $countries);

        $this->assert_api_success($this->request('PUT', 'settings', [
            'key' => OptionKeys::SHIPPING_SETTINGS,
            'data' => [
                'shipping_zones' => [
                    [
                        'id' => 'zone-test',
                        'is_enabled' => true,
                        'title' => 'Test Zone',
                        'regions' => $regions,
                        'shipping_methods' => [
                            [
                                'id' => 'method-0001',
                                'is_enabled' => true,
                                'name' => 'Standard Delivery',
                                'type' => ShippingMethodTypes::FLAT_RATE,
                                'base_amount' => 10,
                                'is_taxable' => false,
                                'description' => null,
                                'shipping_rules' => [],
                            ],
                        ],
                    ],
                ],
            ],
        ]));

        static::forget_singleton(ShippingService::class);
    }

    /**
     * Log in as a fresh WordPress user with no existing customer record.
     *
     * @return void
     */
    protected function login_as_new_customer(): void
    {
        wp_set_current_user(static::factory()->user->create(['role' => 'subscriber']));
    }

    /**
     * Read the shipping country saved on an order.
     *
     * @param array<string, mixed> $order Order response data.
     * @return string
     */
    protected function stored_shipping_country(array $order): string
    {
        return (string) \Kirki\Ecommerce\App\Models\Order::find($order['id'])->shipping_country;
    }

    /**
     * Create a manual order shipped to New York.
     *
     * @param array<string, mixed> $overrides Payload overrides.
     * @return array<string, mixed>
     */
    protected function create_order(array $overrides = []): array
    {
        return $this->assert_api_success($this->request('POST', 'orders', $this->order_payload($overrides)), 201)['data'];
    }

    /**
     * Build an edit payload that keeps every line of an order.
     *
     * @param array<string, mixed> $order     Order response data.
     * @param array<string, mixed> $overrides Payload overrides.
     * @return array<string, mixed>
     */
    protected function edit_payload(array $order, array $overrides = []): array
    {
        return $this->order_payload(array_merge([
            'items' => [['id' => (int) $order['items'][0]['id'], 'quantity' => 1]],
        ], $overrides));
    }

    /**
     * Build a manual order payload for the default product, shipped to New York.
     *
     * @param array<string, mixed> $overrides Payload overrides.
     * @return array<string, mixed>
     */
    protected function order_payload(array $overrides = []): array
    {
        return array_merge([
            'items' => [
                ['variant_id' => $this->variant_id, 'quantity' => 1],
            ],
            'currency_code' => 'USD',
            'payment_provider' => 'paypal',
            'shipping_method' => 'method-0001',
            'is_manual' => true,
            'customer_first_name' => 'John',
            'customer_last_name' => 'Doe',
            'customer_email' => 'buyer@example.com',
            'shipping_first_name' => 'John',
            'shipping_last_name' => 'Doe',
            'shipping_address_line1' => '123 Main St',
            'shipping_city' => 'New York',
            'shipping_state' => 'NY',
            'shipping_postal_code' => '10001',
            'shipping_country' => 'US',
            'billing_first_name' => 'John',
            'billing_last_name' => 'Doe',
            'billing_address_line1' => '123 Main St',
            'billing_city' => 'New York',
            'billing_state' => 'NY',
            'billing_postal_code' => '10001',
            'billing_country' => 'US',
        ], $overrides);
    }
}
