<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestCurrency;

class SettingsApiTest extends RestTestCase
{
    use SeedsTestCurrency;

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
                'low_stock_threshold' => 5,
            ],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals('kg', $payload['data']['weight_unit']);
        $this->assertEquals('cm', $payload['data']['dimension_unit']);
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
     * Base general settings payload with sensible required defaults, so
     * tests can focus on the fields they override.
     *
     * @param array $overrides The general settings data to override.
     *
     * @return array
     * @since 1.0.0
     */
    protected function general_settings_payload(array $overrides = []): array
    {
        return [
            'key' => OptionKeys::GENERAL_SETTINGS,
            'data' => array_merge([
                'store_name' => 'Kirki Ecommerce',
                'store_email' => 'store@example.com',
                'store_address' => [
                    'address_line_1' => '123 Main St',
                    'city' => 'New York',
                    'state' => 'NY',
                    'postal_code' => '10001',
                    'country' => 'US',
                ],
                'selling_location_type' => 'all-countries',
                'selling_countries' => [],
                'order_number' => [
                    'prefix' => '',
                    'suffix' => '',
                ],
                'invoice_number' => [
                    'prefix' => '',
                    'suffix' => '',
                    'sequence' => '000001',
                    'apply_year_prefix' => false,
                    'reset_sequence_every_year' => false,
                ],
            ], $overrides),
        ];
    }

    /**
     * Update general settings persists the order_number and invoice_number
     * configuration.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_general_settings_persists_order_number_and_invoice_number_config(): void
    {
        $response = $this->request('PUT', 'settings', $this->general_settings_payload([
            'order_number' => [
                'prefix' => 'ORD-',
                'suffix' => '-X',
            ],
            'invoice_number' => [
                'prefix' => 'INV-',
                'suffix' => '-Y',
                'sequence' => '000050',
                'apply_year_prefix' => true,
                'reset_sequence_every_year' => true,
            ],
        ]));

        $payload = $this->assert_api_success($response);

        $this->assertSame('ORD-', $payload['data']['order_number']['prefix']);
        $this->assertSame('-X', $payload['data']['order_number']['suffix']);
        $this->assertSame('INV-', $payload['data']['invoice_number']['prefix']);
        $this->assertSame('000050', $payload['data']['invoice_number']['sequence']);
        $this->assertTrue($payload['data']['invoice_number']['apply_year_prefix']);
        $this->assertTrue($payload['data']['invoice_number']['reset_sequence_every_year']);
    }

    /**
     * A non-digit invoice number sequence is rejected with 422.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_general_settings_rejects_non_digit_invoice_sequence(): void
    {
        $response = $this->request('PUT', 'settings', $this->general_settings_payload([
            'invoice_number' => [
                'prefix' => '',
                'suffix' => '',
                'sequence' => '12a3',
                'apply_year_prefix' => false,
                'reset_sequence_every_year' => false,
            ],
        ]));

        $data = $this->assert_validation_error($response);
        $this->assertStringContainsString('sequence', wp_json_encode($data['errors']));
    }

    /**
     * A slash or backslash in an order/invoice number prefix or suffix is
     * rejected with 422.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_general_settings_rejects_slashes_in_number_affixes(): void
    {
        $response = $this->request('PUT', 'settings', $this->general_settings_payload([
            'order_number' => [
                'prefix' => 'ORD/',
                'suffix' => '',
            ],
            'invoice_number' => [
                'prefix' => '',
                'suffix' => 'INV\\',
                'sequence' => '000001',
                'apply_year_prefix' => false,
                'reset_sequence_every_year' => false,
            ],
        ]));

        $data = $this->assert_validation_error($response);
        $errors = wp_json_encode($data['errors']);
        $this->assertStringContainsString('order_number', $errors);
        $this->assertStringContainsString('invoice_number', $errors);
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
                'is_enabled_display_inclusive_taxed_price' => false,
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

    /**
     * Advanced settings persist the page-key to page-id assignments and the
     * resource echoes them back as a resolved list.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_advance_settings_persists_page_assignments(): void
    {
        $shop_page_id = static::factory()->post->create([
            'post_type' => 'page',
            'post_status' => 'publish',
            'post_title' => 'Storefront',
        ]);
        $cart_page_id = static::factory()->post->create([
            'post_type' => 'page',
            'post_status' => 'publish',
            'post_title' => 'Basket',
        ]);

        $response = $this->request('PUT', 'settings', [
            'key' => OptionKeys::ADVANCE_SETTINGS,
            'data' => [
                'pages' => [
                    'shop' => $shop_page_id,
                    'cart' => $cart_page_id,
                ],
            ],
        ]);

        $payload = $this->assert_api_success($response);
        $pages = array_column($payload['data']['pages'], null, 'key');

        $this->assertSame($shop_page_id, $pages['shop']['id']);
        $this->assertSame('active', $pages['shop']['status']);
        $this->assertSame($cart_page_id, $pages['cart']['id']);
        $this->assertNull($pages['checkout']['id']);
        $this->assertSame('not-found', $pages['checkout']['status']);
    }

    /**
     * A non-integer page assignment is rejected with 422.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_advance_settings_non_integer_page_returns_422(): void
    {
        $response = $this->request('PUT', 'settings', [
            'key' => OptionKeys::ADVANCE_SETTINGS,
            'data' => [
                'pages' => [
                    'shop' => 'not-a-page',
                ],
            ],
        ]);

        $data = $this->assert_validation_error($response);
        $this->assertStringContainsString('pages', wp_json_encode($data['errors']));
    }

    /**
     * Shipping method payload carrying every field the update rules require,
     * so tests can focus on the money fields.
     *
     * @param array $overrides
     *
     * @return array
     */
    protected function shipping_settings_payload(array $overrides = []): array
    {
        return [
            'key' => OptionKeys::SHIPPING_SETTINGS,
            'data' => [
                'shipping_zones' => [
                    [
                        'id' => 'zone-1',
                        'is_enabled' => true,
                        'title' => 'Zone 1',
                        'regions' => [
                            ['country' => 'BD', 'states' => []],
                        ],
                        'shipping_methods' => [
                            array_merge([
                                'id' => 'method-1',
                                'is_enabled' => true,
                                'name' => 'Rate by Weight',
                                'type' => 'weight',
                                'is_taxable' => false,
                                'base_amount' => 30,
                                'is_free_shipping_enabled' => false,
                                'base_free_shipping_min_amount' => 250,
                                'ranges' => [
                                    ['from' => 0, 'to' => 5, 'base_amount' => 15],
                                    ['from' => 5, 'to' => 10, 'base_amount' => 25],
                                ],
                            ], $overrides),
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * A weight method's amounts come back in major units, including the
     * method-level base_amount that sits alongside its ranges.
     *
     * @return void
     */
    public function test_update_shipping_settings_weight_method_amounts_round_trip(): void
    {
        $this->seed_base_currency();

        $response = $this->request('PUT', 'settings', $this->shipping_settings_payload());

        $payload = $this->assert_api_success($response);
        $method = $payload['data']['shipping_zones'][0]['shipping_methods'][0];

        $this->assertSame(30.0, (float) $method['base_amount']);
        $this->assertSame(250.0, (float) $method['base_free_shipping_min_amount']);
        $this->assertSame(15.0, (float) $method['ranges'][0]['base_amount']);
        $this->assertSame(25.0, (float) $method['ranges'][1]['base_amount']);
    }

    /**
     * Saving the settings the API just returned, unchanged, must not change
     * the stored amounts. Any money field converted to minor units on write
     * but not back on read is multiplied by 100 on every save until it
     * overflows the integer range and the request 500s.
     *
     * @return void
     */
    public function test_update_shipping_settings_amounts_are_stable_across_repeated_saves(): void
    {
        $this->seed_base_currency();

        $response = $this->request('PUT', 'settings', $this->shipping_settings_payload());
        $data = $this->assert_api_success($response)['data'];

        for ($save = 0; $save < 5; $save++) {
            $response = $this->request('PUT', 'settings', [
                'key' => OptionKeys::SHIPPING_SETTINGS,
                'data' => $data,
            ]);

            $data = $this->assert_api_success($response)['data'];
        }

        $method = $data['shipping_zones'][0]['shipping_methods'][0];

        $this->assertSame(30.0, (float) $method['base_amount']);
        $this->assertSame(250.0, (float) $method['base_free_shipping_min_amount']);
        $this->assertSame(15.0, (float) $method['ranges'][0]['base_amount']);

        $stored = Option::get(OptionKeys::SHIPPING_SETTINGS);
        $stored_method = $stored['shipping_zones'][0]['shipping_methods'][0];

        $this->assertSame(3000, (int) $stored_method['base_amount']);
        $this->assertSame(25000, (int) $stored_method['base_free_shipping_min_amount']);
        $this->assertSame(1500, (int) $stored_method['ranges'][0]['base_amount']);
    }

    /**
     * Free shipping is off and carries no minimum, which the client sends as
     * null. Reading it back must leave the empty value alone rather than
     * trying to convert it.
     *
     * @return void
     */
    public function test_update_shipping_settings_handles_an_empty_free_shipping_minimum(): void
    {
        $this->seed_base_currency();

        $response = $this->request('PUT', 'settings', $this->shipping_settings_payload([
            'is_free_shipping_enabled' => false,
            'base_free_shipping_min_amount' => null,
        ]));

        $payload = $this->assert_api_success($response);
        $method = $payload['data']['shipping_zones'][0]['shipping_methods'][0];

        $this->assertNull($method['base_free_shipping_min_amount']);
        $this->assertSame(30.0, (float) $method['base_amount']);
    }

    /**
     * Build a valid consent payload.
     *
     * @param array $overrides
     *
     * @return array
     */
    protected function make_consent(array $overrides = []): array
    {
        return array_merge([
            'id' => 'consent-1',
            'title' => 'Basic consents',
            'locations' => ['signup', 'checkout'],
            'message' => 'By continuing, you agree to our {privacy_policy}.',
            'method' => 'mandatory_checkbox',
            'is_enabled' => true,
        ], $overrides);
    }

    /**
     * Update legal settings round trips every consent field.
     *
     * Guards the sanitizer contract: only paths listed in the request's
     * filters() survive, so a field that gains a validation rule but no filter
     * entry is dropped silently on the way to storage. If this test starts
     * failing on a field, check its filter entry before anything else.
     *
     * @return void
     */
    public function test_update_legal_settings_round_trips(): void
    {
        $response = $this->request('PUT', 'settings', [
            'key' => OptionKeys::LEGAL_SETTINGS,
            'data' => [
                'consents' => [
                    $this->make_consent(),
                    $this->make_consent([
                        'id' => 'consent-2',
                        'title' => 'Marketing emails',
                        'locations' => ['checkout'],
                        'method' => 'optional_checkbox',
                        'is_enabled' => false,
                    ]),
                ],
            ],
        ]);

        $payload = $this->assert_api_success($response);
        $consents = $payload['data']['consents'];

        $this->assertCount(2, $consents);

        $this->assertSame('consent-1', $consents[0]['id']);
        $this->assertSame('Basic consents', $consents[0]['title']);
        $this->assertSame(['signup', 'checkout'], $consents[0]['locations']);
        $this->assertSame('By continuing, you agree to our {privacy_policy}.', $consents[0]['message']);
        $this->assertSame('mandatory_checkbox', $consents[0]['method']);
        $this->assertTrue($consents[0]['is_enabled']);

        $this->assertSame('consent-2', $consents[1]['id']);
        $this->assertSame(['checkout'], $consents[1]['locations']);
        $this->assertSame('optional_checkbox', $consents[1]['method']);
        $this->assertFalse($consents[1]['is_enabled']);
    }

    /**
     * Update legal settings replaces the whole consent array.
     *
     * The settings blob merges shallowly, so a write of the full list is the
     * only way to remove an entry.
     *
     * @return void
     */
    public function test_update_legal_settings_replaces_the_whole_array(): void
    {
        $this->request('PUT', 'settings', [
            'key' => OptionKeys::LEGAL_SETTINGS,
            'data' => [
                'consents' => [
                    $this->make_consent(),
                    $this->make_consent(['id' => 'consent-2']),
                ],
            ],
        ]);

        $response = $this->request('PUT', 'settings', [
            'key' => OptionKeys::LEGAL_SETTINGS,
            'data' => [
                'consents' => [$this->make_consent(['id' => 'consent-2'])],
            ],
        ]);

        $payload = $this->assert_api_success($response);

        $this->assertCount(1, $payload['data']['consents']);
        $this->assertSame('consent-2', $payload['data']['consents'][0]['id']);
    }

    /**
     * Update legal settings with an empty array clears the consents.
     *
     * @return void
     */
    public function test_update_legal_settings_empty_array_clears_consents(): void
    {
        $this->request('PUT', 'settings', [
            'key' => OptionKeys::LEGAL_SETTINGS,
            'data' => ['consents' => [$this->make_consent()]],
        ]);

        $response = $this->request('PUT', 'settings', [
            'key' => OptionKeys::LEGAL_SETTINGS,
            'data' => ['consents' => []],
        ]);

        $payload = $this->assert_api_success($response);

        $this->assertSame([], $payload['data']['consents']);
    }

    /**
     * Update legal settings rejects an unrecognised location.
     *
     * @return void
     */
    public function test_update_legal_settings_rejects_unknown_location(): void
    {
        $response = $this->request('PUT', 'settings', [
            'key' => OptionKeys::LEGAL_SETTINGS,
            'data' => [
                'consents' => [$this->make_consent(['locations' => ['nowhere']])],
            ],
        ]);

        $this->assert_validation_error($response);
    }

    /**
     * Update legal settings rejects an unrecognised consent method.
     *
     * @return void
     */
    public function test_update_legal_settings_rejects_unknown_method(): void
    {
        $response = $this->request('PUT', 'settings', [
            'key' => OptionKeys::LEGAL_SETTINGS,
            'data' => [
                'consents' => [$this->make_consent(['method' => 'telepathy'])],
            ],
        ]);

        $this->assert_validation_error($response);
    }

    /**
     * Update legal settings rejects a consent with no location.
     *
     * @return void
     */
    public function test_update_legal_settings_rejects_empty_locations(): void
    {
        $response = $this->request('PUT', 'settings', [
            'key' => OptionKeys::LEGAL_SETTINGS,
            'data' => [
                'consents' => [$this->make_consent(['locations' => []])],
            ],
        ]);

        $this->assert_validation_error($response);
    }

    /**
     * Get legal settings exposes the registration flag.
     *
     * @return void
     */
    public function test_get_legal_settings_exposes_registration_flag(): void
    {
        update_option('users_can_register', 1);

        $response = $this->request('GET', 'settings/' . OptionKeys::LEGAL_SETTINGS);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']['is_registration_enabled']);

        update_option('users_can_register', 0);

        $response = $this->request('GET', 'settings/' . OptionKeys::LEGAL_SETTINGS);
        $payload = $this->assert_api_success($response);

        $this->assertFalse($payload['data']['is_registration_enabled']);
    }
}
