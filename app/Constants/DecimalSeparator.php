<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Decimal separator options for formatting currency values.
 *
 * @since 1.0.0
 */
class DecimalSeparator
{
    use HasConstants;
    const DOT = '.';
    const COMMA = ',';
    const SPACE = 'space';
}
