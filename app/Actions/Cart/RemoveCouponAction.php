<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Models\Cart;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\throw_if;

class RemoveCouponAction
{
    protected $cart_service;

    public function __construct(
        CartService $cart_service
    ) {
        $this->cart_service = $cart_service;
    }

    public function execute(Cart $cart)
    {
        $applied_coupon_info = $cart->discount_details;

        throw_if(empty($applied_coupon_info), __('Coupon not found in cart.', 'kirki-ecommerce'), ValidationException::class, Response::NOT_FOUND);

        $cart = $this->cart_service->partial_update($cart->id, [
            'discount_details' => null,
        ]);

        return $cart;
    }
}
