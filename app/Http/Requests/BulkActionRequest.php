<?php

namespace Kirki\Ecommerce\App\Http\Requests;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for running a bulk action on a list of record IDs.
 *
 * @since 1.0.0
 */
class BulkActionRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'action' => 'required|in:' . BulkActions::join(),
            'ids' => 'nullable|array',
            'ids.*' => 'integer',
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
            'action' => Sanitizer::TEXT,
            'ids' => Sanitizer::ARRAY,
            'ids.*' => Sanitizer::INT,
        ];
    }
}
