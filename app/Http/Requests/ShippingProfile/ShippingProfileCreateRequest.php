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
        ];
    }

    public function filters()
    {
        return [
            'name' => Sanitizer::TEXT,
        ];
    }
}
