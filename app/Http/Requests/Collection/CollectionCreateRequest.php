<?php

namespace Kirki\Ecommerce\App\Http\Requests\Collection;

use Kirki\Ecommerce\App\Models\Collection;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for creating a collection.
 *
 * @since 1.0.0
 */
class CollectionCreateRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'title' => 'required|string',
            'slug' => 'string|nullable|unique:' . Collection::get_table_name() . ',slug',
            'description' => 'string|nullable',
            'banner' => 'integer|nullable',
            'seo_title' => 'string|nullable',
            'seo_description' => 'string|nullable',
            'seo_keywords' => 'string|nullable',
            'is_active' => 'boolean|nullable',
            'ordering' => 'integer|nullable',
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
            'title' => Sanitizer::TEXT,
            'slug' => Sanitizer::TEXT,
            'description' => Sanitizer::TEXT,
            'banner' => Sanitizer::INT,
            'seo_title' => Sanitizer::TEXT,
            'seo_description' => Sanitizer::TEXT,
            'seo_keywords' => Sanitizer::TEXT,
            'is_active' => Sanitizer::BOOL,
            'ordering' => Sanitizer::INT,
        ];
    }
}
