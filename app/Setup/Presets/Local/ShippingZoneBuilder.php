<?php

namespace Kirki\Ecommerce\App\Setup\Presets\Local;

use Kirki\Ecommerce\App\Constants\ShippingMethodTypes;
use Kirki\Ecommerce\App\Setup\Presets\PresetContext;
use Kirki\Ecommerce\App\Setup\Presets\PresetRepository;
use Kirki\Ecommerce\App\Supports\CountryData;

defined('ABSPATH') || exit;

/**
 * Builds the Domestic and Regional shipping zones of a store from the bundled preset data.
 *
 * @since 1.0.0
 */
class ShippingZoneBuilder
{
    const DOMESTIC = 'domestic';
    const REGIONAL = 'regional';

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
     * Build the zones in matching order, with their methods and profile rules.
     *
     * @since 1.0.0
     *
     * @param PresetContext $context      The store's answers.
     * @param string[]      $profile_keys Keys of the shipping profiles the store receives.
     * @return array<int, array<string, mixed>> Zones of the preset response.
     */
    public function build(PresetContext $context, array $profile_keys)
    {
        $country = $this->presets->get_country($context->country);
        $titles = $this->presets->get_common()['zone_titles'] ?? [];
        $templates = $this->get_rule_templates($context, $profile_keys);
        $zones = [];

        foreach ($this->get_destinations($context->country, $country['bloc'] ?? null) as $kind => $codes) {
            $zones[] = [
                'title' => $titles[$kind] ?? $kind,
                'is_enabled' => true,
                'regions' => array_map(fn($code) => ['country' => $code, 'states' => []], $codes),
                'methods' => $this->make_methods($context, $kind, $templates),
            ];
        }

        return $zones;
    }

    /**
     * Get the destination country codes of each zone, in matching order.
     *
     * @since 1.0.0
     *
     * @param string      $country_code The store's country.
     * @param string|null $bloc         The trade bloc the country belongs to.
     * @return array<string, string[]> Country codes keyed by zone kind; a zone with no destination is left out.
     */
    protected function get_destinations(string $country_code, $bloc)
    {
        $destinations = [static::DOMESTIC => [$country_code]];

        if (!empty($bloc)) {
            $members = array_values(array_diff($this->presets->get_bloc($bloc), [$country_code]));

            if (!empty($members)) {
                $destinations[static::REGIONAL] = $members;
            }
        }

        return $destinations;
    }

    /**
     * Build the methods of one zone.
     *
     * Country methods carry amounts in the country's own currency, so they are
     * enabled only when that is the store's base currency. Otherwise, and for
     * the generic methods, they are disabled at zero so no wrong amount is
     * ever charged.
     *
     * @since 1.0.0
     *
     * @param PresetContext                    $context   The store's answers.
     * @param string                           $kind      Zone kind.
     * @param array<int, array<string, mixed>> $templates The industry's rule templates.
     * @return array<int, array<string, mixed>> Methods with their `{profile, action}` rules.
     */
    protected function make_methods(PresetContext $context, string $kind, array $templates)
    {
        $country_methods = $this->presets->get_country($context->country)['shipping'][$kind] ?? null;
        $country_currency = CountryData::find_index_entry($context->country)['currency'] ?? null;
        $has_amounts = !empty($country_methods) && $country_currency === $context->currency;
        $definitions = $country_methods ?: ($this->presets->get_common()['shipping_methods'][$kind] ?? []);

        return array_map(function ($definition) use ($kind, $templates, $has_amounts) {
            $key = $definition['key'];
            unset($definition['key']);

            $method = array_merge($definition, [
                'is_enabled' => $has_amounts,
                'rules' => $this->get_method_rules($templates, $kind, $key),
            ]);

            if (!$has_amounts && ShippingMethodTypes::FLAT_RATE === $method['type']) {
                $method['base_amount'] = 0;
            }

            return $method;
        }, $definitions);
    }

    /**
     * Get the industry's rule templates whose profile the store receives.
     *
     * @since 1.0.0
     *
     * @param PresetContext $context      The store's answers.
     * @param string[]      $profile_keys Keys of the shipping profiles the store receives.
     * @return array<int, array<string, mixed>> Templates with profile, zones, methods and action.
     */
    protected function get_rule_templates(PresetContext $context, array $profile_keys)
    {
        $templates = $this->presets->get_industry($context->industry)['shipping_rules'] ?? [];

        return array_values(array_filter($templates, fn($template) => in_array($template['profile'], $profile_keys, true)));
    }

    /**
     * Get the rules that apply to a method of a zone kind.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $templates Rule templates.
     * @param string                           $kind      Zone kind.
     * @param string                           $key       Method key.
     * @return array<int, array<string, mixed>> Rules as `{profile, action}`.
     */
    protected function get_method_rules(array $templates, string $kind, string $key)
    {
        $rules = [];

        foreach ($templates as $template) {
            $matches_zone = in_array('*', $template['zones'], true) || in_array($kind, $template['zones'], true);
            $matches_method = in_array('*', $template['methods'], true) || in_array($key, $template['methods'], true);

            if ($matches_zone && $matches_method) {
                $rules[] = ['profile' => $template['profile'], 'action' => $template['action']];
            }
        }

        return $rules;
    }
}
