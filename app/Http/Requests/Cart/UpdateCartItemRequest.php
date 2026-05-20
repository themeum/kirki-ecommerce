<?php

namespace Kirki\Ecommerce\App\Http\Requests\Cart;

use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Http\Request;

class UpdateCartItemRequest extends Request
{
    public function rules()
    {
        return [
            'id' => 'required|integer',
            'quantity' => 'required|integer|min:1',
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'quantity' => Sanitizer::INT,
        ];
    }
}
