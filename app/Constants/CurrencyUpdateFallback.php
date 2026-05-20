<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Concerns\HasConstants;

class CurrencyUpdateFallback
{
    use HasConstants;
    public const LAST_KNOWN_RATE = 'last_known_rate';
    public const BASE_CURRENCY = 'base_currency';
}
