<?php

namespace Kirki\Ecommerce\App\Http\Requests\ShippingProfile;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class ShippingProfileUpdateRequest extends Request
{
    public function rules()
    {
        return [
            'id' => 'required|integer',
            'name' => 'required|string',
            'is_default' => 'boolean|nullable',
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'name' => Sanitizer::TEXT,
            'is_default' => Sanitizer::BOOL,
        ];
    }
}
