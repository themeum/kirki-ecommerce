<?php

namespace Kirki\Ecommerce\App\Http\Requests\Order;

use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

/**
 * Validates and sanitizes the payload for adding an activity entry to an order.
 *
 * @since 1.0.0
 */
class OrderActivityCreateRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'order_id' => 'required|integer',
            'message' => 'required|string',
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
            'message' => Sanitizer::TEXT,
        ];
    }
}
