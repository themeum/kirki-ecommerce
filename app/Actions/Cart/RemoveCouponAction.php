<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Models\Cart;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Detaches an applied coupon from a cart.
 *
 * @since 1.0.0
 */
class RemoveCouponAction
{
    /** @var CartService */
    protected $cart_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param CartService $cart_service Cart coupon removal service.
     */
    public function __construct(
        CartService $cart_service
    ) {
        $this->cart_service = $cart_service;
    }

    /**
     * Remove the coupon with the given code from the cart.
     *
     * Fails with a not-found validation error when the code is not applied to the cart.
     * An automatic coupon cannot be removed by the shopper: it fails with a validation error.
     *
     * @since 1.0.0
     *
     * @param Cart   $cart Cart the coupon is applied to.
     * @param string $code Code of the applied coupon.
     * @return Cart|null The refreshed cart.
     * @throws ValidationException When the coupon is not applied to the cart, or is an automatic coupon.
     */
    public function execute(Cart $cart, string $code)
    {
        $applied_coupon = $cart->coupons->first(fn($coupon) => $coupon->code === $code);

        throw_if(empty($applied_coupon), __('Coupon not found in cart.', 'kirki-ecommerce'), ValidationException::class, Response::NOT_FOUND);
        throw_if($applied_coupon->method === CouponMethod::AUTOMATIC, __('This coupon is applied automatically and cannot be removed.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        $this->cart_service->remove_coupons($cart->id, [$applied_coupon->id]);

        return $this->cart_service->find($cart->id);
    }
}
