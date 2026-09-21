<?php

namespace Kirki\Ecommerce\App\Http\Requests\Brand;

use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for creating a brand.
 *
 * @since 1.0.0
 */
class BrandCreateRequest extends Request
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
            'slug' => 'string|nullable|unique:' . Brand::get_table_name() . ',slug',
            'description' => 'string|nullable',
            'logo' => 'integer|nullable',
            'website_url' => 'string|nullable',
            'is_active' => 'nullable|boolean',
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
            'slug' => Sanitizer::TEXT,
            'description' => Sanitizer::TEXT,
            'logo' => Sanitizer::INT,
            'website_url' => Sanitizer::TEXT,
            'is_active' => Sanitizer::BOOL,
        ];
    }
}
