<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

final class StorefrontPages
{
    use HasConstants;

    const SHOP = 'shop';
    const CART = 'cart';
    const CHECKOUT = 'checkout';
    const ACCOUNT = 'account';

    /**
     * Title and slug for each storefront view, keyed by view identifier.
     *
     * The keys are the same identifiers used in the advance settings page map.
     *
     * @return array<string, array{title: string, slug: string}>
     */
    public static function definitions()
    {
        return [
            static::SHOP => [
                'title' => __('Shop', 'kirki-ecommerce'),
                'slug' => 'shop',
            ],
            static::CART => [
                'title' => __('Cart', 'kirki-ecommerce'),
                'slug' => 'cart',
            ],
            static::CHECKOUT => [
                'title' => __('Checkout', 'kirki-ecommerce'),
                'slug' => 'checkout',
            ],
            static::ACCOUNT => [
                'title' => __('My Account', 'kirki-ecommerce'),
                'slug' => 'my-account',
            ],
        ];
    }
}
