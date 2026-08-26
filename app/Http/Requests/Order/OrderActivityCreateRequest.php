<?php

namespace Kirki\Ecommerce\App\Http\Requests\Order;

use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

class OrderActivityCreateRequest extends Request
{
    public function rules()
    {
        return [
            'order_id' => 'required|integer',
            'message' => 'required|string',
        ];
    }

    public function filters()
    {
        return [
            'order_id' => Sanitizer::INT,
            'message' => Sanitizer::TEXT,
        ];
    }
}
