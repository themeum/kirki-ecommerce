<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Units of length for product dimensions.
 *
 * @since 1.0.0
 */
class DimensionUnit
{
    use HasConstants;

    public const CM = 'cm';
    public const IN = 'in';
    public const MM = 'mm';
    public const M = 'm';
}
