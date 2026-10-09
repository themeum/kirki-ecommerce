<?php

namespace Kirki\Ecommerce\App\Setup\Presets\Local;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Setup\Presets\PresetContext;
use Kirki\Ecommerce\App\Setup\Presets\PresetRepository;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\App\Tax\Strategies\EUTaxStrategy;

defined('ABSPATH') || exit;

/**
 * Builds the tax region of a store's country from the bundled preset data.
 *
 * @since 1.0.0
 */
class TaxRegionBuilder
{
    const MODE_COUNTRY = 'country';
    const MODE_STATES = 'states';
    const MODE_EU = 'eu';

    const SCOPE_ALL = 'all';

    /** @var PresetRepository */
    protected $presets;

    /**
     * Create the builder with the preset data.
     *
     * @since 1.0.0
     *
     * @param PresetRepository $presets
     */
    public function __construct(PresetRepository $presets)
    {
        $this->presets = $presets;
    }

    /**
     * Build the region when the merchant collects tax and the country has tax data.
     *
     * @since 1.0.0
     *
     * @param PresetContext $context      The store's answers.
     * @param string[]      $profile_keys Keys of the tax profiles the store receives.
     * @return array<string, mixed>|null The region with `{profile, action}` rules, or null when no region applies.
     */
    public function build(PresetContext $context, array $profile_keys)
    {
        $tax = $this->presets->get_country($context->country)['tax'] ?? [];

        if (!$context->is_tax_collected || empty($tax)) {
            return null;
        }

        $rates = $this->filter_rates($tax['profile_rates'] ?? [], $profile_keys);

        switch ($tax['mode'] ?? null) {
            case static::MODE_EU:
                return $this->make_eu_region($context, $tax, $rates);
            case static::MODE_STATES:
                return $this->make_states_region($context, $tax, $rates, $profile_keys);
            case static::MODE_COUNTRY:
                return $this->make_country_region($context, $tax, $rates);
            default:
                return null;
        }
    }

    /**
     * Build a general region that taxes the whole country at one rate.
     *
     * @since 1.0.0
     *
     * @param PresetContext        $context The store's answers.
     * @param array<string, mixed> $tax     The country's tax presets.
     * @param array<string, mixed> $rates   Profile rates keyed by tax profile key.
     * @return array<string, mixed>
     */
    protected function make_country_region(PresetContext $context, array $tax, array $rates)
    {
        return $this->make_general_region($context->country, [
            'is_central_tax_enabled' => true,
            'central_product_tax' => $tax['rate'],
            'central_shipping_tax' => $tax['shipping_rate'] ?? $tax['rate'],
            'states' => [],
            'rules' => $this->make_rules($rates),
        ]);
    }

    /**
     * Build a general region with per-state rates.
     *
     * Only the home state is listed, unless the country's scope is "all" (a
     * federal tax that applies everywhere); the home state then also carries
     * its own extra rate. A per-state region does not use region-level rules,
     * so every listed state gets the country-wide profile rates, and a state's
     * own profile rates replace them for that state.
     *
     * @since 1.0.0
     *
     * @param PresetContext        $context      The store's answers.
     * @param array<string, mixed> $tax          The country's tax presets.
     * @param array<string, mixed> $rates        Country-wide profile rates keyed by tax profile key.
     * @param string[]             $profile_keys Keys of the tax profiles the store receives.
     * @return array<string, mixed>|null Null when the store address has no state the presets know.
     */
    protected function make_states_region(PresetContext $context, array $tax, array $rates, array $profile_keys)
    {
        $presets = $tax['states'] ?? [];
        $home = (string) $context->state;

        if ($home === '' || !isset($presets[$home])) {
            return null;
        }

        $state_ids = static::SCOPE_ALL === ($tax['scope'] ?? null) ? array_map('strval', array_keys($presets)) : [$home];
        $state_names = array_column(CountryData::states_for($context->country), 'name', 'id');
        $states = [];

        foreach ($state_ids as $state_id) {
            $preset = $presets[$state_id];
            $rate = $preset['rate'] + ($state_id === $home ? ($preset['home_extra'] ?? 0) : 0);
            $state_rates = array_merge($rates, $this->filter_rates($preset['profile_rates'] ?? [], $profile_keys));

            $states[] = [
                'id' => $state_id,
                'name' => $state_names[$state_id] ?? $preset['name'],
                'product_tax_rate' => $rate,
                'shipping_tax_rate' => $preset['shipping_rate'] ?? $rate,
                'rules' => $this->make_rules($state_rates),
            ];
        }

        return $this->make_general_region($context->country, [
            'is_central_tax_enabled' => false,
            'central_product_tax' => null,
            'central_shipping_tax' => null,
            'states' => $states,
            'rules' => [],
        ]);
    }

