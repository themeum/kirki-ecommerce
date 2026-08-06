<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Repositories\CartRepository;
use Kirki\Ecommerce\App\DTO\Cart\AddToCartDTO;
use Kirki\Ecommerce\App\DTO\Cart\EmptyCartDTO;
use Kirki\Ecommerce\App\DTO\Cart\RemoveCartItemDTO;
use Kirki\Ecommerce\App\DTO\Cart\UpdateCartDTO;
use Exception;
use Kirki\Ecommerce\App\Constants\Cart;
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;

use function Kirki\Ecommerce\App\base_currency;
use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\user;
use function Kirki\Ecommerce\Framework\uuid;

class CartService
{
    protected $repository;
    public function __construct(CartRepository $repository)
    {
        $this->repository = $repository;
    }

    public function get_cart($customer_id = null, $token = null)
    {
        $cart = null;

        if ($customer_id) {
            $cart = $this->repository->find_by_customer($customer_id);
        }

        if (!$cart && $token) {
            $cart = $this->repository->find_by_token($token);
        }

        if (!$cart) {
            $cart = $this->create_new_cart($customer_id)->load('items', 'items.product', 'items.variant');
        }

        if ($cart && $customer_id && !$cart->customer_id) {
            $this->repository->update_cart($cart->id, ['customer_id' => $customer_id]);
        }

        if (empty($cart)) {
            throw new Exception(__('Cart not found.', 'kirki-ecommerce'));
        }

        return $cart;
    }

    protected function create_new_cart($customer_id = null)
    {

        $data = [
            'cart_token' => uuid(),
            'currency_code' => 'USD', //todo: Currency code, should be dynamic
            'base_currency_code' => base_currency()->code,
        ];

        if ($customer_id !== null) {
            $customer = customer(null, $customer_id);

            $data['customer_id'] = $customer_id;

            if (!empty($customer->get_shipping_address())) {
                $data['shipping_address'] = $customer->get_shipping_address()->to_array();
                if (!empty($data['shipping_address']['customer_id'])) {
                    unset($data['shipping_address']['customer_id']);
                }

                if (!empty($data['shipping_address']['id'])) {
                    unset($data['shipping_address']['id']);
                }

                if (!empty($data['shipping_address']['type'])) {
                    unset($data['shipping_address']['type']);
                }
            }

            if (!empty($customer->get_billing_address())) {
                $data['billing_address'] = $customer->get_billing_address()->to_array();

                if (!empty($data['billing_address']['customer_id'])) {
                    unset($data['billing_address']['customer_id']);
                }

                if (!empty($data['billing_address']['id'])) {
                    unset($data['billing_address']['id']);
                }

                if (!empty($data['billing_address']['type'])) {
                    unset($data['billing_address']['type']);
                }
            }
        }

        return $this->repository->create_cart($data);
    }

    public function find_item_in_cart($cart_id, $variant_id = null)
    {
        return $this->repository->find_item_in_cart($cart_id, $variant_id);
    }

    public function add_item(AddToCartDTO $dto)
    {
        $cart = $this->get_cart($dto->customer_id, $dto->token);
        $cart_id = $cart->id;

        $existing_item = $this->find_item_in_cart($cart_id, $dto->variant_id);

        if ($existing_item) {
            $new_quantity = $existing_item->quantity + $dto->quantity;
            $this->update_item_quantity($cart_id, $existing_item->id, $new_quantity);
        } else {
            $this->repository->add_item($cart_id, $dto->to_array());
        }

        return $this->repository->find($cart_id);
    }

    public function update_item_quantity($cart_id, $item_id, $quantity)
    {
        $item = $this->repository->find_item($item_id);

        if (!$item) {
            throw new Exception(__('Cart item not found.', 'kirki-ecommerce'));
        }

        if ((int) $item->cart_id !== (int) $cart_id) {
            throw new Exception(__('Unauthorized action.', 'kirki-ecommerce'));
        }

        return $this->repository->update_item($item_id, ['quantity' => $quantity]);
    }

    public function find_item($item_id)
    {
        return $this->repository->find_item($item_id);
    }

