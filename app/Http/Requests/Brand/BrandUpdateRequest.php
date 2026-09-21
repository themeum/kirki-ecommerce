<?php

namespace Kirki\Ecommerce\App\Http\Requests\Brand;

use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for updating a brand.
 *
 * @since 1.0.0
 */
class BrandUpdateRequest extends Request
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
            'name' => 'required|string',
            'slug' => 'string|nullable|unique:' . Brand::get_table_name() . ',slug,' . $this->int('id'),
            'description' => 'string|nullable',
            'logo' => 'integer|nullable',
            'website_url' => 'string|nullable',
            'is_active' => 'boolean|nullable',
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
            'name' => Sanitizer::TEXT,
            'slug' => Sanitizer::TEXT,
            'description' => Sanitizer::TEXT,
            'logo' => Sanitizer::INT,
            'website_url' => Sanitizer::TEXT,
            'is_active' => Sanitizer::BOOL,
        ];
    }
}
