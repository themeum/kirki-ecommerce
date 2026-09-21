<?php

namespace Kirki\Ecommerce\App\Http\Requests\Coupon;

use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\CouponStatus;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for filtering the coupon list.
 *
 * @since 1.0.0
 */
class CouponListRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'status' => 'nullable|string|in:' . CouponStatus::join(),
            'method' => 'nullable|string|in:' . CouponMethod::join(),
            'discount_type' => 'nullable|string|in:' . DiscountType::join(),
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
            'status' => Sanitizer::TEXT,
            'method' => Sanitizer::TEXT,
            'discount_type' => Sanitizer::TEXT,
        ];
    }
}
