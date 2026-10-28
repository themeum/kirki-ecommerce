<?php

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use Kirki\Ecommerce\App\Supports\ShippingCarrierPresets;
use Kirki\Ecommerce\App\Supports\TrackingUrl;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class ShippingCarrierPresetsTest extends TestCase
{
    public function test_every_preset_has_a_valid_tracking_template(): void
    {
        foreach (ShippingCarrierPresets::catalog() as $key => $preset) {
            $this->assertNotSame('', $preset['name'], $key);
            $this->assertTrue(TrackingUrl::is_template($preset['tracking_url']), $key);
            $this->assertFileExists(dirname(__DIR__, 3) . '/assets/images/carriers/' . $key . '.svg');
        }
    }

    public function test_catalog_includes_the_main_global_carriers(): void
    {
        $this->assertEqualsCanonicalizing(
            ['ups', 'fedex', 'dhl', 'usps'],
            array_intersect(['ups', 'fedex', 'dhl', 'usps'], array_keys(ShippingCarrierPresets::catalog()))
        );
    }

    public function test_logo_url_of_a_carrier_without_a_known_preset_is_null(): void
    {
        $this->assertNull(ShippingCarrierPresets::get_logo_url(['preset' => null]));
        $this->assertNull(ShippingCarrierPresets::get_logo_url(['preset' => 'unknown']));
    }

    public function test_a_zone_without_the_carrier_key_is_returned_unchanged(): void
    {
        $this->assertSame(['id' => 'zone-1'], ShippingCarrierPresets::with_logo_urls(['id' => 'zone-1']));
    }
}
