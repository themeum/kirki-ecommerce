<?php

namespace Kirki\Ecommerce\App\Setup\Presets;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

defined('ABSPATH') || exit;

/**
 * Inserts the preset tax region with the rules for its tax profiles.
 *
 * @since 1.0.0
 */
class TaxRegionPresets
{
    /** @var TaxProfilePresets */
    protected $profile_presets;

    /**
     * Create the inserter with the tax profile presets that resolve rule profiles.
     *
     * @since 1.0.0
     *
     * @param TaxProfilePresets $profile_presets
     */
    public function __construct(TaxProfilePresets $profile_presets)
    {
        $this->profile_presets = $profile_presets;
    }

    /**
     * Write the preset tax region when the merchant collects tax and has no region yet.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $presets The preset response.
     * @param PresetContext        $context The store's answers.
     * @return void
     */
    public function apply(array $presets, PresetContext $context)
    {
        $region = $presets['tax_region'] ?? null;

        if (!$context->is_tax_collected || !is_array($region) || empty($region['code'])) {
            return;
        }

        $settings = Settings::get(OptionKeys::TAX_SETTINGS)->refresh();

        if (!empty($settings->to_array()['tax_regions'])) {
            return;
        }

        $region = $this->make_region($region, $this->profile_presets->get_ids($presets));
        $settings->set(['tax_regions' => [$region]]);

        Log::info(sprintf('Store presets created the %s tax region', $region['code']));
    }

    /**
     * Build the stored region, with its text sanitized, its rates as numbers and its rules resolved.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $region      Preset region.
     * @param array<string, int>   $profile_ids Tax profile ids keyed by preset key.
     * @return array<string, mixed>
     */
    protected function make_region(array $region, array $profile_ids)
    {
        $stored = [
            'code' => strtoupper(sanitize_text_field($region['code'])),
            'name' => sanitize_text_field($region['name'] ?? ''),
            'flag' => isset($region['flag']) ? sanitize_text_field($region['flag']) : null,
            'type' => sanitize_key($region['type'] ?? 'general'),
            'is_enabled' => !empty($region['is_enabled']),
        ];

        if (array_key_exists('is_central_tax_enabled', $region)) {
            $stored['is_central_tax_enabled'] = (bool) $region['is_central_tax_enabled'];
        }

        foreach (['central_product_tax', 'central_shipping_tax'] as $rate) {
            if (array_key_exists($rate, $region)) {
                $stored[$rate] = $this->to_rate($region[$rate]);
            }
        }

        if (isset($region['countries'])) {
            $stored['countries'] = array_map(fn($country) => [
                'code' => strtoupper(sanitize_text_field($country['code'] ?? '')),
                'name' => sanitize_text_field($country['name'] ?? ''),
                'flag' => isset($country['flag']) ? sanitize_text_field($country['flag']) : null,
                'rate' => $this->to_rate($country['rate'] ?? null),
            ], (array) $region['countries']);
        }

        if (isset($region['states'])) {
            $stored['states'] = array_map(fn($state) => [
                'id' => (string) ($state['id'] ?? ''),
                'name' => sanitize_text_field($state['name'] ?? ''),
                'product_tax_rate' => $this->to_rate($state['product_tax_rate'] ?? null),
                'shipping_tax_rate' => $this->to_rate($state['shipping_tax_rate'] ?? null),
                'rules' => $this->profile_presets->resolve_rules($state['rules'] ?? [], $profile_ids),
            ], (array) $region['states']);
        }

        $stored['rules'] = $this->profile_presets->resolve_rules($region['rules'] ?? [], $profile_ids);

        return $stored;
    }

    /**
     * Read a rate as a number, keeping null for no rate.
     *
     * @since 1.0.0
     *
     * @param mixed $rate
     * @return int|float|null
     */
    protected function to_rate($rate)
    {
        return is_numeric($rate) ? $rate + 0 : null;
    }
}
