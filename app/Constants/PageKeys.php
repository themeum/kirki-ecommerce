<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

defined('ABSPATH') || exit;

class PageKeys
{
    use HasConstants;

    public const SHOP = 'shop';
    public const CART = 'cart';
    public const CHECKOUT = 'checkout';
    public const ACCOUNT = 'account';

    /**
     * Get all pages with key, label pair.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    public static function get_list()
    {
        return [
            self::SHOP => __('Shop', 'kirki-ecommerce'),
            self::CART => __('Cart', 'kirki-ecommerce'),
            self::CHECKOUT => __('Checkout', 'kirki-ecommerce'),
            self::ACCOUNT => __('Account', 'kirki-ecommerce'),
        ];
    }
}
