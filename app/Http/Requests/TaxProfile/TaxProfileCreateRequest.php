<?php

namespace Kirki\Ecommerce\App\Http\Requests\TaxProfile;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for creating a tax profile.
 *
 * @since 1.0.0
 */
class TaxProfileCreateRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'name' => 'required|string',
            'is_default' => 'boolean|nullable',
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
            'name' => Sanitizer::TEXT,
            'is_default' => Sanitizer::BOOL,
        ];
    }
}
