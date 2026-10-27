<?php

namespace Kirki\Ecommerce\App\Setup\Presets;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\ShippingMethodTypes;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

defined('ABSPATH') || exit;

/**
 * Inserts the preset shipping zones with their methods and profile rules.
 *
 * @since 1.0.0
 */
class ShippingZonePresets
{
    /**
     * Method types a preset may create; each needs only the fields kept by make_method().
     *
     * @since 1.0.0
     */
    const METHOD_TYPES = [ShippingMethodTypes::FLAT_RATE, ShippingMethodTypes::LOCAL_PICKUP];

    /** @var ShippingProfilePresets */
    protected $profile_presets;

    /**
     * Create the inserter with the shipping profile presets that resolve rule profiles.
     *
     * @since 1.0.0
     *
     * @param ShippingProfilePresets $profile_presets
     */
    public function __construct(ShippingProfilePresets $profile_presets)
    {
        $this->profile_presets = $profile_presets;
    }

    /**
     * Write the preset zones, in the order given, when the store has none.
     *
     * Checkout uses the first enabled zone whose destinations hold the
     * address, so the order of the response is kept.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $presets The preset response.
     * @param PresetContext        $context The store's answers.
     * @return void
     */
    public function apply(array $presets, PresetContext $context)
    {
        $settings = Settings::get(OptionKeys::SHIPPING_SETTINGS)->refresh();

        if (!empty($settings->to_array()['shipping_zones'])) {
            return;
        }

        $profile_ids = $this->profile_presets->get_ids($presets);
        $zones = [];

        foreach ($presets['shipping_zones'] ?? [] as $zone) {
            $zone = is_array($zone) ? $this->make_zone($zone, $profile_ids) : null;

            if ($zone === null) {
                Log::warning('Store presets skipped a shipping zone with no valid destination');
                continue;
            }

            $zones[] = $zone;
        }

        if (empty($zones)) {
            return;
        }

        $settings->set(['shipping_zones' => $zones]);

        Log::info(sprintf('Store presets created %d shipping zones for %s', count($zones), $context->country));
    }

    /**
     * Build a stored zone from a preset zone.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $zone        Preset zone.
     * @param array<string, int>   $profile_ids Shipping profile ids keyed by preset key.
     * @return array<string, mixed>|null Null when the zone has no known destination.
     */
    protected function make_zone(array $zone, array $profile_ids)
    {
        $countries = CountryData::index();
        $regions = [];

        foreach ($zone['regions'] ?? [] as $region) {
            $code = strtoupper((string) ($region['country'] ?? ''));

            if (isset($countries[$code])) {
                $regions[] = ['country' => $code, 'states' => array_map('strval', (array) ($region['states'] ?? []))];
            }
        }

        if (empty($regions)) {
            return null;
        }

        $methods = array_map(fn($method) => is_array($method) ? $this->make_method($method, $profile_ids) : null, $zone['methods'] ?? []);

        return [
            'id' => wp_generate_uuid4(),
            'title' => sanitize_text_field($zone['title'] ?? ''),
            'is_enabled' => !empty($zone['is_enabled']),
            'regions' => $regions,
            'shipping_methods' => array_values(array_filter($methods)),
        ];
    }

    /**
     * Build a stored method from a preset method, keeping only the fields its type uses.
     *
     * A flat-rate method always gets an amount and a taxable flag, which the
     * settings API requires when the merchant saves the zone.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $method      Preset method.
     * @param array<string, int>   $profile_ids Shipping profile ids keyed by preset key.
     * @return array<string, mixed>|null Null when the type is not allowed or the method has no name.
     */
    protected function make_method(array $method, array $profile_ids)
    {
        $name = sanitize_text_field($method['name'] ?? '');

        if ($name === '' || !in_array($method['type'] ?? null, static::METHOD_TYPES, true)) {
            Log::warning('Store presets skipped a shipping method');

            return null;
        }

        $is_flat_rate = ShippingMethodTypes::FLAT_RATE === $method['type'];
        $stored = [
            'id' => wp_generate_uuid4(),
            'type' => $method['type'],
            'name' => $name,
            'description' => sanitize_text_field($method['description'] ?? ''),
            'base_amount' => isset($method['base_amount']) ? (int) $method['base_amount'] : ($is_flat_rate ? 0 : null),
        ];

        if ($is_flat_rate) {
            $stored['is_taxable'] = false;
        }

        foreach (['is_taxable', 'has_fee', 'has_pick_time'] as $flag) {
            if (array_key_exists($flag, $method)) {
                $stored[$flag] = (bool) $method[$flag];
            }
        }

        return array_merge($stored, [
            'is_enabled' => !empty($method['is_enabled']),
            'shipping_rules' => $this->profile_presets->resolve_rules($method['rules'] ?? [], $profile_ids),
        ]);
    }
}
