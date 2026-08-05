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
     */
    public const HEADER_TOKEN = 'x-cart-token';

    /**
     * Cookie name for the cart token.
     *
     * @since 1.0.0
     */
    public const COOKIE_TOKEN = 'ke_cart_token';
}
