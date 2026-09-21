<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Actions\Cart\AddToCartAction;
use Kirki\Ecommerce\App\Actions\Cart\RemoveCartItemAction;
use Kirki\Ecommerce\App\Actions\Cart\UpdateCartAction;
use Kirki\Ecommerce\App\Actions\Cart\UpdateCartItemAction;
use Kirki\Ecommerce\App\Concerns\HasCartToken;
use Kirki\Ecommerce\App\Http\Requests\Cart\AddToCartRequest;
use Kirki\Ecommerce\App\Http\Requests\Cart\ApplyCouponRequest;
use Kirki\Ecommerce\App\Http\Requests\Cart\CartUpdateRequest;
use Kirki\Ecommerce\App\Http\Requests\Cart\RemoveCouponRequest;
use Kirki\Ecommerce\App\Http\Requests\Cart\UpdateCartItemRequest;
use Kirki\Ecommerce\App\Resources\Cart\CartResource;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\Cart\AddToCartDTO;
use Kirki\Ecommerce\App\Actions\Cart\ApplyCouponAction;
use Kirki\Ecommerce\App\Actions\Cart\RemoveCouponAction;
use Kirki\Ecommerce\App\Constants\Cart;
use Kirki\Ecommerce\App\DTO\Cart\EmptyCartDTO;
use Kirki\Ecommerce\App\DTO\Cart\RemoveCartItemDTO;
use Kirki\Ecommerce\App\DTO\Cart\UpdateCartItemDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;

use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\user;

/**
 * REST controller for the shopper's cart: retrieval, item changes and coupons.
 *
 * @since 1.0.0
 */
class CartController
{
    use HasCartToken;

    /** @var CartService */
    protected $service;

    /**
     * Create the controller with the cart service.
     *
     * @since 1.0.0
     *
     * @param CartService $service
     */
    public function __construct(
        CartService $service
    ) {
        $this->service = $service;
    }

    /**
     * Return the current cart for the logged-in user or the guest cart token.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The cart, or an empty `data` array when no cart exists.
     */
    public function get(Request $request)
    {
        $cart = $this->service->get_cart($this->current_user_id(), $this->cart_token($request));

        return $this->cart_response($cart, __('Cart retrieved successfully.', 'kirki-ecommerce'), $request);
    }

    /**
     * Add a product variant to the cart.
     *
     * @since 1.0.0
     *
     * @param AddToCartRequest $request
     * @param AddToCartAction  $add_to_cart_action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated cart.
     */
    public function add_item(AddToCartRequest $request, AddToCartAction $add_to_cart_action)
    {
        $dto = AddToCartDTO::from_request($request);
        $dto->user_id = $this->current_user_id();
        $dto->token = $this->cart_token($request);

        $updated_cart = $add_to_cart_action->execute($dto);

        return $this->cart_response($updated_cart, __('Item added to cart successfully.', 'kirki-ecommerce'), $request);
    }

    /**
     * Change the quantity of a cart item.
     *
     * @since 1.0.0
     *
     * @param UpdateCartItemRequest $request
     * @param UpdateCartItemAction  $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated cart.
     */
    public function update_item(UpdateCartItemRequest $request, UpdateCartItemAction $action)
    {
        $data = $request->all();

        $dto = new UpdateCartItemDTO();

        $dto->item_id = $data['id'];
        $dto->quantity = $data['quantity'];

        $dto->token = $this->cart_token($request);
        $dto->user_id = $this->current_user_id();

        $updated_cart = $action->execute($dto);

        return $this->cart_response($updated_cart, __('Cart item updated successfully.', 'kirki-ecommerce'), $request);
    }

    /**
     * Remove an item from the cart by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request              $request
     * @param RemoveCartItemAction $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The remaining cart, or an empty `data` array when the last item was removed.
     */
    public function remove_item(Request $request, RemoveCartItemAction $action)
    {
        $item_id = $request->int('id');

        $dto = new RemoveCartItemDTO();
        $dto->item_id = $item_id;
        $dto->token = $this->cart_token($request);
        $dto->user_id = $this->current_user_id();

        $updated_cart = $action->execute($dto);

        return $this->cart_response($updated_cart, __('Item removed from cart successfully.', 'kirki-ecommerce'), $request);
    }

