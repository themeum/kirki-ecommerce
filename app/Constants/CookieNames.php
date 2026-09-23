<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Names of cookies set by the plugin.
 *
 * @since 1.0.0
 */
class CookieNames
{
    use HasConstants;

    /**
     * Cookie name for the currency.
     *
     * @since 1.0.0
     *
     * @var string
     */
    public const CURRENCY = 'kecom_currency';
}
