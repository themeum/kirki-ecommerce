<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\Cart as CartModel;
use Kirki\Ecommerce\App\Models\CartItem;
use Kirki\Ecommerce\App\DTO\Cart\AddToCartDTO;
use Kirki\Ecommerce\App\DTO\Cart\EmptyCartDTO;
use Kirki\Ecommerce\App\DTO\Cart\RemoveCartItemDTO;
use Kirki\Ecommerce\App\DTO\Cart\UpdateCartDTO;
use Exception;
use Kirki\Ecommerce\App\Constants\Cart;

use function Kirki\Ecommerce\App\base_currency;
use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\user;
use function Kirki\Ecommerce\Framework\uuid;

class CartService
{
    public function get_cart($customer_id = null, $token = null)
    {
        $cart = null;

        if ($customer_id) {
            $cart = $this->find_by_customer($customer_id);
        }

        if (!$cart && $token) {
            $cart = $this->find_by_token($token);
        }

        if ($cart && $customer_id && !$cart->customer_id) {
            $this->update_cart($cart->id, ['customer_id' => $customer_id]);
        }

        return $cart;
    }

    protected function find_by_token($token)
    {
        return CartModel::where('cart_token', $token)->with([
            'items' => ['product' => ['media', 'categories'], 'variant' => ['media']]
        ])->order_by('id', 'desc')->first();
    }

    /**
     * Update cart by token
     *
     * @since 1.0.0
     *
     * @param string $token
     * @param array $data
     *
     * @return CartModel|null
     */
    protected function update_by_token($token, array $data)
    {
        $cart = $this->find_by_token($token);

        if ($cart) {
            $cart->update($data);
            return $this->find($cart->id);
        }

        return null;
    }

    protected function find_by_customer($customer_id)
    {
        return CartModel::where('customer_id', $customer_id)->with([
            'items' => ['product' => ['media', 'categories'], 'variant' => ['media', 'attribute_values', 'available_quantity']]
        ])->order_by('id', 'desc')->first();
    }

    protected function create_cart(array $data)
    {
        return CartModel::create($data);
    }

    protected function update_cart($id, array $data)
    {
        $cart = $this->find($id);

        if ($cart) {
            $cart->update($data);

            return $this->find($id);
        }

        return null;
    }

    protected function add_item_to_cart($cart_id, array $item_data)
    {
        return CartItem::create(array_merge(['cart_id' => $cart_id], $item_data));
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

        return $this->create_cart($data)->load_missing('items', 'items.product', 'items.variant');
    }

    public function find_item_in_cart($cart_id, $variant_id = null)
    {
        return CartItem::where('cart_id', $cart_id)
            ->where('variant_id', $variant_id)
            ->first();
    }

    public function add_item(AddToCartDTO $dto)
    {
        $cart = $this->get_cart($dto->customer_id, $dto->token);

        if (empty($cart)) {
            $cart = $this->create_new_cart($dto->customer_id);
        }

        $cart_id = $cart->id;

        $existing_item = $this->find_item_in_cart($cart_id, $dto->variant_id);

        if ($existing_item) {
            $new_quantity = $existing_item->quantity + $dto->quantity;
            $this->update_item_quantity($cart_id, $existing_item->id, $new_quantity);
        } else {
            $this->add_item_to_cart($cart_id, $dto->to_array());
        }

        return $this->find($cart_id);
    }

    public function update_item_quantity($cart_id, $item_id, $quantity)
    {
        $item = $this->find_item($item_id);

        if (!$item) {
            throw new Exception(__('Cart item not found.', 'kirki-ecommerce'));
        }

        if ((int) $item->cart_id !== (int) $cart_id) {
            throw new Exception(__('Unauthorized action.', 'kirki-ecommerce'));
        }

        return $this->update_item($item_id, ['quantity' => $quantity]);
    }

    public function find_item($item_id)
    {
        return CartItem::find($item_id);
    }

    public function update_item($item_id, array $data)
    {
        return CartItem::query()->where('id', $item_id)->update($data);
    }

    public function partial_update($cart_id, array $data)
    {
        return $this->update_cart($cart_id, $data);
    }

    public function remove_item(RemoveCartItemDTO $dto)
    {
        $cart = $this->get_cart($dto->customer_id, $dto->token);

        if (empty($cart)) {
            $cart = $this->create_new_cart($dto->customer_id);
        }

        $item = $this->find_item($dto->item_id);

        if (!$item) {
            throw new Exception(__('Cart item not found.', 'kirki-ecommerce'));
        }

        if ((int) $item->cart_id !== (int) $cart->id) {
            throw new Exception(__('Unauthorized action.', 'kirki-ecommerce'));
        }

        return CartItem::destroy($item->id);
    }

    public function empty_cart(EmptyCartDTO $dto)
    {
        $cart = $this->get_cart($dto->customer_id, $dto->token);

        if (empty($cart)) {
            $cart = $this->create_new_cart($dto->customer_id);
        }

        CartModel::where('id', $cart->id)->delete();

        return null;
    }

    public function find($cart_id)
    {
        return CartModel::with([
            'items' => ['product' => ['media', 'categories'], 'variant' => ['media']]
        ])->find($cart_id);
    }

    /**
     * Get cookie cart token.
     *
     * @since 1.0.0
     *
     * @return string|null
     */
    public function get_cookie_cart_token(): ?string
    {
        return sanitize_text_field($_COOKIE[Cart::COOKIE_TOKEN] ?? null);
    }

    /**
     * Get current cart.
     *
     * Resolves the cart for the current session: by customer ID
     * for logged-in users, or by guest cart token from cookie.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\App\Models\Cart
     */
    public function get_current_cart()
    {
        $customer_id = null;
        $cart_token = null;

        if (is_user_logged_in()) {
            $customer_id = customer()->get_customer_id();
            if (!$customer_id) {
                $cart_token = $this->get_cookie_cart_token();
            }
        } else {
            $cart_token = $this->get_cookie_cart_token();
        }

        return $this->get_cart($customer_id, $cart_token);
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
