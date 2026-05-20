<?php

namespace Kirki\Ecommerce\App\Http\Requests;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Http\Request;

class BulkActionRequest extends Request
{
    public function rules()
    {
        return [
            'action' => 'required|in:' . implode(',', BulkActions::get_constant_values()),
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
