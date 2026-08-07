<?php

namespace Kirki\Ecommerce\App\Http\Requests\Order;

use Kirki\Ecommerce\App\Constants\Order\OrderAction;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

use function Kirki\Ecommerce\App\customer;

class OrderActionRequest extends Request
{
    public function authorize()
    {
        return customer()->is_admin();
    }

    protected function prepare_for_validation()
    {
        $amount = $this->input('amount');

        if (!empty($amount)) {
            $this->merge(['amount' => Money::to_minor($amount)]);
        }
    }

    public function rules()
    {
        return [
            'id' => 'required|integer',
            'action' => 'required|in:' . OrderAction::join(','),
            'refund_id' => 'required_if:action,' . OrderAction::APPROVE_REFUND . ',' . OrderAction::DECLINE_REFUND . '|nullable|integer',
            'amount' => 'required_if:action,' . OrderAction::INITIATE_REFUND . '|nullable|number|gt:0',
            'carrier' => 'required_if:action,' . OrderAction::ADD_TRACKING . '|nullable|string',
            'tracking_number' => 'required_if:action,' . OrderAction::ADD_TRACKING . '|nullable|string',
            'tracking_url' => 'nullable|string',
            'reason' => 'nullable|string',
            'payment_method' => 'nullable|string',
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'action' => Sanitizer::TEXT,
            'refund_id' => Sanitizer::INT,
            'amount' => Sanitizer::INT,
            'carrier' => Sanitizer::TEXT,
            'tracking_number' => Sanitizer::TEXT,
            'tracking_url' => Sanitizer::URL,
            'reason' => Sanitizer::TEXT,
            'payment_method' => Sanitizer::TEXT,
        ];
    }
}
