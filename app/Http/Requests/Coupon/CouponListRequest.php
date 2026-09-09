<?php

namespace Kirki\Ecommerce\App\Http\Requests\Coupon;

use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\CouponStatus;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class CouponListRequest extends Request
{
    public function rules()
    {
        return [
            'status' => 'nullable|string|in:' . CouponStatus::join(),
            'method' => 'nullable|string|in:' . CouponMethod::join(),
            'discount_type' => 'nullable|string|in:' . DiscountType::join(),
        ];
    }

    public function filters()
    {
        return [
            'status' => Sanitizer::TEXT,
            'method' => Sanitizer::TEXT,
            'discount_type' => Sanitizer::TEXT,
        ];
    }
}
