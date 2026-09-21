<?php

namespace Kirki\Ecommerce\App\Services;

use Exception;
use Kirki\Ecommerce\App\Constants\Cart as CartConstants;
use Kirki\Ecommerce\App\DTO\Cart\CreateCartItemDTO;
use Kirki\Ecommerce\App\DTO\Cart\EmptyCartDTO;
use Kirki\Ecommerce\App\DTO\Cart\RemoveCartItemDTO;
use Kirki\Ecommerce\App\Models\Cart as CartModel;
use Kirki\Ecommerce\App\Models\CartCoupon;
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
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\uuid;

/**
 * Manages the shopper's cart: lookup, guest cart adoption and merge, items and coupons.
 *
 * @since 1.0.0
 */
class CartService
{
    /**
     * Resolve the canonical cart for the given identity.
     *
     * For an authenticated shopper, this also adopts or merges any
     * anonymous guest cart found via the token into their owned cart.
     *
     * @since 1.0.0
     *
     * @param int|null    $user_id Authenticated user ID, if any.
     * @param string|null $token   Guest cart token.
     * @return CartModel|null Null when no cart exists.
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

    /**
     * Resolve the canonical cart for the given identity, creating a new
     * one if none exists.
     *
     * @since 1.0.0
     *
     * @param int|null    $user_id Authenticated user ID, if any.
     * @param string|null $token   Guest cart token.
     * @return CartModel
     */
    public function get_or_create_cart($user_id = null, $token = null)
    {
        $cart = $this->get_cart($user_id, $token);

        if (empty($cart)) {
            $cart = $this->create_new_cart($user_id);
        }

        return $cart;
    }

    /**
     * Resolve an authenticated user's cart, absorbing any guest cart from the token.
     *
     * Adopts the guest cart when the user has none, merges it into the user's
     * cart otherwise, and clears the cart cookie when the token matches no guest cart.
     *
     * @since 1.0.0
     *
     * @param int         $user_id User ID.
     * @param string|null $token   Guest cart token.
     * @return CartModel|null Null when neither cart exists.
     */
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

    /**
     * Find an unexpired guest cart by its token.
     *
     * @since 1.0.0
     *
     * @param string|null $token Guest cart token.
     * @return CartModel|null Null when the token is empty or unknown, the cart has expired, or it already belongs to a user.
     */
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

    /**
     * Find the cart owned by a user.
     *
     * @since 1.0.0
     *
     * @param int|string|null $user_id User ID.
     * @return CartModel|null
     */
    protected function find_by_user($user_id)
    {
        if (empty($user_id)) {
            return null;
        }

        return CartModel::where('user_id', (int) $user_id)
            ->with($this->cart_relations())
            ->first();
    }

    /**
     * Create a cart from the given attributes.
     *
     * For a user cart, the customer's default shipping and billing addresses
     * are copied onto the new cart.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $data Cart attributes.
     * @return CartModel
     */
    protected function create_cart(array $data)
    {
        $this->assert_single_owner_identity($data);

        if (empty($data['user_id'])) {
            return CartModel::create($data);
        }

        $customer = customer($data['user_id']);

        if (!empty($customer->get_customer_id())) {
            $shipping_address = $customer->get_shipping_address();
            $billing_address = $customer->get_billing_address();
            $is_billing_same_as_shipping = ($shipping_address ? $shipping_address['id'] : null) === ($billing_address ? $billing_address['id'] : null);

            $data['shipping_address'] = $shipping_address;
            $data['is_billing_same_as_shipping'] = $is_billing_same_as_shipping;

            if (!$data['is_billing_same_as_shipping']) {
                $data['billing_address'] = $billing_address;
            }
        }

        return CartModel::create($data);
    }

    /**
     * Update a cart's attributes.
     *
     * @since 1.0.0
     *
     * @param int                  $id   Cart ID.
     * @param array<string, mixed> $data Attributes to change.
     * @return CartModel|null The refreshed cart, or null when it does not exist.
     */
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

    /**
     * Add a line item to a cart.
     *
     * @since 1.0.0
     *
     * @param CreateCartItemDTO $dto Item data.
     * @return CartItem
     */
    public function add_item_to_cart(CreateCartItemDTO $dto)
    {
        return CartItem::create($dto->to_array());
    }

