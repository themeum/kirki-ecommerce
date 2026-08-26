<?php

namespace Kirki\Ecommerce\App\Http\Requests\Product;

use Kirki\Ecommerce\App\Constants\Product\AvailabilityStatus;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class ProductListRequest extends Request
{
    public function rules()
    {
        return [
            'category_ids' => 'nullable|string',
            'brand_id' => 'nullable|integer',
            'collection_id' => 'nullable|integer',
            'availability_status' => 'nullable|string|in:' . AvailabilityStatus::join(),
            'status' => 'nullable|string|in:' . ProductStatus::join(),
        ];
    }

    public function filters()
    {
        return [
            'category_ids' => Sanitizer::TEXT,
            'brand_id' => Sanitizer::INT,
            'collection_id' => Sanitizer::INT,
            'availability_status' => Sanitizer::TEXT,
            'status' => Sanitizer::TEXT,
        ];
    }

    protected function passed_validation()
    {
        $this->attributes['category_ids'] = !empty($this->attributes['category_ids']) ? explode(',', $this->attributes['category_ids']) : null;
    }
}
