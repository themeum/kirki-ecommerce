<?php

/**
 * URL Helper Class
 *
 * @package Kirki\Ecommerce\App\Supports
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Supports;

use Kirki\Ecommerce\App\Wordpress\SiteRoute;

/**
 * Class Url
 *
 * @since 1.0.0
 */
class Url
{
    /**
     * Get product URL.
     *
     * @since 1.0.0
     *
     * @param string $slug
     *
     * @return string
     */
    public static function get_product_url(string $slug)
    {
        return SiteRoute::url('shop.single', ['slug' => $slug]);
    }

    /**
     * Get shop URL.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public static function get_shop_url()
    {
        return SiteRoute::url('shop');
    }

    /**
     * Get cart URL.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public static function get_cart_url()
    {
        return SiteRoute::url('cart');
    }

    /**
     * Get checkout URL.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public static function get_checkout_url()
    {
        return SiteRoute::url('checkout');
    }

    /**
     * Get account URL.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public static function get_account_url()
    {
        return SiteRoute::url('account');
    }
}