    public function update_item($item_id, array $data)
    {
        return $this->repository->update_item($item_id, $data);
    }

    public function partial_update($cart_id, array $data)
    {
        return $this->repository->update_cart($cart_id, $data);
    }

    public function remove_item(RemoveCartItemDTO $dto)
    {
        $cart = $this->get_cart($dto->customer_id, $dto->token);
        $item = $this->repository->find_item($dto->item_id);

        if (!$item) {
            throw new Exception(__('Cart item not found.', 'kirki-ecommerce'));
        }

        if ((int) $item->cart_id !== (int) $cart->id) {
            throw new Exception(__('Unauthorized action.', 'kirki-ecommerce'));
        }

        return $this->repository->remove_item($item->id);
    }

    public function empty_cart(EmptyCartDTO $dto)
    {
        $cart = $this->get_cart($dto->customer_id, $dto->token);

        $this->repository->empty_cart($cart->id);

        return $this->create_new_cart($dto->customer_id);
    }

    public function update_cart(UpdateCartDTO $dto)
    {
        $cart = $this->get_cart($dto->customer_id, $dto->token);

        return $this->repository->update_cart($cart->id, $dto->to_array());
    }

    public function find($cart_id)
    {
        return $this->repository->find($cart_id);
    }

    /**
     * Get guest cart token.
     *
     * @since 1.0.0
     *
     * @return string|null
     */
    public function get_guest_cart_token(): ?string
    {
        return sanitize_text_field($_COOKIE[Cart::COOKIE_TOKEN] ?? null);
    }

    /**
     * Get current cart.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\App\Models\Cart
     */
    public function get_current_cart()
    {
        $customerId = null;
        $cartToken = null;

        if (is_user_logged_in()) {
            $customer = customer();
            $customerId = $customer->get_customer_id();
        } else {
            $cartToken = $this->get_guest_cart_token();
        }

        return $this->get_cart($customerId, $cartToken);
    }

    /**
     * Delete guest cart cookie.
     *
     * @since 1.0.0
     */
    public function clear_guest_cart_cookie()
    {
        if (!headers_sent() && isset($_COOKIE[Cart::COOKIE_TOKEN])) {
            setcookie(Cart::COOKIE_TOKEN, '', time() - DAY_IN_SECONDS, '/');
            unset($_COOKIE[Cart::COOKIE_TOKEN]);
        }
    }

    /**
     * Ensure guest cart cookie.
     *
     * @since 1.0.0
     */
    public function ensure_guest_cart_cookie(): void
    {
        if (is_user_logged_in() || headers_sent()) {
            return;
        }

        $expires = time() + (DAY_IN_SECONDS * 30);
        $token = $this->get_guest_cart_token();

        if (!$token) {
            $cart = $this->get_cart();

            setcookie(Cart::COOKIE_TOKEN, $cart->cart_token, $expires, '/');
            $_COOKIE[Cart::COOKIE_TOKEN] = $cart->cart_token;

            return;
        }

        if (!$this->repository->find_by_token($token)) {
            $this->clear_guest_cart_cookie();
        }
    }

    /**
     * Sync guest cart with user cart after login.
     *
     * @since 1.0.0
     *
     * @param string $user_login user login.
     * @param \WP_User $user wp user object.
     *
     * @return void
     */
    public function sync_guest_cart(string $user_login, \WP_User $user): void
    {
        $current_user_id = $user->ID;
        $guest_cart_token = $this->get_guest_cart_token();

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

    /**
     * Get all variant IDs in the cart.
     *
     * @since 1.0.0
     *
     * @param int|null $customer_id
     * @param string|null $token
     *
     * @return array
     */
    public function get_cart_variant_ids($customer_id = null, $token = null): array
    {
        try {
            if ($customer_id == null && $token === null) {
                $cart = $this->get_current_cart();
            } else {
                $cart = $this->get_cart($customer_id, $token);
            }


            if ($cart && $cart->items) {
                $items = is_array($cart->items) ? $cart->items : $cart->items->all();
                return array_map(fn($item) => $item->variant_id, $items);
            }
        } catch (Exception $e) {
            return [];
        }

        return [];
    }
}
