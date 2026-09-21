<?php

namespace Kirki\Ecommerce\App\Http\Requests\Variant;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the variant IDs for generating SKUs in bulk.
 *
 * @since 1.0.0
 */
class GenerateSkusRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'variant_ids' => 'required|array|min:1',
            'variant_ids.*' => 'integer',
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
            'variant_ids' => Sanitizer::ARRAY,
            'variant_ids.*' => Sanitizer::INT,
        ];
    }
}
