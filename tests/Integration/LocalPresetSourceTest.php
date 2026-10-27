<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Setup\Presets\Local\TaxRegionBuilder;
use Kirki\Ecommerce\App\Setup\Presets\PresetContext;
use Kirki\Ecommerce\App\Setup\Presets\PresetRepository;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

/**
 * Covers how the local preset source places tax profile rules, against a fixture data file.
 */
class LocalPresetSourceTest extends RestTestCase
{
    /** @var string */
    protected $fixture_file;

    protected function setUp(): void
    {
        parent::setUp();

        $this->fixture_file = tempnam(sys_get_temp_dir(), 'kirki-presets-');
        file_put_contents($this->fixture_file, wp_json_encode([
            'version' => 1,
            'countries' => [
                'CA' => ['tax' => [
                    'mode' => 'states',
                    'scope' => 'all',
                    'source' => 'fixture',
                    'verified_at' => '2026-10-05',
                    'profile_rates' => ['food' => 0],
                    'states' => [
                        '872' => ['name' => 'Alberta', 'rate' => 5],
                        '875' => ['name' => 'British Columbia', 'rate' => 5, 'home_extra' => 7, 'profile_rates' => ['food' => 1]],
                    ],
                ]],
                'US' => ['tax' => [
                    'mode' => 'states',
                    'scope' => 'home',
                    'source' => 'fixture',
                    'verified_at' => '2026-10-05',
                    'states' => [
                        '1407' => ['name' => 'Texas', 'rate' => 6.25, 'profile_rates' => ['alcohol' => 9, 'unknown' => 1]],
                    ],
                ]],
            ],
        ]));
    }

    protected function tearDown(): void
    {
        @unlink($this->fixture_file);

        parent::tearDown();
    }

    public function test_country_wide_rate_is_placed_on_every_state_and_a_state_rate_replaces_it(): void
    {
        $region = $this->build(['country' => 'CA', 'state' => '872'], ['standard', 'food']);

        $rules = array_column($region['states'], 'rules', 'name');
        $this->assertSame([['profile' => 'food', 'action' => ['type' => 'set_product_tax_rate', 'value' => 0]]], $rules['Alberta']);
        $this->assertSame([['profile' => 'food', 'action' => ['type' => 'set_product_tax_rate', 'value' => 1]]], $rules['British Columbia']);
        $this->assertSame([], $region['rules']);
    }

    public function test_state_rate_above_the_standard_rate_becomes_a_rule(): void
    {
        $region = $this->build(['country' => 'US', 'state' => '1407'], ['standard', 'alcohol']);

        $this->assertCount(1, $region['states']);
        $this->assertEquals(6.25, $region['states'][0]['product_tax_rate']);
        $this->assertSame([['profile' => 'alcohol', 'action' => ['type' => 'set_product_tax_rate', 'value' => 9]]], $region['states'][0]['rules']);
    }

    public function test_rates_of_profiles_the_store_does_not_receive_are_left_out(): void
    {
        $region = $this->build(['country' => 'US', 'state' => '1407'], ['standard']);

        $this->assertSame([], $region['states'][0]['rules']);
    }

    public function test_home_scope_region_lists_no_state_when_the_store_has_none(): void
    {
        $region = $this->build(['country' => 'US'], ['standard']);

        $this->assertSame('US', $region['code']);
        $this->assertFalse($region['is_central_tax_enabled']);
        $this->assertSame([], $region['states']);
    }

    public function test_home_scope_region_lists_no_state_when_the_presets_do_not_know_it(): void
    {
        $region = $this->build(['country' => 'US', 'state' => '9999'], ['standard']);

        $this->assertSame([], $region['states']);
    }

    public function test_all_scope_region_lists_every_state_without_a_home_extra_when_the_store_has_no_state(): void
    {
        $region = $this->build(['country' => 'CA'], ['standard', 'food']);

        $rates = array_column($region['states'], 'product_tax_rate', 'name');
        $this->assertEquals(['Alberta' => 5, 'British Columbia' => 5], $rates);
    }

    /**
     * Build the tax region from the fixture for a tax-collecting store.
     *
     * @param array    $context      Context fields over the defaults.
     * @param string[] $profile_keys Tax profile keys the store receives.
     * @return array<string, mixed>|null
     */
    protected function build(array $context, array $profile_keys)
    {
        $builder = new TaxRegionBuilder(new PresetRepository($this->fixture_file));

        return $builder->build(PresetContext::from_array(array_merge([
            'industry' => 'food-beverage-and-gourmet',
            'currency' => 'USD',
            'is_tax_collected' => true,
        ], $context)), $profile_keys);
    }
}
