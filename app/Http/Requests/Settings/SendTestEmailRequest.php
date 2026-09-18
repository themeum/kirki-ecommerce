<?php

namespace Kirki\Ecommerce\App\Http\Requests\Settings;

use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

class SendTestEmailRequest extends Request
{
    public function rules()
    {
        return [
            'logo' => 'nullable|integer',
            'height' => 'nullable|integer',
            'position' => 'nullable|string',
            'colors' => 'nullable|array',
            'colors.background' => 'nullable|array',
            'colors.background.email_body' => 'nullable|string',
            'colors.background.outer_area' => 'nullable|string',
            'colors.background.info_cads' => 'nullable|string',
            'colors.background.divider' => 'nullable|string',
            'colors.typography' => 'nullable|array',
            'colors.typography.headings' => 'nullable|string',
            'colors.typography.body' => 'nullable|string',
            'colors.typography.muted' => 'nullable|string',
            'colors.typography.link' => 'nullable|string',
            'colors.typography.exceptions' => 'nullable|string',
            'colors.button' => 'nullable|array',
            'colors.button.background' => 'nullable|string',
            'colors.button.text' => 'nullable|string',
            'additional_description' => 'nullable|string',
            'footer' => 'nullable|string',
            'subject' => 'nullable|string',
            'heading' => 'nullable|string',
            'message' => 'nullable|string',
        ];
    }

    public function filters()
    {
        return [
            'logo' => Sanitizer::INT,
            'height' => Sanitizer::INT,
            'position' => Sanitizer::TEXT,
            'colors' => Sanitizer::ARRAY,
            'colors.background' => Sanitizer::ARRAY,
            'colors.background.email_body' => Sanitizer::TEXT,
            'colors.background.outer_area' => Sanitizer::TEXT,
            'colors.background.info_cads' => Sanitizer::TEXT,
            'colors.background.divider' => Sanitizer::TEXT,
            'colors.typography' => Sanitizer::ARRAY,
            'colors.typography.headings' => Sanitizer::TEXT,
            'colors.typography.body' => Sanitizer::TEXT,
            'colors.typography.muted' => Sanitizer::TEXT,
            'colors.typography.link' => Sanitizer::TEXT,
            'colors.typography.exceptions' => Sanitizer::TEXT,
            'colors.button' => Sanitizer::ARRAY,
            'colors.button.background' => Sanitizer::TEXT,
            'colors.button.text' => Sanitizer::TEXT,
            'additional_description' => Sanitizer::RICH_TEXT,
            'footer' => Sanitizer::RICH_TEXT,
            'subject' => Sanitizer::TEXT,
            'heading' => Sanitizer::TEXT,
            'message' => Sanitizer::RICH_TEXT,
        ];
    }
}
