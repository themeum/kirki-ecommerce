<?php

namespace Kirki\Ecommerce\App\Http\Requests\Order;

use Kirki\Ecommerce\Http\Request;
use Kirki\Ecommerce\Sanitizer;

class RefundCreateRequest extends Request
{
    public function rules()
    {
        return [
            'order_id' => 'required|integer',
            'amount' => 'required|number|gt:0',
            'reason' => 'nullable|string',
        ];
    }

    public function filters()
    {
        return [
            'order_id' => Sanitizer::INT,
            'amount' => Sanitizer::MONEY,
            'reason' => Sanitizer::TEXT,
        ];
    }
}
