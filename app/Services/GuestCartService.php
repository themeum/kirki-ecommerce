<?php

/**
 * Guest Cart Service
 *
 * Handles guest-specific cart concerns: cookie management,
 * token resolution, and login synchronization.
 *
 * @package Kirki\Ecommerce\App\Services
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\Cart;

/**
 * Class GuestCartService
 *
 * @since 1.0.0
 */
class GuestCartService extends CartService
{
    /**
     * Set guest cart token in cookie.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function set_guest_cart_cookie(): void
    {
        if (!headers_sent()) {
            $expires = time() + (DAY_IN_SECONDS * 30);
            $cart = $this->get_cart();
            setcookie(Cart::COOKIE_TOKEN, $cart->cart_token, $expires, '/');
            $_COOKIE[Cart::COOKIE_TOKEN] = $cart->cart_token;
        }
    }

    /**
     * Clear guest cart cookie.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function clear_guest_cart_cookie(): void
    {
        if (!headers_sent() && isset($_COOKIE[Cart::COOKIE_TOKEN])) {
            setcookie(Cart::COOKIE_TOKEN, '', time() - DAY_IN_SECONDS, '/');
            unset($_COOKIE[Cart::COOKIE_TOKEN]);
        }
    }

    /**
     * Ensure guest cart cookie exists and is valid.
     *
     * Creates a new cookie if none exists, or refreshes it
     * if the token no longer maps to a valid cart.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function ensure_guest_cart_cookie(): void
    {
        if (is_user_logged_in() || headers_sent()) {
            return;
        }

        $token = $this->get_cookie_cart_token();

        if (!$token) {
            $this->set_guest_cart_cookie();
            return;
        }

        if (!$this->find_by_token($token)) {
            $this->clear_guest_cart_cookie();
            $this->set_guest_cart_cookie();
        }
    }
}
