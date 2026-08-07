<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Actions\Cart\AddToCartAction;
use Kirki\Ecommerce\App\Actions\Cart\RemoveCartItemAction;
use Kirki\Ecommerce\App\Actions\Cart\UpdateCartAction;
use Kirki\Ecommerce\App\Actions\Cart\UpdateCartItemAction;
use Kirki\Ecommerce\App\Http\Requests\Cart\AddToCartRequest;
use Kirki\Ecommerce\App\Http\Requests\Cart\CartUpdateRequest;
use Kirki\Ecommerce\App\Http\Requests\Cart\UpdateCartItemRequest;
use Kirki\Ecommerce\App\Resources\Cart\CartResource;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\Cart\AddToCartDTO;
use Kirki\Ecommerce\App\Actions\Cart\ApplyCouponAction;
use Kirki\Ecommerce\App\Actions\Cart\RemoveCouponAction;
use Kirki\Ecommerce\App\DTO\Cart\EmptyCartDTO;
use Kirki\Ecommerce\App\DTO\Cart\RemoveCartItemDTO;
use Kirki\Ecommerce\App\DTO\Cart\UpdateCartItemDTO;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\response;

class CartController
{
    protected $service;

    public function __construct(
        CartService $service
    ) {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $customer = customer();
        $token = $request->get_header('x-cart-token');

        $cart = $this->service->get_cart($customer->get_customer_id() ?? null, $token);

        return response()->json([
            'data' => CartResource::make($cart),
            'message' => __('Cart retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function add_item(AddToCartRequest $request, AddToCartAction $add_to_cart_action)
    {
        $customer = customer();
        $token = $request->get_header('x-cart-token');

        $dto = AddToCartDTO::from_request($request);
        $dto->customer_id = $customer ? $customer->get_customer_id() : null;
        $dto->token = $token;

        $updated_cart = $add_to_cart_action->execute($dto);

        return response()->json([
            'data' => CartResource::make($updated_cart),
            'message' => __('Item added to cart successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update_item(UpdateCartItemRequest $request, UpdateCartItemAction $action)
    {
        $data = $request->all();

        $dto = new UpdateCartItemDTO();

        $dto->item_id = $data['id'];
        $dto->quantity = $data['quantity'];

        $customer = customer();
        $dto->token = $request->get_header('x-cart-token');
        $dto->customer_id = $customer ? $customer->get_customer_id() : null;

        $updated_cart = $action->execute($dto);

        return response()->json([
            'data' => CartResource::make($updated_cart),
            'message' => __('Cart item updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function remove_item(Request $request, RemoveCartItemAction $action)
    {
        $item_id = $request->get_int('id');

        $customer = customer();
        $token = $request->get_header('x-cart-token');
        $customer_id = $customer ? $customer->get_customer_id() : null;

        $dto = new RemoveCartItemDTO();
        $dto->item_id = $item_id;
        $dto->token = $token;
        $dto->customer_id = $customer_id;

        $updated_cart = $action->execute($dto);

        return response()->json([
            'data' => CartResource::make($updated_cart),
            'message' => __('Item removed from cart successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function empty_cart(Request $request)
    {
        $customer = customer();
        $token = $request->get_header('x-cart-token');
        $customer_id = $customer ? $customer->get_customer_id() : null;

        $dto = new EmptyCartDTO();
        $dto->token = $token;
        $dto->customer_id = $customer_id;

        $updated_cart = $this->service->empty_cart($dto);

        return response()->json([
            'data' => CartResource::make($updated_cart),
            'message' => __('Cart emptied successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(CartUpdateRequest $request, UpdateCartAction $action)
    {
        $customer = customer();
        $token = $request->get_header('x-cart-token');
        $customer_id = $customer ? $customer->get_customer_id() : null;

        $updated_cart = $action->execute($token, $customer_id, $request->sanitized());

        return response()->json([
            'data' => CartResource::make($updated_cart),
            'message' => __('Cart updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function apply_coupon(Request $request, ApplyCouponAction $apply_coupon_action)
    {
        $code = $request->get_string('code');

        if (empty($code)) {
            return response()->json([
                'message' => __('Coupon code is required.', 'kirki-ecommerce'),
            ], 400);
        }

        $customer = customer();
        $token = $request->get_header('x-cart-token');

        $cart = $this->service->get_cart($customer ? $customer->get_customer_id() : null, $token);

        $cart = $apply_coupon_action->execute($cart, $code);

        return response()->json([
            'data' => CartResource::make($cart),
            'message' => __('Coupon applied successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function remove_coupon(Request $request, RemoveCouponAction $remove_coupon_action)
    {
        $customer = customer();
        $token = $request->get_header('x-cart-token');

        $cart = $this->service->get_cart($customer ? $customer->get_customer_id() : null, $token);
        $cart = $remove_coupon_action->execute($cart);

        return response()->json([
            'data' => CartResource::make($cart),
            'message' => __('Coupon removed successfully.', 'kirki-ecommerce'),
        ]);
    }
}
