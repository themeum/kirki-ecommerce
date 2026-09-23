<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Models\Cart;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\Services\DiscountService;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;

/**
 * Validates a coupon code against a cart and attaches it to the cart.
 *
 * @since 1.0.0
 */
class ApplyCouponAction
{
    /** @var CouponService */
    protected $coupon_service;

    /** @var DiscountService */
    protected $discount_service;

    /** @var CartService */
    protected $cart_service;

    /** @var ShippingService */
    protected $shipping_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param CouponService   $coupon_service   Coupon lookup service.
     * @param DiscountService $discount_service Coupon validation service.
     * @param CartService     $cart_service     Cart persistence service.
     * @param ShippingService $shipping_service Shipping cost calculator.
     */
    public function __construct(
        CouponService $coupon_service,
        DiscountService $discount_service,
        CartService $cart_service,
        ShippingService $shipping_service
    ) {
        $this->coupon_service = $coupon_service;
        $this->discount_service = $discount_service;
        $this->cart_service = $cart_service;
        $this->shipping_service = $shipping_service;
    }

    /**
     * Apply a coupon code to the cart.
     *
     * Validates the coupon against the cart's calculation context, including
     * shipping cost when a shipping address and method are already chosen.
     *
     * @since 1.0.0
     *
     * @param Cart   $cart Cart to attach the coupon to.
     * @param string $code Coupon code entered by the shopper.
     * @return Cart|null The refreshed cart.
     */
    public function execute(Cart $cart, string $code)
    {
        $coupon = $this->coupon_service->find_by_code($code);

        $context = CalculationContextDTO::from_cart($cart);
        if (!empty($context->shipping_address) && !empty($context->shipping_method_id)) {
            $context->shipping_subtotal = $this->shipping_service->calculate($context);
        }

        $this->discount_service->validate_coupon($coupon, $context);

        $this->cart_service->add_coupon($cart->id, $coupon->id);

        return $this->cart_service->find($cart->id);
    }
}
