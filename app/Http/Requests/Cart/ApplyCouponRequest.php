<?php

namespace Kirki\Ecommerce\App\Http\Requests\Cart;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class ApplyCouponRequest extends Request
{
    public function rules()
    {
        return [
            'code' => 'required|string',
        ];
    }

    public function filters()
    {
        return [
            'code' => Sanitizer::TEXT,
        ];
    }
}
