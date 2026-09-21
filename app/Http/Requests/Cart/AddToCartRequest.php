<?php

namespace Kirki\Ecommerce\App\Http\Requests\Cart;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for adding a variant to the cart.
 *
 * @since 1.0.0
 */
class AddToCartRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'variant_id' => 'required|integer',
            'quantity' => 'required|integer|min:1',
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
            'variant_id' => Sanitizer::INT,
            'quantity' => Sanitizer::INT,
        ];
    }
}
