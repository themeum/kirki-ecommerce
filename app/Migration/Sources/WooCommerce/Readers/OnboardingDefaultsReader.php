<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Readers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Probe\VersionProbe;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceDatabase;

/**
 * Reads the WooCommerce store facts that the onboarding wizard uses as its first answers.
 *
 * @since 1.0.0
 */
class OnboardingDefaultsReader
{
    /** WooCommerce onboarding industry keys (underscore separated), and the Kirki industry that each one maps to. */
    protected const INDUSTRY_MAP = [
        'clothing_and_accessories' => 'fashion-and-apparel',
        'health_and_beauty' => 'beauty-cosmetics-and-personal-care',
        'electronics_and_computers' => 'electronics-and-accessories',
        'food_and_drink' => 'food-beverage-and-gourmet',
        'home_furniture_and_garden' => 'home-decor-and-furniture',
        'arts_and_crafts' => 'arts-and-crafts-supplies',
        'sports_and_recreation' => 'sports-and-fitness',
        'other' => 'other',
    ];

    /** @var VersionProbe */
    protected $version;

    /**
     * Create the reader.
     *
     * @since 1.0.0
     *
     * @param VersionProbe|null $version The WooCommerce version probe.
     */
    public function __construct(?VersionProbe $version = null)
    {
        $this->version = $version ?: new VersionProbe(new WooCommerceDatabase());
    }

    /**
     * Read the wizard defaults. A field without a value in WooCommerce is left out.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>|null Null when WooCommerce is not installed or its version is not supported.
     */
    public function read()
    {
        if (!$this->version->is_installed() || !$this->version->is_supported()) {
            return null;
        }

        $values = array_filter([
            'store_name' => trim((string) get_option('blogname', '')),
            'industry' => $this->industry(),
            'currency' => strtoupper((string) get_option('woocommerce_currency', '')),
        ], static function ($value) {
            return $value !== '';
        });

        $country = $this->country();

        if ($country !== '') {
            $values['country'] = $country;
            $values['store_address'] = [
                'address_line_1' => (string) get_option('woocommerce_store_address', ''),
                'address_line_2' => (string) get_option('woocommerce_store_address_2', ''),
                'city' => (string) get_option('woocommerce_store_city', ''),
                'postal_code' => (string) get_option('woocommerce_store_postcode', ''),
            ];
        }

        $calc_taxes = get_option('woocommerce_calc_taxes', null);

        if ($calc_taxes !== null) {
            $values['is_tax_collected'] = $calc_taxes === 'yes';
        }

        if (!empty($values['is_tax_collected'])) {
            $values['is_tax_inclusive_price'] = get_option('woocommerce_prices_include_tax') === 'yes';
        }

        return $values;
    }

    /**
     * Read the store country code. The WooCommerce value can hold a state after a colon.
     *
     * @since 1.0.0
     *
     * @return string An empty string when no country is saved.
     */
    protected function country()
    {
        $parts = explode(':', (string) get_option('woocommerce_default_country', ''));

        return strtoupper(trim($parts[0]));
    }

    /**
     * Map the first WooCommerce onboarding industry to a Kirki industry.
     *
     * @since 1.0.0
     *
     * @return string An empty string when there is no industry or no match.
     */
    protected function industry()
    {
        $profile = get_option('woocommerce_onboarding_profile', []);
        $industries = is_array($profile) && isset($profile['industry']) ? (array) $profile['industry'] : [];
        $first = reset($industries);
        $slug = is_array($first) ? ($first['slug'] ?? '') : $first;

        return is_string($slug) ? (static::INDUSTRY_MAP[str_replace('-', '_', $slug)] ?? '') : '';
    }
}
