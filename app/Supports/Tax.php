<?php

namespace Kirki\Ecommerce\App\Supports;

use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\App\Tax\Strategies\AbstractTaxStrategy;
use Kirki\Ecommerce\App\Tax\TaxStrategyFactory;
use Throwable;

class Tax
{
    /**
     * Get tax strategy for a given address.
     *
     * @param array $address
     *
     * @return AbstractTaxStrategy|null
     */
    public static function get_tax_strategy($address)
    {
        if (empty($address)) {
            return null;
        }

        try {
            return TaxStrategyFactory::make($address);
        } catch (Throwable $e) {
            return null;
        }
    }

    /**
     * Check if tax is enabled.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public static function is_tax_enabled()
    {
        return Settings::get('general.is_tax_calculation_enabled', false) && static::is_tax_configured();
    }

    /**
     * Check if tax is configured.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public static function is_tax_configured()
    {
        return count(static::get_tax_regions()) > 0;
    }

    /**
     * Get tax regions.
     *
     * @since 1.0.0
     *
     * @return array
     */
    public static function get_tax_regions()
    {
        return Settings::get('tax.tax_regions', []);
    }

    /**
     * Check if tax is inclusive.
     *
     * @since 1.0.0
     *
     * @return bool
     */

    public static function is_tax_inclusive()
    {
        return (bool) Settings::get('tax.is_tax_inclusive_price', false);
    }

    /**
     * Check if should show incl tax on shop page.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public static function should_show_incl_tax_on_shop_page()
    {
        return static::is_tax_enabled()
            && static::is_tax_inclusive()
            && (bool) Settings::get('tax.is_enabled_display_inclusive_taxed_price', false);
    }
}
