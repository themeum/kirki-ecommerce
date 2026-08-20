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

use Kirki\Ecommerce\Framework\Route;

/**
 * Class Url
 *
 * @since 1.0.0
 */
class Url
{
    /**
     * Get registration URL.
     *
     * @since 1.0.0
     *
     * @param string $slug
     *
     * @return string
     */
    public static function get_registration_url()
    {
        return Route::site_url('register');
    }

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
        return Route::site_url('shop.single', ['slug' => $slug]);
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
        return Route::site_url('shop');
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
        return Route::site_url('cart');
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
        return Route::site_url('checkout');
    }

    /**
     * Get checkout success URL.
     *
     * @since 1.0.0
     *
     * @param string $order_uuid order UUID.
     *
     * @return string
     */
    public static function get_checkout_success_url(string $order_uuid): string
    {
        return static::add_query_params(
            static::get_checkout_url(),
            [
                'order' => 'success',
                'uuid' => $order_uuid,
            ]
        );
    }

    /**
     * Get checkout fail URL.
     *
     * @since 1.0.0
     *
     * @param string $order_uuid order UUID.
     *
     * @return string
     */
    public static function get_checkout_failed_url(string $order_uuid): string
    {
        return static::add_query_params(
            static::get_checkout_url(),
            [
                'order' => 'failed',
                'uuid' => $order_uuid,
            ]
        );
    }

    /**
     * Get account URL.
     *
     * @since 1.0.0
     *
     * @param string|null $path Path to append to the account URL.
     *
     * @return string The account URL.
     */
    public static function get_account_url($path = null)
    {
        $url = Route::site_url('account');
        return $path ? $url . '/' . ltrim($path, '/') : $url;
    }

    /**
     * Get login URL.
     *
     * @since 1.0.0
     *
     * @param string $redirect
     *
     * @return string
     */
    public static function get_login_url($redirect = '')
    {
        $login_page_id = Utils::get_login_page_id();
        if ($login_page_id && get_post($login_page_id)) {
            $login_url = Route::site_url('login');
            if (!empty($redirect)) {
                $login_url = self::add_query_params($login_url, ['redirect' => urlencode($redirect)]);
            }
            return $login_url;
        }

        return wp_login_url($redirect);
    }

    /**
     * Add query params to URL.
     *
     * @since 1.0.0
     *
     * @param string $url URL.
     * @param array  $query_params Query params.
     *
     * @return string
     */
    public static function add_query_params($url, array $query_params = array()): string
    {
        $url = ltrim($url, '/');

        if (! empty($query_params)) {
            $url = add_query_arg($query_params, $url);
        }

        return $url;
    }

    /**
     * Remove query params from URL.
     *
     * @since 1.0.0
     *
     * @param string $url URL.
     * @param array  $query_params Query params.
     *
     * @return string
     */
    public static function remove_query_params($url, array $query_params = array()): string
    {
        return remove_query_arg($query_params, $url);
    }
}
