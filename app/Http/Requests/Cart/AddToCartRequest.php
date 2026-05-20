<?php

namespace Kirki\Ecommerce\App\Http\Requests\Cart;

use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Http\Request;

class AddToCartRequest extends Request
{
    public function rules()
    {
        return [
            'variant_id' => 'required|integer',
            'quantity' => 'required|integer|min:1',
        ];
    }

    public function filters()
    {
        return [
            'variant_id' => Sanitizer::INT,
            'quantity' => Sanitizer::INT,
        ];
    }
}
