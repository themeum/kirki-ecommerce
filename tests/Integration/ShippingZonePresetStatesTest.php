<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Setup\Presets\PresetContext;
use Kirki\Ecommerce\App\Setup\Presets\ShippingProfilePresets;
use Kirki\Ecommerce\App\Setup\Presets\ShippingZonePresets;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

/**
 * Covers the states of the shipping zone regions that onboarding writes.
 */
class ShippingZonePresetStatesTest extends RestTestCase
{
    /** @var array<string, mixed> */
    protected $snapshot = [];

    /**
     * Save the shipping settings and empty the zones.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->snapshot = Settings::get(OptionKeys::SHIPPING_SETTINGS)->refresh()->to_array();
        Settings::get(OptionKeys::SHIPPING_SETTINGS)->refresh()->set(['shipping_zones' => []], false);
    }

    /**
     * Restore the shipping settings.
     *
     * @return void
     */
    protected function tearDown(): void
    {
        Option::set(OptionKeys::SHIPPING_SETTINGS, $this->snapshot, true);

        parent::tearDown();
    }

    /**
     * A preset region with a country and no state selects every state of the country.
     *
     * @return void
     */
    public function test_country_only_region_selects_all_states()
    {
        $without = null;

        foreach (array_keys(CountryData::index()) as $code) {
            if ($code !== 'US' && empty(CountryData::state_ids($code))) {
                $without = $code;
                break;
            }
        }

        $presets = ['shipping_zones' => [[
            'title' => 'Domestic',
            'is_enabled' => true,
            'regions' => [['country' => 'US', 'states' => []], ['country' => $without, 'states' => []]],
            'methods' => [],
        ]]];

        (new ShippingZonePresets(new ShippingProfilePresets()))->apply($presets, PresetContext::from_array(['country' => 'US']));

        $regions = array_column(Settings::get(OptionKeys::SHIPPING_SETTINGS)->refresh()->to_array()['shipping_zones'][0]['regions'], null, 'country');
        $this->assertNotEmpty($regions['US']['states']);
        $this->assertSame(CountryData::state_ids('US'), $regions['US']['states']);
        $this->assertSame([], $regions[$without]['states']);
    }
}
