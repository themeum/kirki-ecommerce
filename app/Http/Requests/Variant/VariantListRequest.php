<?php

namespace Kirki\Ecommerce\App\Http\Requests\Variant;

use Kirki\Ecommerce\App\Constants\InventoryType;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the filters for listing variants.
 *
 * @since 1.0.0
 */
class VariantListRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'integer',
            'brand_id' => 'nullable|integer',
            'collection_id' => 'nullable|integer',
            'inventory_type' => 'nullable|string|in:' . InventoryType::join(),
            'status' => 'nullable|string|in:' . ProductStatus::join(),
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
            'category_ids' => Sanitizer::ARRAY,
            'category_ids.*' => Sanitizer::INT,
            'brand_id' => Sanitizer::INT,
            'collection_id' => Sanitizer::INT,
            'inventory_type' => Sanitizer::TEXT,
            'status' => Sanitizer::TEXT,
        ];
    }
}
