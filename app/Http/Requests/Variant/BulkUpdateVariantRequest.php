<?php

namespace Kirki\Ecommerce\App\Http\Requests\Variant;

use Kirki\Ecommerce\App\Constants\WeightUnit;
use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Http\Request;

class BulkUpdateVariantRequest extends Request
{
    public function rules()
    {
        return [
            'variants' => 'required|array|min:1',
            'variants.*.id' => 'required|integer',

            'variants.*.media' => 'integer|nullable',
            'variants.*.sku' => 'string|nullable|max:100',
            'variants.*.barcode' => 'string|nullable|max:100',

            'variants.*.price' => 'number|min:0|nullable',
            'variants.*.show_unit_price' => 'boolean|nullable',
            'variants.*.base_unit' => 'string|nullable|max:10|in:' . implode(',', WeightUnit::get_constant_values()),
            'variants.*.base_unit_amount' => 'number|min:0|nullable',
            'variants.*.total_unit' => 'string|nullable|max:10|in:' . implode(',', WeightUnit::get_constant_values()),
            'variants.*.total_unit_amount' => 'number|min:0|nullable',
            'variants.*.sale_price' => 'number|min:0|nullable',
            'variants.*.cost_of_goods' => 'number|min:0|nullable',

            'variants.*.weight' => 'number|min:0|nullable',
            'variants.*.weight_unit' => 'string|nullable|max:10|in:' . implode(',', WeightUnit::get_constant_values()),

            'variants.*.charge_taxes' => 'boolean|nullable',
            'variants.*.allow_back_order' => 'boolean|nullable',
            'variants.*.track_inventory' => 'boolean|nullable',
            'variants.*.available_quantity' => 'integer|min:0|nullable',
            'variants.*.in_stock' => 'boolean|nullable',
            'variants.*.committed_quantity' => 'integer|min:0|nullable',
            'variants.*.has_limit_per_order' => 'boolean|nullable',
            'variants.*.max_per_order' => 'integer|nullable',
            'variants.*.tax_profile_id' => 'integer|nullable',
            'variants.*.shipping_profile_id' => 'integer|nullable',
            'variants.*.shipping_box_id' => 'integer|nullable',
            'variants.*.is_visible' => 'boolean|nullable',
            'variants.*.is_physical_product' => 'boolean|nullable',
            'variants.*.is_default' => 'boolean|nullable',
        ];
    }

    public function filters()
    {
        return [
            'variants' => Sanitizer::ARRAY ,
            'variants.*.id' => Sanitizer::INT,
            'variants.*.media' => Sanitizer::INT,
            'variants.*.sku' => Sanitizer::TEXT,
            'variants.*.barcode' => Sanitizer::TEXT,
            'variants.*.price' => Sanitizer::MONEY,
            'variants.*.show_unit_price' => Sanitizer::BOOL,
            'variants.*.base_unit' => Sanitizer::TEXT,
            'variants.*.base_unit_amount' => Sanitizer::INT,
            'variants.*.total_unit' => Sanitizer::TEXT,
            'variants.*.total_unit_amount' => Sanitizer::INT,
            'variants.*.sale_price' => Sanitizer::MONEY,
            'variants.*.cost_of_goods' => Sanitizer::MONEY,
            'variants.*.weight' => Sanitizer::FLOAT,
            'variants.*.weight_unit' => Sanitizer::TEXT,
            'variants.*.charge_taxes' => Sanitizer::BOOL,
            'variants.*.allow_back_order' => Sanitizer::BOOL,
            'variants.*.track_inventory' => Sanitizer::BOOL,
            'variants.*.available_quantity' => Sanitizer::INT,
            'variants.*.in_stock' => Sanitizer::BOOL,
            'variants.*.committed_quantity' => Sanitizer::INT,
            'variants.*.has_limit_per_order' => Sanitizer::BOOL,
            'variants.*.max_per_order' => Sanitizer::INT,
            'variants.*.tax_profile_id' => Sanitizer::INT,
            'variants.*.shipping_profile_id' => Sanitizer::INT,
            'variants.*.shipping_box_id' => Sanitizer::INT,
            'variants.*.is_visible' => Sanitizer::BOOL,
            'variants.*.is_physical_product' => Sanitizer::BOOL,
            'variants.*.is_default' => Sanitizer::BOOL,

            // variant attributes
            'variants.*.attribute_values' => Sanitizer::ARRAY ,
            'variants.*.attribute_values.*' => Sanitizer::INT,
        ];
    }
}
