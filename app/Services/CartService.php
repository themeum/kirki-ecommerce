<?php

namespace Kirki\Ecommerce\App\Services;

use Exception;
use Kirki\Ecommerce\App\Constants\Cart as CartConstants;
use Kirki\Ecommerce\App\DTO\Cart\AddToCartDTO;
use Kirki\Ecommerce\App\DTO\Cart\EmptyCartDTO;
use Kirki\Ecommerce\App\DTO\Cart\RemoveCartItemDTO;
use Kirki\Ecommerce\App\Models\Cart as CartModel;
use Kirki\Ecommerce\App\Models\CartItem;
use Kirki\Ecommerce\Framework\Contracts\SomoyInterface;
use Kirki\Ecommerce\Framework\Exceptions\AuthorizationException;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\Cookie as CookieFacade;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;

use function Kirki\Ecommerce\App\base_currency;
use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\request;
use function Kirki\Ecommerce\Framework\uuid;

class CartService
{
    /**
     * Resolve the canonical cart for the given identity.
     *
     * For an authenticated shopper, this also adopts or merges any
     * anonymous guest cart found via the token into their owned cart.
     *
     * @param int|null $user_id
     * @param string|null $token
     * @return CartModel|null
     */
    public function get_cart($user_id = null, $token = null)
    {
        $user_id = !empty($user_id) ? $user_id : null;

        if ($user_id) {
            return $this->resolve_owned_cart($user_id, $token);
        }

        if (!$token) {
            return null;
        }

        $guest_cart = $this->find_by_token($token);

        if (!$guest_cart) {
            $this->forget_cart_cookie();
        }

        return $guest_cart;
    }

    protected function resolve_owned_cart(int $user_id, ?string $token = null)
    {
        $owned_cart = $this->find_by_user($user_id);
        $guest_cart = $token ? $this->find_by_token($token) : null;

        if (!$guest_cart && $token) {
            $this->forget_cart_cookie();
        }

        if (!$guest_cart) {
            return $owned_cart;
        }

        if (!$owned_cart) {
            return $this->adopt_guest_cart($guest_cart, $user_id);
        }

        return $this->merge_guest_cart_into_owned_cart($guest_cart, $owned_cart);
    }

    protected function find_by_token($token = null)
    {
        if (empty($token)) {
            return null;
        }

        $cart = CartModel::where('cart_token', $token)
            ->with($this->cart_relations())
            ->first();

        if (!$cart || $this->is_expired($cart) || !empty($cart->user_id)) {
            return null;
        }

        return $cart;
    }

    protected function find_by_user($user_id)
    {
        if (empty($user_id)) {
            return null;
        }

        return CartModel::where('user_id', (int) $user_id)
            ->with($this->cart_relations())
            ->first();
    }

    protected function create_cart(array $data)
    {
        $this->assert_single_owner_identity($data);

        if(empty($data['user_id'])){
            return CartModel::create($data);
        }

        $customer = customer($data['user_id']);
        
        if(!empty($customer)){
            $data['shipping_address'] = $customer->get_shipping_address();
            $data['billing_address'] = $customer->get_billing_address();
        }

        return CartModel::create($data);
    }

    protected function update_cart($id, array $data)
    {
        $cart = CartModel::find($id);

        if (empty($cart)) {
            return null;
        }

        $this->assert_single_owner_identity(array_merge($cart->to_array(), $data));

        $cart->update($data);

        return $this->find($id);
    }

    protected function add_item_to_cart($cart_id, array $item_data)
    {
        return CartItem::create(array_merge(['cart_id' => $cart_id], $item_data));
    }

    protected function create_new_cart($user_id = null)
    {
        $data = [
            'currency_code' => base_currency()->code, // @todo: Implement currency selection in the future for multi-currency support
            'base_currency_code' => base_currency()->code,
        ];

        if (!empty($user_id)) {
            $data['user_id'] = (int) $user_id;
        } else {
            $data['cart_token'] = uuid();
            $data['expires_at'] = Date::now()->add_minutes(CartConstants::COOKIE_TOKEN_EXPIRE_IN_MINUTES);
        }

        $cart = $this->create_cart($data)->load_missing('items', 'items.product', 'items.variant');

        if (empty($user_id) && !empty($cart->cart_token)) {
            $this->create_cart_cookie($cart->cart_token);
        }

        return $cart;
    }

    public function find_item_in_cart(int $cart_id, int $variant_id)
    {
        return CartItem::where('cart_id', $cart_id)
            ->where('variant_id', $variant_id)
            ->first();
    }

    public function add_item(AddToCartDTO $dto)
    {
        $cart = $this->get_cart($dto->user_id, $dto->token);

        if (empty($cart)) {
            $cart = $this->create_new_cart($dto->user_id);
        }

        $cart_id = $cart->id;

        $existing_item = $this->find_item_in_cart($cart_id, $dto->variant_id);

        if ($existing_item) {
            $new_quantity = $existing_item->quantity + $dto->quantity;
            $this->update_item_quantity($cart_id, $existing_item->id, $new_quantity);
        } else {
            $this->add_item_to_cart($cart_id, [
                'product_id' => $dto->product_id,
                'variant_id' => $dto->variant_id,
                'quantity' => $dto->quantity,
            ]);
        }

        return $this->find($cart_id);
    }