    /**
     * Build the EU region as a micro business that charges the store country's standard rate.
     *
     * A micro-business region holds exactly one country, the same as the admin
     * form allows.
     *
     * @since 1.0.0
     *
     * @param PresetContext        $context The store's answers.
     * @param array<string, mixed> $tax     The store country's tax presets.
     * @param array<string, mixed> $rates   Profile rates keyed by tax profile key.
     * @return array<string, mixed>|null Null when the store country is not a known country.
     */
    protected function make_eu_region(PresetContext $context, array $tax, array $rates)
    {
        $country = CountryData::find_index_entry($context->country);

        if (empty($country) || !isset($tax['rate'])) {
            return null;
        }

        return [
            'code' => 'EU',
            'name' => __('European Union', 'kirki-ecommerce'),
            'flag' => '🇪🇺',
            'type' => EUTaxStrategy::MICRO_BUSINESS,
            'is_enabled' => true,
            'countries' => [[
                'code' => $context->country,
                'name' => $country['name'],
                'flag' => $country['flag'] ?? null,
                'rate' => $tax['rate'],
            ]],
            'rules' => $this->make_rules($rates),
        ];
    }

    /**
     * Build a general region for a country, with its display name and flag.
     *
     * @since 1.0.0
     *
     * @param string               $code   Country code.
     * @param array<string, mixed> $fields Rate fields, states and rules.
     * @return array<string, mixed>
     */
    protected function make_general_region(string $code, array $fields)
    {
        $country = CountryData::find_index_entry($code) ?? [];

        return array_merge([
            'code' => $code,
            'name' => $country['name'] ?? $code,
            'flag' => $country['flag'] ?? null,
            'type' => 'general',
            'is_enabled' => true,
        ], $fields);
    }

    /**
     * Keep only the rates of the tax profiles the store receives.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $rates        Rate, or `{exempt: true}`, keyed by tax profile key.
     * @param string[]             $profile_keys Keys of the tax profiles the store receives.
     * @return array<string, mixed>
     */
    protected function filter_rates(array $rates, array $profile_keys)
    {
        return array_intersect_key($rates, array_flip($profile_keys));
    }

    /**
     * Build a rule for each profile rate.
     *
     * A rate of 0 stays a rate rule: zero-rated and exempt differ in law.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $rates Rate, or `{exempt: true}`, keyed by tax profile key.
     * @return array<int, array<string, mixed>> Rules as `{profile, action}`.
     */
    protected function make_rules(array $rates)
    {
        $rules = [];

        foreach ($rates as $profile_key => $rate) {
            $is_exempt = is_array($rate) && !empty($rate['exempt']);

            $rules[] = [
                'profile' => $profile_key,
                'action' => [
                    'type' => $is_exempt ? Actions::SET_PRODUCT_TAX_EXEMPT : Actions::SET_PRODUCT_TAX_RATE,
                    'value' => $is_exempt ? 0 : $rate,
                ],
            ];
        }

        return $rules;
    }
}
