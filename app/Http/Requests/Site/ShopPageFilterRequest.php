<?php

/**
 * Shop Page Request Handler.
 *
 * @package Kirki\Ecommerce\App\Http\Controllers\Site
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Http\Requests\Site;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Class ShopPageFilterRequest
 *
 * @since 1.0.0
 */
class ShopPageFilterRequest extends Request
{
    /**
     * Validate the request.
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function rules()
    {
        return [
            'search' => 'nullable|string|max:255',
            'category_ids' => 'nullable|array',
            'brand_ids' => 'nullable|array',
            'attribute_value_ids' => 'nullable|array',
            'min_price' => 'nullable|numeric',
            'max_price' => 'nullable|numeric',
            'current_page' => 'nullable|integer',
            'sort_by' => 'nullable|string|max:255',
        ];
    }

    /**
     * Filters
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function filters()
    {
        //TODO: Will be added later.
        return [
            'search' => Sanitizer::TEXT,
            // 'category_ids' => Sanitizer::ARRAY,
            // 'brand_ids' => Sanitizer::ARRAY,
            // 'attribute_value_ids' => Sanitizer::ARRAY,
            // 'min_price' => Sanitizer::INT,
            // 'max_price' => Sanitizer::INT,
            'current_page' => Sanitizer::INT,
            'sort_by' => Sanitizer::TEXT,
        ];
    }
}
