<?php

namespace Kirki\Ecommerce\App\Http\Requests\TaxProfile;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class TaxProfileCreateRequest extends Request
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
