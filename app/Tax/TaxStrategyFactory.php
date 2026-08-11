<?php

namespace Kirki\Ecommerce\App\Tax;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\EuropeanCountryChecker;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Exception;

use function Kirki\Ecommerce\Framework\config;

class TaxStrategyFactory
{
    public static function make(array $address)
    {
        if (empty($address['country'])) {
            throw new Exception(__('Country is required', 'kirki-ecommerce'));
        }

        $tax_settings = Settings::get(OptionKeys::TAX_SETTINGS);

        $region = static::get_tax_settings($address['country'], $tax_settings);

        if (empty($region)) {
            throw new Exception(__('Tax region not found', 'kirki-ecommerce'));
        }

        $strategy = static::get_strategy($address['country']);

        if (empty($strategy)) {
            throw new Exception(__('Tax strategy not found', 'kirki-ecommerce'));
        }

        return new $strategy($address, $region, $tax_settings->get('is_tax_inclusive_price') ?? false, $tax_settings->get('is_shipping_tax_enabled') ?? false);
    }

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

    public static function get_strategy(string $country)
    {
        $country = strtoupper($country);
        $country = EuropeanCountryChecker::is_eu_by_code($country) ? 'EU' : $country;
        $strategies = config('tax-strategies');

        return $strategies[$country] ?? $strategies['DEFAULT'] ?? null;
    }
}
