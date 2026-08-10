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
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\app;

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

        if (!$this->repository->find_by_token($token)) {
            $this->clear_guest_cart_cookie();
            $this->set_guest_cart_cookie();
        }
    }

    /**
     * Sync guest cart with user cart after login.
     *
     * Assigns the guest cart (identified by cookie token) to the
     * logged-in customer, creating a customer record if needed.
     *
     * @since 1.0.0
     *
     * @param string $user_login Username.
     * @param \WP_User $user WP user object.
     *
     * @return void
     */
    public function sync_guest_cart(string $user_login, \WP_User $user): void
    {
        $current_user_id = $user->ID;
        $guest_cart_token = $this->get_cookie_cart_token();

        if (!$guest_cart_token) {
            return;
        }

        $customer_id = null;
        $customer = customer($current_user_id)->get_customer();

        /**
         * If existing user has no customer record
         * First create the record with WP user id.
         */
        if (!$customer) {
            $customer_service = app(CustomerService::class);
            $dto = app(CreateCustomerDTO::class);
            $dto->user_id = $current_user_id;
            $dto->first_name = $user->first_name;
            $dto->last_name = $user->last_name;
            $dto->email = $user->user_email;
            $dto->created_by = $current_user_id;
            $dto->updated_by = $current_user_id;

            $customer = $customer_service->create($dto);
            $customer_id = $customer->id;
        } else {
            $customer_id = $customer->id;
        }

        $this->repository->update_by_token($guest_cart_token, ['customer_id' => $customer_id]);
        $this->clear_guest_cart_cookie();
    }
}