    public function update_item_quantity($cart_id, $item_id, $quantity)
    {
        $item = $this->find_item($item_id);

        if (!$item) {
            throw new Exception(__('Cart item not found.', 'kirki-ecommerce'));
        }

        if ($item->cart_id !== $cart_id) {
            throw new AuthorizationException(__('Unauthorized action.', 'kirki-ecommerce'), Response::FORBIDDEN);
        }

        return $this->update_item($item_id, ['quantity' => $quantity]);
    }

    public function find_item($item_id)
    {
        return CartItem::find($item_id);
    }

    public function update_item($item_id, array $data)
    {
        $item = $this->find_item($item_id);

        if (empty($item)) {
            return false;
        }

        return $item->update($data);
    }

    public function partial_update(int $cart_id, array $data)
    {
        return $this->update_cart($cart_id, $data);
    }

    public function remove_item(RemoveCartItemDTO $dto)
    {
        $cart = $this->get_cart($dto->user_id, $dto->token);

        if (empty($cart)) {
            throw new Exception(__('Cart not found.', 'kirki-ecommerce'));
        }

        $item = $this->find_item($dto->item_id);

        if (!$item) {
            throw new Exception(__('Cart item not found.', 'kirki-ecommerce'));
        }

        if ($item->cart_id !== $cart->id) {
            throw new AuthorizationException(__('Unauthorized action.', 'kirki-ecommerce'), Response::FORBIDDEN);
        }

        $is_last_item = $cart->items->count() === 1;

        if ($is_last_item) {
            return $cart->delete();
        }

        return CartItem::destroy($item->id);
    }

    public function empty_cart(EmptyCartDTO $dto)
    {
        $cart = $this->get_cart($dto->user_id, $dto->token);

        if (!empty($cart)) {
            CartModel::where('id', $cart->id)->delete();
        }

        if (empty($dto->user_id)) {
            $this->forget_cart_cookie();
        }

        return null;
    }

    public function find(int $cart_id)
    {
        return CartModel::with($this->cart_relations())->find($cart_id);
    }

    protected function get_cookie_cart_token(): ?string
    {
        return Sanitizer::apply_rule(request()->cookie(CartConstants::COOKIE_TOKEN), Sanitizer::TEXT);
    }

    public function get_current_cart()
    {
        $user_id = is_user_logged_in() ? (int) get_current_user_id() : null;
        $cart_token = $this->get_cookie_cart_token();

        return $this->get_cart($user_id, $cart_token);
    }

    public function get_cart_variant_ids($token = null): array
    {
        try {
            $cart = $token === null ? $this->get_current_cart() : $this->get_cart(null, $token);

            if ($cart && $cart->items) {
                $items = is_array($cart->items) ? $cart->items : $cart->items->all();
                return array_map(fn($item) => $item->variant_id, $items);
            }
        } catch (Exception $e) {
            return [];
        }

        return [];
    }

    protected function adopt_guest_cart(CartModel $guest_cart, int $user_id)
    {
        $cart = $this->update_cart($guest_cart->id, [
            'user_id' => $user_id,
            'cart_token' => null,
            'expires_at' => null,
        ]);

        $this->forget_cart_cookie();

        return $cart;
    }

    protected function merge_guest_cart_into_owned_cart(CartModel $guest_cart, CartModel $owned_cart)
    {
        DB::begin_transaction();

        try {
            $owned_items = [];

            foreach ($owned_cart->items as $item) {
                $owned_items[$item->variant_id] = $item;
            }

            foreach ($guest_cart->items as $guest_item) {
                $variant_id = $guest_item->variant_id;
                $existing_item = $owned_items[$variant_id] ?? null;

                if ($existing_item) {
                    $this->update_item($existing_item->id, ['quantity' => $guest_item->quantity]);
                    continue;
                }

                $guest_item->update([
                    'cart_id' => $owned_cart->id,
                ]);
            }

            CartModel::where('id', $guest_cart->id)->delete();

            DB::commit();

            $this->forget_cart_cookie();

            return $this->find($owned_cart->id);
        } catch (Exception $e) {
            DB::rollback();
            throw $e;
        }
    }

    protected function assert_single_owner_identity(array $data): void
    {
        if (!empty($data['user_id']) && !empty($data['cart_token'])) {
            throw new ValidationException(__('A cart cannot have both user and guest token ownership.', 'kirki-ecommerce'), Response::UNPROCESSABLE_ENTITY);
        }
    }

    protected function create_cart_cookie(string $token): void
    {
        CookieFacade::queue(CartConstants::COOKIE_TOKEN, $token, CartConstants::COOKIE_TOKEN_EXPIRE_IN_MINUTES);
    }

    protected function forget_cart_cookie(): void
    {
        CookieFacade::expire(CartConstants::COOKIE_TOKEN);
    }

    protected function is_expired(CartModel $cart): bool
    {
        if (empty($cart->expires_at)) {
            return false;
        }

        if ($cart->expires_at instanceof SomoyInterface) {
            return $cart->expires_at->get_timestamp() < time();
        }

        return strtotime((string) $cart->expires_at) < time();
    }

    protected function cart_relations(): array
    {
        return [
            'items' => [
                'product' => ['media', 'categories'],
                'variant' => ['media', 'attribute_values', 'available_quantity'],
            ],
        ];
    }
}
