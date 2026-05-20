<?php

namespace Kirki\Ecommerce\App\Http\Requests\Currency;

use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Http\Request;

class CurrencyCreateRequest extends Request
{
    public function rules()
    {
        return [
            'items' => 'required|array',
            'items.*.code' => 'required|string|unique:' . Currency::get_table() . ',code',
            'items.*.name' => 'required|string',
            'items.*.symbol' => 'required|string',
            'items.*.exchange_rate' => 'required|float',
            'items.*.is_base' => 'nullable|boolean',
            'items.*.is_active' => 'nullable|boolean',
        ];
    }

    public function filters()
    {
        return [
            'items.*.code' => Sanitizer::TEXT,
            'items.*.name' => Sanitizer::TEXT,
            'items.*.symbol' => Sanitizer::TEXT,
            'items.*.exchange_rate' => Sanitizer::FLOAT,
            'items.*.is_base' => Sanitizer::BOOL,
            'items.*.is_active' => Sanitizer::BOOL,
        ];
    }
}
