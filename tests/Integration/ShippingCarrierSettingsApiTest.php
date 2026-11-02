<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\ShippingCarrierPresets;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestCurrency;

class ShippingCarrierSettingsApiTest extends RestTestCase
{
    use SeedsTestCurrency;

    /**
     * Build a shipping settings payload holding one zone.
     *
     * @param array $zone_overrides Fields to merge into the zone.
     * @return array
     */
    protected function payload(array $zone_overrides = []): array
    {
        return [
            'key' => OptionKeys::SHIPPING_SETTINGS,
            'data' => [
                'shipping_zones' => [
                    array_merge([
                        'id' => 'zone-1',
                        'is_enabled' => true,
                        'title' => 'Zone 1',
                        'regions' => [['country' => 'US', 'states' => []]],
                        'shipping_methods' => [],
                    ], $zone_overrides),
                ],
            ],
        ];
    }

    /**
     * Build a valid carrier.
     *
     * @param array $overrides Fields to override.
     * @return array
     */
    protected function carrier(array $overrides = []): array
    {
        return array_merge([
            'id' => 'carrier-1',
            'preset' => null,
            'name' => 'Local Courier',
            'tracking_url' => 'https://track.example.com/?n={tracking_number}&lang=en',
            'logo' => null,
            'is_enabled' => true,
        ], $overrides);
    }

    public function test_a_zone_saved_without_carriers_stays_empty(): void
    {
        $this->seed_base_currency();

        $payload = $this->assert_api_success($this->request('PUT', 'settings', $this->payload()));

        $this->assertEmpty($payload['data']['shipping_zones'][0]['shipping_carriers'] ?? []);
        $this->assertEmpty(Option::get(OptionKeys::SHIPPING_SETTINGS)['shipping_zones'][0]['shipping_carriers'] ?? []);
    }

    public function test_a_stored_zone_without_the_carrier_key_reads_as_empty(): void
    {
        $this->seed_base_currency();
        Option::set(OptionKeys::SHIPPING_SETTINGS, [
            'shipping_zones' => [['id' => 'old-zone', 'is_enabled' => true, 'title' => 'Old', 'regions' => [['country' => 'US', 'states' => []]], 'shipping_methods' => []]],
        ]);

        $payload = $this->assert_api_success($this->request('GET', 'settings/' . OptionKeys::SHIPPING_SETTINGS));

        $this->assertEmpty($payload['data']['shipping_zones'][0]['shipping_carriers'] ?? []);
    }

    public function test_the_read_response_carries_the_preset_catalog(): void
    {
        $this->seed_base_currency();

        $payload = $this->assert_api_success($this->request('GET', 'settings/' . OptionKeys::SHIPPING_SETTINGS));

        $presets = $payload['data']['shipping_carrier_presets'];

        $this->assertSame(array_keys(ShippingCarrierPresets::catalog()), array_column($presets, 'key'));

        foreach ($presets as $preset) {
            $this->assertSame(['key', 'name', 'tracking_url', 'logo_url'], array_keys($preset));
            $this->assertNotEmpty($preset['logo_url'], $preset['key']);
        }
    }

    public function test_the_preset_catalog_is_not_stored(): void
    {
        $this->seed_base_currency();
        $payload = $this->payload();
        $payload['data']['shipping_carrier_presets'] = ShippingCarrierPresets::get_catalog_list();

        $this->assert_api_success($this->request('PUT', 'settings', $payload));

        $this->assertArrayNotHasKey('shipping_carrier_presets', Option::get(OptionKeys::SHIPPING_SETTINGS));
    }

    public function test_a_preset_carrier_added_by_the_client_is_saved_enabled_with_its_logo(): void
    {
        $this->seed_base_currency();
        $preset = ShippingCarrierPresets::catalog()['dhl'];

        $payload = $this->assert_api_success($this->request('PUT', 'settings', $this->payload([
            'shipping_carriers' => [[
                'id' => 'dhl',
                'preset' => 'dhl',
                'name' => $preset['name'],
                'tracking_url' => $preset['tracking_url'],
                'logo' => null,
                'is_enabled' => true,
            ]],
        ])));
        $carrier = $payload['data']['shipping_zones'][0]['shipping_carriers'][0];

        $this->assertTrue($carrier['is_enabled']);
        $this->assertSame($preset['tracking_url'], $carrier['tracking_url']);
        $this->assertNotEmpty($carrier['logo_url']);
    }

