<?php

namespace Kirki\Ecommerce\App\Http\Requests\TaxProfile;

use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Http\Request;

class TaxProfileUpdateRequest extends Request
{
    public function rules()
    {
        return [
            'id' => 'required|integer',
            'name' => 'required|string',
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'name' => Sanitizer::TEXT,
        ];
    }
}
