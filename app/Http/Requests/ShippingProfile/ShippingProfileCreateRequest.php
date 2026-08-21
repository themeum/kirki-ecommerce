<?php

namespace Kirki\Ecommerce\App\Http\Requests\ShippingProfile;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class ShippingProfileCreateRequest extends Request
{
    public function rules()
    {
        return [
            'name' => 'required|string',
            'is_default' => 'boolean|nullable',
        ];
    }

    public function filters()
    {
        return [
            'name' => Sanitizer::TEXT,
            'is_default' => Sanitizer::BOOL,
        ];
    }
}
