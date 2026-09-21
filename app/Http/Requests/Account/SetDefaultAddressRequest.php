<?php

namespace Kirki\Ecommerce\App\Http\Requests\Account;

use Kirki\Ecommerce\App\Constants\AddressPurpose;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for marking an address as the default shipping or billing address.
 *
 * @since 1.0.0
 */
class SetDefaultAddressRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'id' => 'required|integer',
            'purpose' => 'required|string|in:' . implode(',', [AddressPurpose::SHIPPING, AddressPurpose::BILLING]),
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'purpose' => Sanitizer::TEXT,
        ];
    }
}
