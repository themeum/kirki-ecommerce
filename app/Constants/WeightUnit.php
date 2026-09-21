<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Units of weight for product variants.
 *
 * @since 1.0.0
 */
class WeightUnit
{
    use HasConstants;
    public const GRAM = 'g';
    public const KILOGRAM = 'kg';
    public const POUND = 'lb';
    public const OUNCE = 'oz';
}
