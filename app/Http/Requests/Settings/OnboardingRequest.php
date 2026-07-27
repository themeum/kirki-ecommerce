<?php

namespace Kirki\Ecommerce\App\Http\Requests\Settings;

use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

class OnboardingRequest extends Request
{
    public function rules()
    {
        return [
            'store_name' => 'required|string',
            'industry' => 'nullable|string',
            'store_address' => 'nullable|array',
            'store_address.address_line_1' => 'required|string',
            'store_address.address_line_2' => 'nullable|string',
            'store_address.city' => 'required|string',
            'store_address.state' => 'required|string',
            'store_address.postal_code' => 'required|string',
            'store_address.country' => 'required|string',
            'default_currency' => 'required|string',
            'should_import_samples' => 'required|boolean',
        ];
    }

    public function filters()
    {
        return [
            'store_name' => Sanitizer::TEXT,
            'industry' => Sanitizer::TEXT,
            'store_address' => Sanitizer::ARRAY ,
            'store_address.address_line_1' => Sanitizer::TEXT,
            'store_address.address_line_2' => Sanitizer::TEXT,
            'store_address.city' => Sanitizer::TEXT,
            'store_address.state' => Sanitizer::TEXT,
            'store_address.postal_code' => Sanitizer::TEXT,
            'store_address.country' => Sanitizer::TEXT,
            'default_currency' => Sanitizer::TEXT,
            'should_import_samples' => Sanitizer::BOOL,
        ];
    }
}
