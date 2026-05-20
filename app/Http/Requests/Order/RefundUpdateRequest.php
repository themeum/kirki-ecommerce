<?php

namespace Kirki\Ecommerce\App\Http\Requests\Order;

use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\Http\Request;
use Kirki\Ecommerce\Sanitizer;

class RefundUpdateRequest extends Request
{
    public function rules()
    {
        return [
            'id' => 'required|integer',
            'order_id' => 'required|integer',
            'amount' => 'required|number|gt:0',
            'reason' => 'nullable|string',
            'status' => 'required|in:' . RefundStatus::PENDING . ',' . RefundStatus::COMPLETED . ',' . RefundStatus::CANCELLED,
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'order_id' => Sanitizer::INT,
            'amount' => Sanitizer::FLOAT,
            'reason' => Sanitizer::TEXT,
            'status' => Sanitizer::TEXT,
        ];
    }

}
