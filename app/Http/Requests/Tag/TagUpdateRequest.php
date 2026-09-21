<?php

namespace Kirki\Ecommerce\App\Http\Requests\Tag;

use Kirki\Ecommerce\App\Models\Tag;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for updating a tag.
 *
 * @since 1.0.0
 */
class TagUpdateRequest extends Request
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
            'slug' => 'string|nullable|unique:' . Tag::get_table_name() . ',slug,' . $this->int('id'),
            'description' => 'string|nullable',
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
        ];
    }
}
