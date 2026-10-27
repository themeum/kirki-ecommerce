<?php

namespace Kirki\Ecommerce\App\Setup\Presets\Local;

use Kirki\Ecommerce\App\Setup\Presets\PresetContext;
use Kirki\Ecommerce\App\Setup\Presets\PresetRepository;

defined('ABSPATH') || exit;

/**
 * Builds the store's preset records from the bundled data file.
 *
 * Each key holds the records of one preset kind, ready for its inserter.
 *
 * @since 1.0.0
 */
class LocalPresetSource
{
    /** @var PresetRepository */
    protected $presets;

    /** @var ShippingZoneBuilder */
    protected $zone_builder;

    /** @var TaxRegionBuilder */
    protected $tax_region_builder;

    /**
     * Create the source with the preset data and its builders.
     *
     * @since 1.0.0
     *
     * @param PresetRepository    $presets
     * @param ShippingZoneBuilder $zone_builder
     * @param TaxRegionBuilder    $tax_region_builder
     */
    public function __construct(PresetRepository $presets, ShippingZoneBuilder $zone_builder, TaxRegionBuilder $tax_region_builder)
    {
        $this->presets = $presets;
        $this->zone_builder = $zone_builder;
        $this->tax_region_builder = $tax_region_builder;
    }

    /**
     * Build the preset records for one store.
     *
     * @since 1.0.0
     *
     * @param PresetContext $context The store's answers.
     * @return array<string, mixed>|null The records by preset kind, or null when the data file cannot be read.
     */
    public function fetch(PresetContext $context)
    {
        $common = $this->presets->get_common();

        if (empty($common)) {
            return null;
        }

        $industry = $this->presets->get_industry($context->industry);
        $shipping_profiles = array_merge($common['shipping_profiles'] ?? [], $industry['shipping_profiles'] ?? []);
        $tax_profiles = array_merge($common['tax_profiles'] ?? [], $industry['tax_profiles'] ?? []);
        $is_gdpr = !empty($this->presets->get_country($context->country)['gdpr']);

        return [
            'categories' => $industry['categories'] ?? [],
            'attributes' => array_merge($common['attributes'] ?? [], $industry['attributes'] ?? []),
            'schema_profiles' => $common['schema_profiles'] ?? [],
            'shipping_profiles' => $shipping_profiles,
            'tax_profiles' => $tax_profiles,
            'legal' => [
                'pages' => $common['legal']['pages'] ?? [],
                'consents' => array_map(fn($consent) => $this->resolve_consent($consent, $is_gdpr), $common['legal']['consents'] ?? []),
            ],
            'shipping_zones' => $this->zone_builder->build($context, array_column($shipping_profiles, 'key')),
            'tax_region' => $this->tax_region_builder->build($context, array_column($tax_profiles, 'key')),
        ];
    }

    /**
     * Apply a consent's GDPR wording when the country has a GDPR-style privacy law.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $consent Consent definition.
     * @param bool                 $is_gdpr Whether the store's country has a GDPR-style privacy law.
     * @return array<string, mixed> Consent with title, locations, method and message.
     */
    protected function resolve_consent(array $consent, bool $is_gdpr)
    {
        if ($is_gdpr && !empty($consent['gdpr'])) {
            $consent = array_merge($consent, $consent['gdpr']);
        }

        return [
            'title' => $consent['title'],
            'locations' => $consent['locations'],
            'method' => $consent['method'],
            'message' => $consent['message'],
        ];
    }
}
