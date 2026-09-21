<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Fallback behaviours when an automatic exchange rate update fails.
 *
 * @since 1.0.0
 */
class CurrencyUpdateFallback
{
    use HasConstants;
    public const LAST_KNOWN_RATE = 'last_known_rate';
    public const BASE_CURRENCY = 'base_currency';
}
