<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Actions\Cart\AddToCartAction;
use Kirki\Ecommerce\App\Actions\Cart\RemoveCartItemAction;
use Kirki\Ecommerce\App\Actions\Cart\UpdateCartAction;
use Kirki\Ecommerce\App\Actions\Cart\UpdateCartItemAction;
use Kirki\Ecommerce\App\Concerns\HasCartToken;
use Kirki\Ecommerce\App\Http\Requests\Cart\AddToCartRequest;
use Kirki\Ecommerce\App\Http\Requests\Cart\CartUpdateRequest;
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
use Kirki\Ecommerce\App\Supports\ExceptionThrower;

use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\user;

class CartController
{
    use HasCartToken;

    protected $service;

    public function __construct(
        CartService $service
    ) {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $cart = $this->service->get_cart($this->current_user_id(), $this->cart_token($request));

        return $this->cart_response($cart, __('Cart retrieved successfully.', 'kirki-ecommerce'), $request);
    }

    public function add_item(AddToCartRequest $request, AddToCartAction $add_to_cart_action)
    {
        $dto = AddToCartDTO::from_request($request);
        $dto->user_id = $this->current_user_id();
        $dto->token = $this->cart_token($request);

        $updated_cart = $add_to_cart_action->execute($dto);

        return $this->cart_response($updated_cart, __('Item added to cart successfully.', 'kirki-ecommerce'), $request);
    }

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

    public function empty_cart(Request $request)
    {
        $dto = new EmptyCartDTO();
        $dto->token = $this->cart_token($request);
        $dto->user_id = $this->current_user_id();

        $updated_cart = $this->service->empty_cart($dto);

        return $this->cart_response($updated_cart, __('Cart emptied successfully.', 'kirki-ecommerce'), $request);
    }

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

    public function apply_coupon(Request $request, ApplyCouponAction $apply_coupon_action)
    {
        $code = $request->string('code');

        if (empty($code)) {
            return response()->json([
                'message' => __('Coupon code is required.', 'kirki-ecommerce'),
            ], 400);
        }

        $cart = $this->service->get_cart($this->current_user_id(), $this->cart_token($request));

        if (empty($cart)) {
            ExceptionThrower::throw(new NotFoundException(__('Cart not found.', 'kirki-ecommerce')));
        }

        $cart = $apply_coupon_action->execute($cart, $code);

        return $this->cart_response($cart, __('Coupon applied successfully.', 'kirki-ecommerce'), $request);
    }

    public function remove_coupon(Request $request, RemoveCouponAction $remove_coupon_action)
    {
        $cart = $this->service->get_cart($this->current_user_id(), $this->cart_token($request));

        if (empty($cart)) {
            ExceptionThrower::throw(new NotFoundException(__('Cart not found.', 'kirki-ecommerce')));
        }

        $cart = $remove_coupon_action->execute($cart);

        return $this->cart_response($cart, __('Coupon removed successfully.', 'kirki-ecommerce'), $request);
    }

    protected function should_calculate_tax(Request $request): bool
    {
        return !filter_var($request->get_header(Cart::HEADER_SKIP_TAX), FILTER_VALIDATE_BOOLEAN);
    }

    protected function current_user_id(): ?int
    {
        $user_id = (int) user()->get_id();

        return $user_id > 0 ? $user_id : null;
    }

    protected function cart_response($cart, string $message, Request $request)
    {
        return response()->json([
            'data' => !empty($cart) ? CartResource::make($cart, $this->should_calculate_tax($request)) : [],
            'message' => $message,
        ]);
    }
}
