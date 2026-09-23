<?php

namespace Kirki\Ecommerce\App\Http\Requests\Customer;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for filtering the customer list.
 *
 * @since 1.0.0
 */
class CustomerListRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'country' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
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
            'country' => Sanitizer::TEXT,
            'city' => Sanitizer::TEXT,
        ];
    }
}