    public function test_an_empty_carrier_list_stays_empty_after_a_read(): void
    {
        $this->seed_base_currency();

        $payload = $this->assert_api_success($this->request('PUT', 'settings', $this->payload(['shipping_carriers' => []])));

        $this->assertSame([], $payload['data']['shipping_zones'][0]['shipping_carriers']);

        $read = $this->assert_api_success($this->request('GET', 'settings/' . OptionKeys::SHIPPING_SETTINGS));

        $this->assertSame([], $read['data']['shipping_zones'][0]['shipping_carriers']);
    }

    public function test_the_template_keeps_its_placeholder_through_a_round_trip(): void
    {
        $this->seed_base_currency();

        $response = $this->request('PUT', 'settings', $this->payload(['shipping_carriers' => [$this->carrier()]]));
        $carrier = $this->assert_api_success($response)['data']['shipping_zones'][0]['shipping_carriers'][0];

        $this->assertSame('https://track.example.com/?n={tracking_number}&lang=en', $carrier['tracking_url']);

        $stored = Option::get(OptionKeys::SHIPPING_SETTINGS)['shipping_zones'][0]['shipping_carriers'][0];

        $this->assertSame('https://track.example.com/?n={tracking_number}&lang=en', $stored['tracking_url']);
        $this->assertTrue($stored['is_enabled']);
        $this->assertNull($stored['logo']);
    }

    public function test_a_client_sent_logo_url_is_not_stored(): void
    {
        $this->seed_base_currency();

        $this->assert_api_success($this->request('PUT', 'settings', $this->payload([
            'shipping_carriers' => [$this->carrier(['logo_url' => 'https://evil.example.com/x.png'])],
        ])));

        $stored = Option::get(OptionKeys::SHIPPING_SETTINGS)['shipping_zones'][0]['shipping_carriers'][0];

        $this->assertArrayNotHasKey('logo_url', $stored);
    }

    public function test_a_read_then_save_keeps_the_carriers_and_ids(): void
    {
        $this->seed_base_currency();
        $first = $this->assert_api_success($this->request('PUT', 'settings', $this->payload(['shipping_carriers' => [$this->carrier()]])))['data'];
        $second = $this->assert_api_success($this->request('PUT', 'settings', [
            'key' => OptionKeys::SHIPPING_SETTINGS,
            'data' => $first,
        ]))['data'];

        $this->assertSame($first['shipping_zones'][0]['shipping_carriers'], $second['shipping_zones'][0]['shipping_carriers']);
    }

    public function test_a_template_without_the_placeholder_is_rejected(): void
    {
        $response = $this->request('PUT', 'settings', $this->payload([
            'shipping_carriers' => [$this->carrier(['tracking_url' => 'https://www.ups.com/track'])],
        ]));

        $errors = $this->assert_validation_error($response)['errors'];

        $this->assertArrayHasKey('data.shipping_zones.0.shipping_carriers.0.tracking_url', $errors);
    }

    public function test_a_template_with_another_scheme_is_rejected(): void
    {
        $response = $this->request('PUT', 'settings', $this->payload([
            'shipping_carriers' => [$this->carrier(['tracking_url' => 'javascript:alert({tracking_number})'])],
        ]));

        $errors = $this->assert_validation_error($response)['errors'];

        $this->assertArrayHasKey('data.shipping_zones.0.shipping_carriers.0.tracking_url', $errors);
    }

    public function test_a_carrier_without_a_name_is_rejected(): void
    {
        $response = $this->request('PUT', 'settings', $this->payload([
            'shipping_carriers' => [$this->carrier(['name' => ''])],
        ]));

        $errors = $this->assert_validation_error($response)['errors'];

        $this->assertArrayHasKey('data.shipping_zones.0.shipping_carriers.0.name', $errors);
    }
}
