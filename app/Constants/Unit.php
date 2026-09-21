<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Units of measurement for weight, volume, size and area.
 *
 * @since 1.0.0
 */
class Unit
{
    use HasConstants;
    public const MILLIGRAM = 'mg';
    public const GRAM = 'g';
    public const KILOGRAM = 'kg';
    public const MILLILITER = 'ml';
    public const CENTILITER = 'cl';
    public const LITER = 'l';
    public const CUBIC_METER = 'm3';
    public const MILLIMETER = 'mm';
    public const CENTIMETER = 'cm';
    public const METER = 'm';
    public const SQUARE_FOOT = 'sqft';
}
