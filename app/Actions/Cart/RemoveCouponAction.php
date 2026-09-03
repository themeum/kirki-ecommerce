<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Models\Cart;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;

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

        if (empty($applied_coupon)) {
            throw new ValidationException(__('Coupon not found in cart.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $this->cart_service->remove_coupons($cart->id, [$applied_coupon->id]);

        return $this->cart_service->find($cart->id);
    }
}
