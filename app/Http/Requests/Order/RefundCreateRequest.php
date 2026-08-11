<?php

namespace Kirki\Ecommerce\App\Http\Requests\Order;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

class RefundCreateRequest extends Request
{
    protected function prepare_for_validation()
    {
        $amount = $this->input('invoiced_amount');

        if (!empty($amount)) {
            $this->merge(['invoiced_amount' => Money::to_minor($amount)]);
        }
    }

    public function rules()
    {
        return [
            'order_id' => 'required|integer',
            'invoiced_amount' => 'required|number|gt:0',
            'reason' => 'nullable|string',
        ];
    }

    public function filters()
    {
        return [
            'order_id' => Sanitizer::INT,
            'invoiced_amount' => Sanitizer::INT,
            'reason' => Sanitizer::TEXT,
        ];
    }
}
