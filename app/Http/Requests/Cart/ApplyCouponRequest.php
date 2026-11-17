<?php

namespace Kirki\Ecommerce\App\Http\Requests\Cart;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Validation\Rule;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for applying a coupon code to the cart.
 *
 * @since 1.0.0
 */
class ApplyCouponRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        $is_coupon_disabled = !Settings::get(OptionKeys::CHECKOUT_SETTINGS . '.checkout_configuration.has_apply_coupon_code', true);

        return [
            'code' => [Rule::prohibited_if(fn() => $is_coupon_disabled), 'required', 'string'],
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function messages()
    {
        return [
            'code.prohibited_if' => __('Coupon codes are not accepted.', 'kirki-ecommerce'),
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function filters()
    {
        return [
            'code' => Sanitizer::TEXT,
        ];
    }
}
