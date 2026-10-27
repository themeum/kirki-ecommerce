<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

defined('ABSPATH') || exit;

/**
 * Storefront locations where a consent notice can be shown.
 *
 * @since 1.0.0
 */
final class ConsentLocations
{
    use HasConstants;

    public const SIGNUP = 'signup';
    public const LOGIN = 'login';
    public const CHECKOUT = 'checkout';

    /**
     * Get all consent locations with key, label pair.
     *
     * @since 1.0.0
     *
     * @return array<string, string> Translated labels keyed by location.
     */
    public static function get_list()
    {
        return [
            static::SIGNUP => __('Signup page', 'kirki-ecommerce'),
            static::LOGIN => __('Login page', 'kirki-ecommerce'),
            static::CHECKOUT => __('Checkout', 'kirki-ecommerce'),
        ];
    }
}
