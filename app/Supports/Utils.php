<?php

/**
 * Utility Functions
 *
 * @package Kirki\Ecommerce\App\Supports
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Supports;

use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Arr;

/**
 * Class Utils
 *
 * @since 1.0.0
 */
class Utils
{
    /**
     * Check nonce is valid or not.
     *
     * @since 1.0.0
     *
     * @param string $request_method request method.
     *
     * @return bool
     */
    public static function is_nonce_verified($request_method = null): bool
    {
        $request_method = !$request_method ? sanitize_text_field($_SERVER['REQUEST_METHOD']) : $request_method;
        $data = strtolower($request_method) === 'post' ? $_POST : $_GET;
        $nonce_value = sanitize_text_field(Arr::get($data, 'ajax_nonce'));

        return wp_verify_nonce($nonce_value, 'kirki_ecommerce_nonce') !== false;
    }

    /**
     * Get shop page id.
     *
     * @since 1.0.0
     *
     * @return int The shop page id.
     */
    public static function get_shop_page_id()
    {
        return Settings::get('advance.pages.shop_page', 0);
    }

    /**
     * Get cart page id.
     *
     * @since 1.0.0
     *
     * @return int The cart page id.
     */
    public static function get_cart_page_id()
    {
        return Settings::get('advance.pages.cart_page', 0);
    }

    /**
     * Get checkout page id.
     *
     * @since 1.0.0
     *
     * @return int The checkout page id.
     */
    public static function get_checkout_page_id()
    {
        return Settings::get('advance.pages.checkout_page', 0);
    }

    /**
     * Get account page id.
     *
     * @since 1.0.0
     *
     * @return int The account page id.
     */
    /**
     * Get account page id.
     *
     * @since 1.0.0
     *
     * @return int The account page id.
     */
    public static function get_account_page_id()
    {
        return Settings::get('advance.pages.account_page', 0);
    }

    /**
     * Get design system page id.
     *
     * @since 1.0.0
     *
     * @return int The design system page id.
     */
    public static function get_design_system_page_id()
    {
        return Settings::get('advance.pages.design_system_page', 0);
    }

    /**
     * Get countries.
     *
     * @since 1.0.0
     *
     * @return mixed The country list.
     */
    public static function get_countries()
    {
        $countries_json = file_get_contents(plugin_dir_path(__FILE__) . '../../resources/data/countries.json');
        return json_decode($countries_json, true);
    }
}
