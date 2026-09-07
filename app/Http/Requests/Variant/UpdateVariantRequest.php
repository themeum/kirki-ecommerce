<?php

namespace Kirki\Ecommerce\App\Http\Requests\Variant;

use Kirki\Ecommerce\App\Constants\WeightUnit;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class UpdateVariantRequest extends Request
{
    protected function prepare_for_validation()
    {
        $payload = [];

        foreach (['base_price', 'base_sale_price', 'base_cost_of_goods'] as $field) {
            if ($this->has($field) && !empty($this->input($field))) {
                $payload[$field] = Money::to_minor($this->input($field));
            }
        }

        if (!empty($payload)) {
            $this->merge($payload);
        }
    }

    public function rules()
    {
        return [
            'id' => 'required|integer',

            'media' => 'integer|nullable',
            'sku' => 'string|nullable|max:100',

            'base_price' => 'number|min:0|nullable',
            'show_unit_price' => 'boolean|nullable',
            'base_unit' => 'string|nullable|max:10|in:' . implode(',', WeightUnit::get_constant_values()),
            'base_unit_amount' => 'number|min:0|nullable',
            'total_unit' => 'string|nullable|max:10|in:' . implode(',', WeightUnit::get_constant_values()),
            'total_unit_amount' => 'number|min:0|nullable',
            'base_sale_price' => 'number|min:0|nullable',
            'base_cost_of_goods' => 'number|min:0|nullable',

            'weight' => 'number|min:0|nullable',
            'weight_unit' => 'string|nullable|max:10|in:' . implode(',', WeightUnit::get_constant_values()),

            'charge_taxes' => 'boolean|nullable',
            'allow_back_order' => 'boolean|nullable',
            'track_inventory' => 'boolean|nullable',
            'available_quantity' => 'integer|min:0|nullable',
            'in_stock' => 'boolean|nullable',
            'low_stock_threshold' => 'integer|min:0|nullable',
            'has_limit_per_order' => 'boolean|nullable',
            'max_per_order' => 'integer|nullable',
            'tax_profile_id' => 'integer|nullable',
            'shipping_profile_id' => 'integer|nullable',
            'shipping_box_id' => 'integer|nullable',
            'is_visible' => 'boolean|nullable',
            'is_physical_product' => 'boolean|nullable',
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'media' => Sanitizer::INT,
            'sku' => Sanitizer::TEXT,
            'base_price' => Sanitizer::INT,
            'show_unit_price' => Sanitizer::BOOL,
            'base_unit' => Sanitizer::TEXT,
            'base_unit_amount' => Sanitizer::INT,
            'total_unit' => Sanitizer::TEXT,
            'total_unit_amount' => Sanitizer::INT,
            'base_sale_price' => Sanitizer::INT,
            'base_cost_of_goods' => Sanitizer::INT,
            'weight' => Sanitizer::FLOAT,
            'weight_unit' => Sanitizer::TEXT,
            'charge_taxes' => Sanitizer::BOOL,
            'allow_back_order' => Sanitizer::BOOL,
            'track_inventory' => Sanitizer::BOOL,
            'available_quantity' => Sanitizer::INT,
            'in_stock' => Sanitizer::BOOL,
            'low_stock_threshold' => Sanitizer::INT,
            'has_limit_per_order' => Sanitizer::BOOL,
            'max_per_order' => Sanitizer::INT,
            'tax_profile_id' => Sanitizer::INT,
            'shipping_profile_id' => Sanitizer::INT,
            'shipping_box_id' => Sanitizer::INT,
            'is_visible' => Sanitizer::BOOL,
            'is_physical_product' => Sanitizer::BOOL,
        ];
    }
}
