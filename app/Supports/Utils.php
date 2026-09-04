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

use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Http\Controllers\Site\AccountController;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Framework\Sanitizer;
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
        // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This method IS the nonce check (wp_verify_nonce() below); it must read the raw request to extract the nonce value before verifying it. Sanitizer::apply_rule() is this project's own sanitization dispatcher (see phpcs-wporg.xml.dist's note on WordPress.Security.ValidatedSanitizedInput) - WPCS can't statically recognize a static method call as a sanitizer.
        $request_method = !$request_method ? Sanitizer::apply_rule(wp_unslash($_SERVER['REQUEST_METHOD'] ?? ''), Sanitizer::TEXT) : $request_method;
        // phpcs:ignore WordPress.Security.NonceVerification.Missing -- This method IS the nonce check (wp_verify_nonce() below); it must read the raw request to extract the nonce value before verifying it.
        $data = strtolower($request_method) === 'post' ? $_POST : $_GET;
        $nonce_value = Sanitizer::apply_rule(wp_unslash(Arr::get($data, 'kecom_nonce', '')), Sanitizer::TEXT);

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
     * Get account route config.
     *
     * @since 1.0.0
     *
     * @return array The account route config.
     */
    public static function get_account_route_config()
    {
        $account_page_id = Utils::get_account_page_id();
        $account_page = get_post($account_page_id);
        $account_page_slug = !empty($account_page) ? $account_page->post_name : 'account';

        $route_config = [
            'action' => [
                'url'       => Url::get_account_url('action'),
                'hook'      => 'template_redirect',
                'priority'  => 1,
                'route_path' => $account_page_slug . '/action',
                'route_name' => 'account.action',
                'callback'  => [AccountController::class, 'action'],
                'is_menu'   => false,
            ],
            'dashboard' => [
                'title'     => __('Dashboard', 'kirki-ecommerce'),
                'icon'      => 'dashboard',
                'url'       => Url::get_account_url(),
                'is_active' => Route::is('account'),
                'route_path' => $account_page_slug,
                'route_name' => 'account',
                'callback'  => [AccountController::class, 'dashboard'],
                'is_menu'   => true,
            ],
            'orders' => [
                'title'     => __('Orders', 'kirki-ecommerce'),
                'icon'      => 'box',
                'url'       => Url::get_account_url('orders'),
                'is_active' => Route::is('account.orders') || Route::is('account.orders.details'),
                'route_path' => $account_page_slug . '/orders',
                'route_name' => 'account.orders',
                'callback'  => [AccountController::class, 'orders'],
                'is_menu'   => true,
            ],
            'orders.show' => [
                'title'     => __('Order Details', 'kirki-ecommerce'),
                'route_path' => $account_page_slug . '/orders/{uuid}',
                'route_name' => 'account.orders.details',
                'callback'  => [AccountController::class, 'order_details'],
            ],
            'addresses' => [
                'title'     => __('Addresses', 'kirki-ecommerce'),
                'icon'      => 'map-pin',
                'url'       => Url::get_account_url('addresses'),
                'is_active' => Route::is('account.addresses'),
                'route_path' => $account_page_slug . '/addresses',
                'route_name' => 'account.addresses',
                'callback'  => [AccountController::class, 'addresses'],
                'is_menu'   => true,
            ],
            'manage' => [
                'title'     => __('Account', 'kirki-ecommerce'),
                'icon'      => 'user',
                'url'       => Url::get_account_url('manage'),
                'is_active' => Route::is('account.manage'),
                'route_path' => $account_page_slug . '/manage',
                'route_name' => 'account.manage',
                'callback'  => [AccountController::class, 'account_details'],
                'is_menu'   => true,
            ],
            'logout' => [
                'title'     => __('Log Out', 'kirki-ecommerce'),
                'icon'      => 'log-out',
                'url'       => wp_logout_url(Url::get_login_url()),
                'is_active' => false,
                'class'     => 'kecom-account-nav-link-logout',
                'is_menu'   => true,
            ],
        ];

        $route_config = apply_filters('kirki_ecommerce_account_route_config', $route_config);

        return $route_config;
    }

    /**
     * Get account menu items.
     *
     * @since 1.0.0
     *
     * @return array The account menu items.
     */
    public static function get_account_menu_items()
    {
        $route_config = static::get_account_route_config();
        $menu_items = [];

        foreach ($route_config as $key => $route) {
            if (isset($route['is_menu']) && $route['is_menu']) {
                $menu_items[$key] = $route;
            }
        }

        $menu_items = apply_filters('kirki_ecommerce_account_menu_items', $menu_items);

        return $menu_items;
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
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Genuine error path, not debug output; writes to the server's PHP error log rather than this plugin's own framework.log, which is not protected from direct web access.
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
     * Detect whether the current request is on the account page or any of its sub-pages.
     *
     * Usage:
     *   Utils::is_account_page();           // true for any account page/sub-page
     *   Utils::is_account_page('orders');   // true only on /account/orders
     *   Utils::is_account_page('orders/*'); // true on /account/orders/anything
     *
     * The $sub_path argument is matched against the URL path that follows the
     * account page's base path. A single `*` token acts as a wildcard that
     * matches any non-empty path segment(s).
     *
     * @since 1.0.0
     *
     * @param string|null $sub_path Optional sub-path to match. Supports `*` as
     *                              a wildcard (e.g. 'orders/*').
     *
     * @return bool
     */
    public static function is_account_page(?string $sub_path = null): bool
    {
        $account_page_id = static::get_account_page_id();

        if (!$account_page_id) {
            return false;
        }

        // Resolve the account page base path (e.g. "/account" or "/shop/account").
        $account_url  = get_permalink($account_page_id);
        $account_path = rtrim(wp_parse_url($account_url, PHP_URL_PATH), '/');

        // Current request path, stripped of query string.
        // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitizer::apply_rule() is this project's own sanitization dispatcher; WPCS can't statically recognize a static method call as a sanitizer.
        $request_uri = Sanitizer::apply_rule(wp_unslash($_SERVER['REQUEST_URI'] ?? ''), Sanitizer::TEXT);
        $current_path = rtrim(strtok($request_uri, '?'), '/');

        // No sub-path given: match the account root or any page beneath it.
        if ($sub_path === null) {
            return $current_path === $account_path
                || str_starts_with($current_path, $account_path . '/');
        }

        // Build the full expected path including the sub-path.
        $sub_path     = trim($sub_path, '/');
        $target_path  = $account_path . '/' . $sub_path;

        // When the sub-path contains a wildcard, convert to a regex pattern.
        if (str_contains($sub_path, '*')) {
            // Escape everything except `*`, then replace `*` with a regex
            // fragment that matches one or more path characters.
            $pattern = preg_quote($target_path, '#');
            $pattern = str_replace('\\*', '[^/]+(?:/[^/]+)*', $pattern);
            return (bool) preg_match('#^' . $pattern . '$#', $current_path);
        }

        return $current_path === $target_path;
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

    /**
     * Check if user can register.
     *
     * @since 1.0.0
     *
     * @return bool True if user can register, false otherwise.
     */
    public static function registration_enabled()
    {
        return (int) get_option('users_can_register', 0);
    }

    /**
     * Get status badge class.
     *
     * @since 1.0.0
     *
     * @param string $status The status.
     *
     * @return string The badge class.
     */
    public static function get_status_badge_class(string $status): string
    {
        switch ($status) {
            case FulfillmentStatus::PROCESSING:
                return 'kecom-badge-info-light';
            case FulfillmentStatus::SHIPPED:
                return 'kecom-badge-info-light';
            case FulfillmentStatus::CANCELLED:
                return 'kecom-badge-error-light';
            case FulfillmentStatus::ON_HOLD:
                return 'kecom-badge-caution-light';
            case FulfillmentStatus::UNFULFILLED:
                return 'kecom-badge-slate';
            case FulfillmentStatus::DELIVERED:
                return 'kecom-badge-success-light';
            case PaymentStatus::PAID:
                return 'kecom-badge-success-light';
            case PaymentStatus::UNPAID:
                return 'kecom-badge-warning-light';
            default:
                return 'kecom-badge-default';
        }
    }

    /**
     * Check guest checkout is enabled.
     *
     * @since 1.0.0
     *
     * @return bool True if guest checkout is enabled, false otherwise.
     */
    public static function guest_checkout_enabled()
    {
        //TODO: default will be false.
        return Settings::get('checkout.is_allowed_guest_checkout', true);
    }
}