    /**
     * Create an empty cart in the base currency for a user or a new guest.
     *
     * A guest cart gets a fresh token, an expiry, and the token cookie is queued.
     *
     * @since 1.0.0
     *
     * @param int|null $user_id User ID; null creates a guest cart.
     * @return CartModel
     */
    protected function create_new_cart($user_id = null)
    {
        $data = [
            'currency_code' => base_currency()->code, // @todo: Implement currency selection in the future for multi-currency support
            'base_currency_code' => base_currency()->code,
            'is_billing_same_as_shipping' => true,
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

    /**
     * Find the line item for a variant in a cart.
     *
     * @since 1.0.0
     *
     * @param int $cart_id    Cart ID.
     * @param int $variant_id Variant ID.
     * @return CartItem|null
     */
    public function find_item_in_cart(int $cart_id, int $variant_id)
    {
        return CartItem::where('cart_id', $cart_id)
            ->where('variant_id', $variant_id)
            ->first();
    }

    /**
     * Set the quantity of an item after checking it belongs to the cart.
     *
     * @since 1.0.0
     *
     * @param int $cart_id  Cart ID the item must belong to.
     * @param int $item_id  Cart item ID.
     * @param int $quantity New quantity.
     * @return bool
     * @throws Exception When the item does not exist.
     * @throws AuthorizationException When the item belongs to another cart.
     */
    public function update_item_quantity($cart_id, $item_id, $quantity)
    {
        $item = $this->find_item($item_id);

        throw_if(!$item, __('Cart item not found.', 'kirki-ecommerce'));

        throw_if($item->cart_id !== $cart_id, __('Unauthorized action.', 'kirki-ecommerce'), AuthorizationException::class, Response::FORBIDDEN);

        return $this->update_item($item_id, ['quantity' => $quantity]);
    }

    /**
     * Find a cart item by ID.
     *
     * @since 1.0.0
     *
     * @param int $item_id Cart item ID.
     * @return CartItem|null
     */
    public function find_item($item_id)
    {
        return CartItem::find($item_id);
    }

    /**
     * Update a cart item's attributes.
     *
     * @since 1.0.0
     *
     * @param int                  $item_id Cart item ID.
     * @param array<string, mixed> $data    Attributes to change.
     * @return bool False when the item does not exist.
     */
    public function update_item($item_id, array $data)
    {
        $item = $this->find_item($item_id);

        if (empty($item)) {
            return false;
        }

        return $item->update($data);
    }

    /**
     * Update a cart's attributes.
     *
     * @since 1.0.0
     *
     * @param int                  $cart_id Cart ID.
     * @param array<string, mixed> $data    Attributes to change.
     * @return CartModel|null The refreshed cart, or null when it does not exist.
     */
    public function partial_update(int $cart_id, array $data)
    {
        return $this->update_cart($cart_id, $data);
    }

    /**
     * Remove an item from the caller's cart.
     *
     * Deletes the whole cart when the removed item was its last one.
     *
     * @since 1.0.0
     *
     * @param RemoveCartItemDTO $dto Identity and item to remove.
     * @return bool|int Result of deleting the cart, or the number of items destroyed.
     * @throws Exception When the cart or the item does not exist.
     * @throws AuthorizationException When the item belongs to another cart.
     */
    public function remove_item(RemoveCartItemDTO $dto)
    {
        $cart = $this->get_cart($dto->user_id, $dto->token);

        throw_if(empty($cart), __('Cart not found.', 'kirki-ecommerce'));

        $item = $this->find_item($dto->item_id);

        throw_if(!$item, __('Cart item not found.', 'kirki-ecommerce'));

        throw_if($item->cart_id !== $cart->id, __('Unauthorized action.', 'kirki-ecommerce'), AuthorizationException::class, Response::FORBIDDEN);

        $is_last_item = $cart->items->count() === 1;

        if ($is_last_item) {
            return $cart->delete();
        }

        return CartItem::destroy($item->id);
    }

    /**
     * Delete the caller's cart and, for guests, forget the cart cookie.
     *
     * @since 1.0.0
     *
     * @param EmptyCartDTO $dto Identity of the cart owner.
     * @return null
     */
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

    /**
     * Find a cart by ID with its items, products, variants and coupons loaded.
     *
     * @since 1.0.0
     *
     * @param int $cart_id Cart ID.
     * @return CartModel|null
     */
    public function find(int $cart_id)
    {
        return CartModel::with($this->cart_relations())->find($cart_id);
    }

    /**
     * Attach a coupon to a cart.
     *
     * @since 1.0.0
     *
     * @param int $cart_id   Cart ID.
     * @param int $coupon_id Coupon ID.
     * @return CartCoupon
     */
    public function add_coupon(int $cart_id, int $coupon_id)
    {
        return CartCoupon::create([
            'cart_id' => $cart_id,
            'coupon_id' => $coupon_id,
        ]);
    }

    /**
     * Detach coupons from a cart.
     *
     * @since 1.0.0
     *
     * @param int   $cart_id    Cart ID.
     * @param int[] $coupon_ids Coupon IDs to detach.
     * @return bool|int Number of rows deleted, or false when no coupon IDs are given or the delete fails.
     */
    public function remove_coupons(int $cart_id, array $coupon_ids)
    {
        if (empty($coupon_ids)) {
            return false;
        }

        return CartCoupon::where('cart_id', $cart_id)
            ->where_in('coupon_id', $coupon_ids)
            ->delete();
    }

    /**
     * Read the guest cart token from the request cookie.
     *
     * @since 1.0.0
     *
     * @return string|null
     */
    protected function get_cookie_cart_token(): ?string
    {
        return Sanitizer::apply_rule(request()->cookie(CartConstants::COOKIE_TOKEN), Sanitizer::TEXT);
    }

    /**
     * Resolve the cart of the current visitor from the logged-in user and cart cookie.
     *
     * @since 1.0.0
     *
     * @return CartModel|null Null when the visitor has no cart.
     */
    public function get_current_cart()
    {
        $user_id = is_user_logged_in() ? (int) get_current_user_id() : null;
        $cart_token = $this->get_cookie_cart_token();

        return $this->get_cart($user_id, $cart_token);
    }

    /**
     * Get the variant IDs of the items in a cart.
     *
     * @since 1.0.0
     *
     * @param string|null $token Guest cart token; null resolves the current visitor's cart.
     * @return int[] Variant IDs, or an empty list when there is no cart or lookup fails.
     */
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

    /**
     * Convert a guest cart into the user's own cart.
     *
     * Assigns the user, clears the token and expiry, and forgets the cart cookie.
     *
     * @since 1.0.0
     *
     * @param CartModel $guest_cart Guest cart to adopt.
     * @param int       $user_id    New owner's user ID.
     * @return CartModel|null
     */
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

    /**
     * Merge a guest cart's items into the user's cart, then delete the guest cart.
     *
     * Runs in a transaction. Items for a variant already in the user's cart
     * take the guest item's quantity; the rest are moved across.
     *
     * @since 1.0.0
     *
     * @param CartModel $guest_cart Guest cart to merge and delete.
     * @param CartModel $owned_cart User's cart that receives the items.
     * @return CartModel|null The refreshed user cart.
     * @throws Exception When the merge fails; the transaction is rolled back first.
     */
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

    /**
     * Ensure a cart is owned by a user or a guest token, never both.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $data Cart attributes to check.
     * @return void
     * @throws ValidationException When both user_id and cart_token are set.
     */
    protected function assert_single_owner_identity(array $data): void
    {
        throw_if(!empty($data['user_id']) && !empty($data['cart_token']), __('A cart cannot have both user and guest token ownership.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);
    }

    /**
     * Queue the cookie that carries the guest cart token.
     *
     * @since 1.0.0
     *
     * @param string $token Guest cart token.
     * @return void
     */
    protected function create_cart_cookie(string $token): void
    {
        CookieFacade::queue(CartConstants::COOKIE_TOKEN, $token, CartConstants::COOKIE_TOKEN_EXPIRE_IN_MINUTES);
    }

    /**
     * Expire the guest cart token cookie.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function forget_cart_cookie(): void
    {
        CookieFacade::expire(CartConstants::COOKIE_TOKEN);
    }

    /**
     * Check whether a cart's expiry time has passed.
     *
     * @since 1.0.0
     *
     * @param CartModel $cart Cart to check.
     * @return bool False when the cart has no expiry.
     */
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

    /**
     * Get the relations to eager load with a cart.
     *
     * @since 1.0.0
     *
     * @return array Nested relation map for items, products, variants and coupons.
     */
    protected function cart_relations(): array
    {
        return [
            'items' => [
                'product' => ['media', 'categories'],
                'variant' => ['media', 'attribute_values', 'available_quantity'],
            ],
            'coupons',
        ];
    }
}
