<?php

namespace Kirki\Ecommerce\App\Tax;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\EuropeanCountryChecker;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

use function Kirki\Ecommerce\Framework\config;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Picks and builds the tax strategy that matches an address's country.
 *
 * @since 1.0.0
 */
class TaxStrategyFactory
{
    /**
     * Build the tax strategy for an address.
     *
     * Throws through `throw_if()` when the address has no country, or when no
     * enabled tax region or strategy exists for it.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $address Address data, including its `country` code.
     * @return \Kirki\Ecommerce\App\Tax\Strategies\AbstractTaxStrategy
     * @throws \Exception When the address has no country, or no tax region or strategy exists for it.
     */
    public static function make(array $address)
    {
        throw_if(empty($address['country']), __('Country is required', 'kirki-ecommerce'));

        $tax_settings = Settings::get(OptionKeys::TAX_SETTINGS);

        $region = static::get_tax_settings($address['country'], $tax_settings);

        throw_if(empty($region), __('Tax region not found', 'kirki-ecommerce'));

        $strategy = static::get_strategy($address['country']);

        throw_if(empty($strategy), __('Tax strategy not found', 'kirki-ecommerce'));

        // $is_shipping_tax_enabled = $tax_settings->get('is_shipping_tax_enabled') ?? true;
        $is_shipping_tax_enabled = true; // @TODO: we might need a global toggle for shipping tax later

        return new $strategy($address, $region, $tax_settings->get('is_tax_inclusive_price') ?? false, $is_shipping_tax_enabled );
    }

    /**
     * Find the enabled tax region for a country.
     *
     * EU member countries are matched against the shared `EU` region.
     *
     * @since 1.0.0
     *
     * @param string                           $country      Country code.
     * @param \Kirki\Ecommerce\App\AppSettings $tax_settings The tax settings.
     * @return array<string, mixed>|null Null when no enabled region matches.
     */
    public static function get_tax_settings(string $country, $tax_settings)
    {
        $regions = $tax_settings->get('tax_regions');
        $country = EuropeanCountryChecker::is_eu_by_code($country) ? 'EU' : $country;

        foreach ($regions as $region) {
            if (strtoupper($country) === strtoupper($region['code']) && $region['is_enabled'] ?? false) {
                return $region;
            }
        }

        return null;
    }

    /**
     * Get the strategy class configured for a country.
     *
     * EU member countries use the `EU` strategy, falling back to the `DEFAULT` one.
     *
     * @since 1.0.0
     *
     * @param string $country Country code.
     * @return string|null Strategy class name, null when none is configured.
     */
    public static function get_strategy(string $country)
    {
        $country = strtoupper($country);
        $country = EuropeanCountryChecker::is_eu_by_code($country) ? 'EU' : $country;
        $strategies = config('tax-strategies');

        return $strategies[$country] ?? $strategies['DEFAULT'] ?? null;
    }
}
