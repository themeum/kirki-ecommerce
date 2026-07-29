<?php

namespace Kirki\Ecommerce\App\Http\Requests\PaymentMethod;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class PaymentMethodUpdateRequest extends Request
{
    public function rules()
    {
        return [
            'id' => 'required|string',
            'name' => 'required|string',
            'icon' => 'nullable|string',
            'is_enabled' => 'nullable|boolean',
            'is_manual' => 'nullable|boolean',
            'instructions' => 'nullable|string',
            'config' => 'nullable|array',
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::TEXT,
            'name' => Sanitizer::TEXT,
            'icon' => Sanitizer::TEXT,
            'is_enabled' => Sanitizer::BOOL,
            'is_manual' => Sanitizer::BOOL,
            'instructions' => Sanitizer::TEXT,
            'config' => Sanitizer::ARRAY,
        ];
    }
}
