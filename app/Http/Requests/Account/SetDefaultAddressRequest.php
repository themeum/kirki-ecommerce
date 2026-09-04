<?php

namespace Kirki\Ecommerce\App\Http\Requests\Account;

use Kirki\Ecommerce\App\Constants\AddressPurpose;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class SetDefaultAddressRequest extends Request
{
    public function rules()
    {
        return [
            'id' => 'required|integer',
            'purpose' => 'required|string|in:' . implode(',', [AddressPurpose::SHIPPING, AddressPurpose::BILLING]),
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'purpose' => Sanitizer::TEXT,
        ];
    }
}
