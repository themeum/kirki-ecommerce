<?php

namespace Kirki\Ecommerce\App\Http\Requests\TaxProfile;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class TaxProfileUpdateRequest extends Request
{
    public function rules()
    {
        return [
            'id' => 'required|integer',
            'name' => 'required|string',
            'is_default' => 'nullable|boolean',
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