    /**
     * Delete the current cart along with all of its items.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Success response with an empty `data` array.
     */
    public function empty_cart(Request $request)
    {
        $dto = new EmptyCartDTO();
        $dto->token = $this->cart_token($request);
        $dto->user_id = $this->current_user_id();

        $updated_cart = $this->service->empty_cart($dto);

        return $this->cart_response($updated_cart, __('Cart emptied successfully.', 'kirki-ecommerce'), $request);
    }

    /**
     * Partially update the cart from the validated request.
     *
     * @since 1.0.0
     *
     * @param CartUpdateRequest $request
     * @param UpdateCartAction  $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated cart, or a 400 response when neither a cart token nor a user is present.
     */
    public function update(CartUpdateRequest $request, UpdateCartAction $action)
    {
        $token = $this->cart_token($request);
        $user_id = $this->current_user_id();

        if (empty($token) && empty($user_id)) {
            return response()->json([
                'message' => __('Invalid request.', 'kirki-ecommerce'),
            ], 400);
        }

        $updated_cart = $action->execute($token, $request->sanitized(), $user_id);

        return $this->cart_response($updated_cart, __('Cart updated successfully.', 'kirki-ecommerce'), $request);
    }

    /**
     * Apply a coupon code to the current cart.
     *
     * @since 1.0.0
     *
     * @param ApplyCouponRequest $request
     * @param ApplyCouponAction  $apply_coupon_action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated cart.
     * @throws NotFoundException When the current user or token has no cart.
     */
    public function apply_coupon(ApplyCouponRequest $request, ApplyCouponAction $apply_coupon_action)
    {
        $cart = $this->service->get_cart($this->current_user_id(), $this->cart_token($request));

        throw_if(empty($cart), __('Cart not found.', 'kirki-ecommerce'), NotFoundException::class);

        $cart = $apply_coupon_action->execute($cart, $request->string('code'));

        return $this->cart_response($cart, __('Coupon applied successfully.', 'kirki-ecommerce'), $request);
    }

    /**
     * Remove a coupon code from the current cart.
     *
     * @since 1.0.0
     *
     * @param RemoveCouponRequest $request
     * @param RemoveCouponAction  $remove_coupon_action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated cart.
     * @throws NotFoundException When the current user or token has no cart.
     */
    public function remove_coupon(RemoveCouponRequest $request, RemoveCouponAction $remove_coupon_action)
    {
        $cart = $this->service->get_cart($this->current_user_id(), $this->cart_token($request));

        throw_if(empty($cart), __('Cart not found.', 'kirki-ecommerce'), NotFoundException::class);

        $cart = $remove_coupon_action->execute($cart, $request->string('code'));

        return $this->cart_response($cart, __('Coupon removed successfully.', 'kirki-ecommerce'), $request);
    }

    /**
     * Tell whether tax should be included in the cart response.
     *
     * Tax is calculated unless the request carries a truthy skip-tax header.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return bool
     */
    protected function should_calculate_tax(Request $request): bool
    {
        return !filter_var($request->get_header(Cart::HEADER_SKIP_TAX), FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Get the authenticated user ID.
     *
     * @since 1.0.0
     *
     * @return int|null Null for guests.
     */
    protected function current_user_id(): ?int
    {
        $user_id = (int) user()->get_id();

        return $user_id > 0 ? $user_id : null;
    }

    /**
     * Build the JSON response for a cart.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\Cart|null $cart    Cart to serialize, or null when none exists.
     * @param string                                $message Success message.
     * @param Request                               $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The cart resource, or an empty `data` array when there is no cart.
     */
    protected function cart_response($cart, string $message, Request $request)
    {
        return response()->json([
            'data' => !empty($cart) ? CartResource::make($cart, $this->should_calculate_tax($request)) : [],
            'message' => $message,
        ]);
    }
}
