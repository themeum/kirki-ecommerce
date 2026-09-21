<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\ShippingMethodTypes;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

/**
 * Server-side address validation follows each country's address rules rather
 * than demanding the same fields from everyone.
 */
class AddressFieldRulesApiTest extends RestTestCase
{
    use CreatesTestProducts;

    /**
     * @var mixed
     */
    protected $variant_id;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed_base_currency();
        $this->seed_shipping_to_every_country_under_test();

        $product = $this->create_product();
        $this->variant_id = $this->default_variant_id($product);
    }

    /**
     * Ship to every country these tests place an order for.
     *
     * `SeedsTestShipping` covers the US only, and an order to a country with
     * no shipping zone is rejected before validation is ever reached - which
     * would make an accepted order look like a rules failure.
     *
     * @return void
     */
    protected function seed_shipping_to_every_country_under_test(): void
    {
        $regions = [];

        foreach (['US', 'GB', 'AE', 'JP'] as $country) {
            $regions[] = ['country' => $country, 'states' => []];
        }

        $response = $this->request('PUT', 'settings', [
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
        ]);

        $this->assert_api_success($response);
        static::forget_singleton(ShippingService::class);
    }

    /**
     * @param array $overrides
     *
     * @return array
     */
    protected function address_payload(array $overrides = []): array
    {
        return array_merge([
            'type' => 'home',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'address_line1' => '123 Main St',
            'address_line2' => '',
            'city' => 'New York',
            'state' => 'NY',
            'postal_code' => '10001',
            'country' => 'US',
        ], $overrides);
    }

    /**
     * Log in as a fresh WordPress user with no existing Customer record.
     *
     * @return int
     */
    protected function login_as_new_customer(): int
    {
        $user_id = static::factory()->user->create(['role' => 'subscriber']);
        wp_set_current_user($user_id);

        return $user_id;
    }

    public function test_country_that_uses_a_subdivision_requires_one(): void
    {
        $this->login_as_new_customer();

        $payload = $this->address_payload(['country' => 'US']);
        unset($payload['state']);

        $this->assert_validation_error($this->request('POST', 'account/addresses', $payload));
    }

    /**
     * The bug: Great Britain has 247 council areas in the dataset, but a UK
     * address does not carry one. Demanding it blocked the customer.
     */
    public function test_country_that_does_not_use_a_subdivision_does_not_require_one(): void
    {
        $this->login_as_new_customer();

        $payload = $this->address_payload([
            'country' => 'GB',
            'city' => 'London',
            'postal_code' => 'SW1A 1AA',
        ]);
        unset($payload['state']);

        $this->assert_api_success($this->request('POST', 'account/addresses', $payload), 201);
    }

    public function test_country_without_postal_codes_does_not_require_one(): void
    {
        $this->login_as_new_customer();

        $payload = $this->address_payload([
            'country' => 'AE',
            'city' => 'Dubai',
            'state' => 'Dubai',
        ]);
        unset($payload['postal_code']);

        $this->assert_api_success($this->request('POST', 'account/addresses', $payload), 201);
    }

    public function test_country_with_postal_codes_still_requires_one(): void
    {
        $this->login_as_new_customer();

        $payload = $this->address_payload(['country' => 'US']);
        unset($payload['postal_code']);

        $this->assert_validation_error($this->request('POST', 'account/addresses', $payload));
    }

    /**
     * The API publishes the rules the same way the storefront does, so it hit
     * the same bug: it shipped the label's lookup key rather than the term a
     * customer should see - a lowercase "region" for Albania, "do_si" for
     * South Korea.
     */
    public function test_the_api_publishes_a_display_term_for_the_state_label(): void
    {
        $albania = $this->assert_api_success($this->request('GET', 'countries/AL'));
        $this->assertSame('Region', $albania['data']['address_rules']['state']['label']);

        $korea = $this->assert_api_success($this->request('GET', 'countries/KR'));
        $this->assertSame('Do / Si', $korea['data']['address_rules']['state']['label']);
    }

    /**
     * An address stored before the rules existed may hold a subdivision for a
     * country that no longer asks for one. It must remain valid.
     */
    public function test_a_subdivision_is_still_accepted_where_it_is_not_required(): void
    {
        $this->login_as_new_customer();

        $payload = $this->address_payload([
            'country' => 'GB',
            'city' => 'London',
            'state' => '1234',
            'postal_code' => 'SW1A 1AA',
        ]);

        $created = $this->assert_api_success($this->request('POST', 'account/addresses', $payload), 201);

        $this->assertSame('1234', (string) $created['data']['state']);
    }

    /**
     * Every country whose state field is hidden has no subdivisions at all, so
     * such a value can only arrive from an older row or a direct write. The
     * rules govern what a form asks for, not what storage keeps, so the value
     * must survive rather than be discarded.
     */
    public function test_a_stored_subdivision_survives_for_a_country_that_hides_the_field(): void
    {
        $this->login_as_new_customer();

        $payload = $this->address_payload([
            'country' => 'AX',
            'city' => 'Mariehamn',
            'state' => 'legacy-value',
            'postal_code' => '22100',
        ]);

        $created = $this->assert_api_success($this->request('POST', 'account/addresses', $payload), 201);

        $this->assertSame('legacy-value', (string) $created['data']['state']);

        $fetched = $this->assert_api_success(
            $this->request('GET', 'account/addresses/' . $created['data']['id'])
        );

        $this->assertSame('legacy-value', (string) $fetched['data']['state']);
    }

    /**
     * @param array $overrides
     *
     * @return array
     */
    protected function order_payload(array $overrides = []): array
    {
        return array_merge([
            'items' => [
                [
                    'variant_id' => $this->variant_id,
                    'quantity' => 1,
                ],
            ],
            'currency_code' => 'USD',
            'payment_provider' => 'paypal',
            'shipping_method' => 'method-0001',
            'is_manual' => true,
            'is_billing_same_as_shipping' => true,
            'shipping_first_name' => 'John',
            'shipping_last_name' => 'Doe',
            'shipping_address_line1' => '123 Main St',
            'shipping_city' => 'New York',
            'shipping_state' => 'NY',
            'shipping_postal_code' => '10001',
            'shipping_country' => 'US',
        ], $overrides);
    }

    /**
     * The reported bug: the storefront correctly stopped asking for a
     * subdivision the country does not use, but the order endpoint still
     * demanded one, so checkout failed with "The shipping_state field is
     * required." for every such country.
     */
    public function test_an_order_is_accepted_for_a_country_that_does_not_use_a_subdivision(): void
    {
        $payload = $this->order_payload([
            'shipping_city' => 'London',
            'shipping_postal_code' => 'SW1A 1AA',
            'shipping_country' => 'GB',
        ]);
        unset($payload['shipping_state']);

        $this->assert_api_success($this->request('POST', 'orders', $payload), 201);
    }

    public function test_an_order_still_requires_a_subdivision_where_the_country_uses_one(): void
    {
        $payload = $this->order_payload();
        unset($payload['shipping_state']);

        $this->assert_validation_error($this->request('POST', 'orders', $payload));
    }

    public function test_an_order_rejection_names_the_country_term_for_the_field(): void
    {
        $payload = $this->order_payload([
            'shipping_city' => 'Kyoto',
            'shipping_postal_code' => '604-8571',
            'shipping_country' => 'JP',
        ]);
        unset($payload['shipping_state']);

        $error = $this->assert_validation_error($this->request('POST', 'orders', $payload));

        $this->assertStringContainsString('Prefecture', $error['errors']['shipping_state'][0] ?? '');
    }

    public function test_an_order_is_accepted_for_a_country_without_postal_codes(): void
    {
        $payload = $this->order_payload([
            'shipping_city' => 'Dubai',
            'shipping_state' => 'Dubai',
            'shipping_country' => 'AE',
        ]);
        unset($payload['shipping_postal_code']);

        $this->assert_api_success($this->request('POST', 'orders', $payload), 201);
    }

    /**
     * A separate billing address answers to its own country's rules, not the
     * shipping country's.
     */
    public function test_a_separate_billing_address_follows_its_own_country(): void
    {
        $payload = $this->order_payload([
            'is_billing_same_as_shipping' => false,
            'billing_first_name' => 'John',
            'billing_last_name' => 'Doe',
            'billing_address_line1' => '10 Downing Street',
            'billing_city' => 'London',
            'billing_postal_code' => 'SW1A 2AA',
            'billing_country' => 'GB',
        ]);

        $this->assert_api_success($this->request('POST', 'orders', $payload), 201);

        $payload['billing_country'] = 'US';
        $payload['billing_city'] = 'New York';
        $payload['billing_postal_code'] = '10001';

        $this->assert_validation_error($this->request('POST', 'orders', $payload));
    }
}
