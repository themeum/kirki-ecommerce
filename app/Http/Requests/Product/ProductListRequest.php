<?php

namespace Kirki\Ecommerce\App\Http\Requests\Product;

use Kirki\Ecommerce\App\Constants\InventoryType;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Http\Request;

class ProductListRequest extends Request
{
    public function rules()
    {
        return [
            'category_ids' => 'nullable|string',
            'brand_id' => 'nullable|integer',
            'collection_id' => 'nullable|integer',
            'inventory_type' => 'nullable|string|in:' . implode(',', InventoryType::get_constant_values()),
            'status' => 'nullable|string|in:' . implode(',', ProductStatus::get_constant_values()),
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
