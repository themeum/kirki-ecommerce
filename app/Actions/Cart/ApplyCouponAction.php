<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Models\Cart;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\Services\DiscountService;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;

class ApplyCouponAction
{
    protected $coupon_service;
    protected $discount_service;
    protected $cart_service;

    public function __construct(
        CouponService $coupon_service,
        DiscountService $discount_service,
        CartService $cart_service
    ) {
        $this->coupon_service = $coupon_service;
        $this->discount_service = $discount_service;
        $this->cart_service = $cart_service;
    }

    public function execute(Cart $cart, string $code)
    {
        $coupon = $this->coupon_service->find_by_code($code);

        $context = CalculationContextDTO::from_cart($cart);
        $context->coupon = $code;

        $this->discount_service->validate_coupon($coupon, $context);

        $cart = $this->cart_service->partial_update($cart->id, [
            'discount_details' => $coupon->to_array()
        ]);

        return $cart;
    }
}
