<?php

namespace Kirki\Ecommerce\App\Http\Requests\Settings;

use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

class SendTestEmailRequest extends Request
{
    public function rules()
    {
        return [
            'logo' => 'nullable|string',
            'height' => 'nullable|integer',
            'position' => 'nullable|string',
            'colors' => 'nullable|array',
            'colors.background' => 'nullable|string',
            'colors.text' => 'nullable|string',
            'colors.link' => 'nullable|string',
            'colors.label' => 'nullable|string',
            'colors.button' => 'nullable|string',
            'colors.button_bg' => 'nullable|string',
        ];
    }

    public function filters()
    {
        return [
            'logo' => Sanitizer::TEXT,
            'height' => Sanitizer::INT,
            'position' => Sanitizer::TEXT,
            'colors' => Sanitizer::ARRAY,
            'colors.background' => Sanitizer::TEXT,
            'colors.text' => Sanitizer::TEXT,
            'colors.link' => Sanitizer::TEXT,
            'colors.label' => Sanitizer::TEXT,
            'colors.button' => Sanitizer::TEXT,
            'colors.button_bg' => Sanitizer::TEXT,
        ];
    }
}
