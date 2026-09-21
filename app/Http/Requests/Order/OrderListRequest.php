<?php

namespace Kirki\Ecommerce\App\Http\Requests\Order;

use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderListStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for filtering the order list.
 *
 * @since 1.0.0
 */
class OrderListRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'customer_id' => 'nullable|integer',
            'status' => 'nullable|string|in:' . OrderListStatus::join(),
            'fulfillment_status' => 'nullable|string|in:' . FulfillmentStatus::join(),
            'payment_status' => 'nullable|string|in:' . PaymentStatus::join(),
            'shipping_method' => 'nullable|string|max:100',
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
            'customer_id' => Sanitizer::INT,
            'status' => Sanitizer::TEXT,
            'fulfillment_status' => Sanitizer::TEXT,
            'payment_status' => Sanitizer::TEXT,
            'shipping_method' => Sanitizer::TEXT,
        ];
    }
}
