<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Display formats available for currency values.
 *
 * @since 1.0.0
 */
class CurrencyFormat
{
    use HasConstants;
    const LONG = 'long';
    const SHORT = 'short';
}
