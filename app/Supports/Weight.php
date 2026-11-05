<?php

namespace Kirki\Ecommerce\App\Supports;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\WeightUnit;

use function Kirki\Ecommerce\App\settings;

/**
 * Converts weights between the supported weight units.
 *
 * @since 1.0.0
 */
class Weight
{
    /**
     * Grams in one of each supported weight unit.
     */
    const GRAMS_PER_UNIT = [
        WeightUnit::GRAM => 1,
        WeightUnit::KILOGRAM => 1000,
        WeightUnit::POUND => 453.59237,
        WeightUnit::OUNCE => 28.349523125,
    ];

    /**
     * Convert a weight to another unit, by default the store's weight unit.
     *
     * A missing or unsupported unit leaves the weight unchanged, so the weight is
     * treated as already being in the target unit.
     *
     * @since 1.0.0
     *
     * @param int|float   $value Weight to convert.
     * @param string|null $from  Unit of the weight.
     * @param string|null $to    Target unit; the store's weight unit when null.
     * @return int|float
     */
    public static function convert($value, $from, $to = null)
    {
        $to = $to ?: static::get_store_unit();

        if (!isset(static::GRAMS_PER_UNIT[$from], static::GRAMS_PER_UNIT[$to]) || $from === $to) {
            return $value;
        }

        return $value * static::GRAMS_PER_UNIT[$from] / static::GRAMS_PER_UNIT[$to];
    }

    /**
     * Get the weight unit set in the store's product settings.
     *
     * @since 1.0.0
     *
     * @return string|null
     */
    public static function get_store_unit()
    {
        return settings(OptionKeys::PRODUCT_SETTINGS . '.weight_unit');
    }
}
