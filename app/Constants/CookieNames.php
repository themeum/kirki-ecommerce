<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

class CookieNames
{
    use HasConstants;

    /**
     * Header name for the currency code.
     *
     * @since 1.0.0
     *
     * @var string
     */
    public const CURRENCY_CODE = 'kirki-ecommerce-currency-code';
}
