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

    public function execute(Cart $cart)
    {
        $applied_coupon_info = $cart->discount_details;

        if (empty($applied_coupon_info)) {
            throw new ValidationException(__('Coupon not found in cart.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        $cart = $this->cart_service->partial_update($cart->id, [
            'discount_details' => null,
        ]);

        return $cart;
    }
}
