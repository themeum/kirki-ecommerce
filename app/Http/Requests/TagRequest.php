<?php

namespace Kirki\Ecommerce\App\Http\Requests;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the search and sort parameters for listing tags.
 *
 * @since 1.0.0
 */
class TagRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'search' => 'required|string|max:255',
            'sort_by' => 'required|string|max:255',
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
            'search' => Sanitizer::TEXT,
            'sort_by' => Sanitizer::TEXT,
            'sort_order' => Sanitizer::TEXT,
        ];
    }
}
