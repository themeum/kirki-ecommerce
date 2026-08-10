<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

class Cart
{
    use HasConstants;

    /**
     * Header name for the cart token.
     *
     * @since 1.0.0
     *
     * @var string
     */
    public const HEADER_TOKEN = 'kecom-cart-token';

    /**
     * Cookie name for the cart token.
     *
     * @since 1.0.0
     *
     * @var string
     */
    public const COOKIE_TOKEN = 'kecom_cart_token';

    /**
     * Header name for the skip tax.
     *
     * @since 1.0.0
     *
     * @var string
     */
    public const HEADER_SKIP_TAX = 'kecom-should-skip-tax';
}
