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
 * Builds storefront and admin URLs for the plugin's pages.
 *
 * @since 1.0.0
 */
class Url
{
    /**
     * Get the WordPress registration URL.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public static function get_registration_url()
    {
        return wp_registration_url();
    }

    /**
     * Get the storefront URL of a product.
     *
     * @since 1.0.0
     *
     * @param string $slug Product slug.
     * @return string
     */
    public static function get_product_url(string $slug)
    {
        return Route::site_url('shop.single', ['slug' => $slug]);
    }

    /**
     * Get the placeholder image URL used for products without an image.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public static function get_product_fallback_image()
    {
        return Assets::get_url('images/product-fallback.webp');
    }

    /**
     * Get the storefront order tracking URL of an order.
     *
     * @since 1.0.0
     *
     * @param string $order_uuid Order UUID.
     * @return string
     */
    public static function get_order_tracking_url(string $order_uuid)
    {
        return Route::site_url('order_tracking', ['uuid' => $order_uuid]);
    }

    /**
     * Get the storefront shop page URL.
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
     * Get the storefront cart page URL.
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
     * Get the storefront checkout page URL.
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
     * Get the checkout URL carrying a successful order result.
     *
     * @since 1.0.0
     *
     * @param string $order_uuid Order UUID.
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
     * Get the checkout URL carrying a failed order result.
     *
     * @since 1.0.0
     *
     * @param string $order_uuid Order UUID.
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
     * Get the storefront account page URL.
     *
     * @since 1.0.0
     *
     * @param string|null $path Path to append to the account URL.
     * @return string The account URL.
     */
    public static function get_account_url($path = null)
    {
        $url = Route::site_url('account');
        return $path ? $url . '/' . ltrim($path, '/') : $url;
    }

    /**
     * Get the WordPress login URL.
     *
     * @since 1.0.0
     *
     * @param string $redirect URL to send the user to after logging in.
     * @return string
     */
    public static function get_login_url($redirect = '')
    {
        return wp_login_url($redirect);
    }

    /**
     * Get the admin edit URL for a product.
     *
     * @since 1.0.0
     *
     * @param int $product_id
     * @return string
     */
    public static function get_product_edit_url($product_id)
    {
        return admin_url('admin.php?page=kirki-ecommerce#/products/' . $product_id);
    }

    /**
     * Get the admin edit URL for an order.
     *
     * @since 1.0.0
     *
     * @param int $order_id
     * @return string
     */
    public static function get_order_edit_url($order_id)
    {
        return admin_url('admin.php?page=kirki-ecommerce#/orders/' . $order_id);
    }

    /**
     * Add query params to a URL.
     *
     * Also strips any leading slash from the URL.
     *
     * @since 1.0.0
     *
     * @param string               $url          URL.
     * @param array<string, mixed> $query_params Query params.
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
     * Remove query params from a URL.
     *
     * @since 1.0.0
     *
     * @param string   $url          URL.
     * @param string[] $query_params Names of the query params to remove.
     * @return string
     */
    public static function remove_query_params($url, array $query_params = array()): string
    {
        return remove_query_arg($query_params, $url);
    }
}
