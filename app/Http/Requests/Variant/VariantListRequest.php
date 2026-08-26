<?php

namespace Kirki\Ecommerce\App\Http\Requests\Variant;

use Kirki\Ecommerce\App\Constants\InventoryType;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class VariantListRequest extends Request
{
    public function rules()
    {
        return [
            'category_ids' => 'nullable|string',
            'brand_id' => 'nullable|integer',
            'collection_id' => 'nullable|integer',
            'inventory_type' => 'nullable|string|in:' . InventoryType::join(),
            'status' => 'nullable|string|in:' . ProductStatus::join(),
        ];
    }

    public function filters()
    {
        return [
            'category_ids' => Sanitizer::TEXT,
            'brand_id' => Sanitizer::INT,
            'collection_id' => Sanitizer::INT,
            'inventory_type' => Sanitizer::TEXT,
            'status' => Sanitizer::TEXT,
        ];
    }

    protected function passed_validation()
    {
        $this->attributes['category_ids'] = !empty($this->attributes['category_ids']) ? explode(',', $this->attributes['category_ids']) : null;
    }
}
