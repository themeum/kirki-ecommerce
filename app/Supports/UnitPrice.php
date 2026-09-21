<?php

namespace Kirki\Ecommerce\App\Supports;

use Kirki\Ecommerce\App\Constants\Product\UnitConversion;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Models\Variant;

class UnitPrice
{
    /**
     * Build the formatted unit price for a variant, e.g. "$30.00/1kg", in the
     * given display currency. Returns null when the variant's unit data cannot
     * produce a valid computation.
     *
     * @param Variant $variant
     * @param string|null $display_currency
     * @return string|null
     */
    public static function make(Variant $variant, ?string $display_currency = null)
    {
        $base_unit = $variant->base_unit;
        $base_unit_amount = $variant->base_unit_amount;
        $total_unit = $variant->total_unit;
        $total_unit_amount = $variant->total_unit_amount;

        if (empty($base_unit) || empty($total_unit) || empty($base_unit_amount) || empty($total_unit_amount)) {
            return null;
        }

        $base_factor = UnitConversion::FACTORS[$base_unit] ?? null;
        $total_factor = UnitConversion::FACTORS[$total_unit] ?? null;

        if ($base_factor === null || $total_factor === null) {
            return null;
        }

        if (UnitConversion::GROUPS[$base_unit] !== UnitConversion::GROUPS[$total_unit]) {
            return null;
        }

        $number_of_base_units = ($total_unit_amount * $total_factor) / ($base_unit_amount * $base_factor);

        if (!is_finite($number_of_base_units) || $number_of_base_units <= 0) {
            return null;
        }

        $price_minor = $variant->base_sale_price ?? $variant->base_price;
        $unit_price_minor = (int) round($price_minor / $number_of_base_units);

        $money_object = Money::prepare_amount_object_from_minor($unit_price_minor, null, $display_currency);

        return sprintf('%s/%s%s', $money_object->display, $base_unit_amount, $base_unit);
    }
}
