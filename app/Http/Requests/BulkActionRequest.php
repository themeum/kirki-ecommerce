<?php

namespace Kirki\Ecommerce\App\Http\Requests;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class BulkActionRequest extends Request
{
    public function rules()
    {
        return [
            'action' => 'required|in:' . BulkActions::join(),
            'ids' => 'nullable|array',
            'ids.*' => 'integer',
        ];
    }

    public function filters()
    {
        return [
            'action' => Sanitizer::TEXT,
            'ids' => Sanitizer::ARRAY,
            'ids.*' => Sanitizer::INT,
        ];
    }
}
