<?php

namespace Kirki\Ecommerce\App\Http\Requests\Category;

use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for updating a category.
 *
 * @since 1.0.0
 */
class CategoryUpdateRequest extends Request
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
            'parent_id' => 'integer|nullable',
            'name' => 'required|string',
            'slug' => 'string|nullable|unique:' . Category::get_table_name() . ',slug,' . $this->int('id'),
            'description' => 'string|nullable',
            'image' => 'integer|nullable',
            'level' => 'integer|nullable',
            'ordering' => 'integer|nullable',
            'is_active' => 'nullable|boolean',
            'is_deletable' => 'nullable|boolean',
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
            'parent_id' => Sanitizer::INT,
            'name' => Sanitizer::TEXT,
            'slug' => Sanitizer::TEXT,
            'description' => Sanitizer::TEXT,
            'image' => Sanitizer::INT,
            'level' => Sanitizer::INT,
            'ordering' => Sanitizer::INT,
            'is_active' => Sanitizer::BOOL,
            'is_deletable' => Sanitizer::BOOL,
        ];
    }
}
