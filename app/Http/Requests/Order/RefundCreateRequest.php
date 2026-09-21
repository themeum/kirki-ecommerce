<?php

namespace Kirki\Ecommerce\App\Http\Requests\Order;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

/**
 * Validates and sanitizes the payload for creating a refund.
 *
 * @since 1.0.0
 */
class RefundCreateRequest extends Request
{
    /**
     * Convert the submitted invoiced amount to minor units.
     *
     * Skipped when the amount is empty.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function prepare_for_validation()
    {
        $amount = $this->input('invoiced_amount');

        if (!empty($amount)) {
            $this->merge(['invoiced_amount' => Money::to_minor($amount)]);
        }
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'order_id' => 'required|integer',
            'invoiced_amount' => 'required|number|gt:0',
            'reason' => 'nullable|string',
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
            'order_id' => Sanitizer::INT,
            'invoiced_amount' => Sanitizer::INT,
            'reason' => Sanitizer::TEXT,
        ];
    }
}
