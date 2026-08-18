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

use Kirki\Ecommerce\App\Http\Controllers\Site\AccountController;
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
        return Settings::get('advance.pages.shop', 0);
    }

    /**
     * Get site pages
     *
     * @since 1.0.0
     *
     * @return array The site pages.
     */
    public static function get_site_pages()
    {
        $pages = [
            'advance.pages.shop' => __('Shop', 'kirki-ecommerce'),
            'advance.pages.cart' => __('Cart', 'kirki-ecommerce'),
            'advance.pages.checkout' => __('Checkout', 'kirki-ecommerce'),
            'advance.pages.account' => __('Account', 'kirki-ecommerce'),
            'advance.pages.login' => __('Login', 'kirki-ecommerce'),
            'advance.pages.register' => __('Register', 'kirki-ecommerce'),
        ];

        $pages = apply_filters('kirki_ecommerce_site_pages', $pages);

        return $pages;
    }

    /**
     * Get account pages.
     *
     * @since 1.0.0
     *
     * @return array The account pages.
     */
    public static function get_account_pages()
    {
        $account_page_id = Utils::get_account_page_id();
        $account_page = get_post($account_page_id);
        $account_page_slug = !empty($account_page) ? $account_page->post_name : 'account';

        $pages = [
            'dashboard' => [
                'title' => __('Dashboard', 'kirki-ecommerce'),
                'icon'  => 'dashboard',
                'url' => Url::get_account_url(),
                'route_path' => $account_page_slug,
                'route_name' => 'account',
                'callback' => [AccountController::class, 'dashboard']
            ],
            'orders' => [
                'title' => __('Orders', 'kirki-ecommerce'),
                'icon'  => 'orders',
                'url' => Url::get_account_url('orders'),
                'route_path' => $account_page_slug . '/orders',
                'route_name' => 'account.orders',
                'callback' => [AccountController::class, 'orders']
            ],
            'addresses' => [
                'title' => __('Addresses', 'kirki-ecommerce'),
                'icon'  => 'addresses',
                'url' => Url::get_account_url('addresses'),
                'route_path' => $account_page_slug . '/addresses',
                'route_name' => 'account.addresses',
                'callback' => [AccountController::class,'addresses'],
            ],
            'account-details' => [
                'title' => __('Account Details', 'kirki-ecommerce'),
                'icon'  => 'account-details',
                'url' => Url::get_account_url('account-details'),
                'route_path' => $account_page_slug . '/account-details',
                'route_name' => 'account.account-details',
                'callback' => [AccountController::class,'account_details'],
            ],
        ];

        $pages = apply_filters('kirki_ecommerce_account_pages', $pages);

        return $pages;
    }

    /**
     * Generate site pages
     *
     * @since 1.0.0
     *
     * @return void
     *
     * @throws \Exception if page creation fails.
     */
    public static function generate_site_pages()
    {
        try {
            $pages = static::get_site_pages();

            foreach ($pages as $settings_key => $page_title) {
                $page_id = Settings::get($settings_key);

                if (empty($page_id)) {
                    $new_page = [
                        'post_title'   => $page_title,
                        'post_status'  => 'publish',
                        'post_type'    => 'page',
                        'post_content' => '',
                    ];

                    $page_id = wp_insert_post($new_page);
                    Settings::update($settings_key, $page_id);
                }
            }
        } catch (\Exception $e) {
            error_log('Error generating site pages: ' . $e->getMessage());
        }
    }

    /**
     * Get login page id.
     *
     * @since 1.0.0
     *
     * @return int The login page id.
     */
    public static function get_login_page_id()
    {
        return Settings::get('advance.pages.login', 0);
    }

    /**
     * Get registration page id.
     *
     * @since 1.0.0
     *
     * @return int The registration page id.
     */
    public static function get_registration_page_id()
    {
        return Settings::get('advance.pages.register', 0);
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
        return Settings::get('advance.pages.cart', 0);
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
        return Settings::get('advance.pages.checkout', 0);
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
        return Settings::get('advance.pages.account', 0);
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
        return Settings::get('advance.pages.design_system', 0);
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
