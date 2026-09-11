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

    public function execute(Cart $cart, string $code)
    {
        $applied_coupon = $cart->coupons->first(fn($coupon) => $coupon->code === $code);

        throw_if(empty($applied_coupon), __('Coupon not found in cart.', 'kirki-ecommerce'), ValidationException::class, Response::NOT_FOUND);

        $this->cart_service->remove_coupons($cart->id, [$applied_coupon->id]);

        return $this->cart_service->find($cart->id);
    }
}
