<?php

namespace Kirki\Ecommerce\App\Http\Requests\Product;

use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Constants\Unit;
use Kirki\Ecommerce\App\Constants\WeightUnit;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class ProductCreateRequest extends Request
{
    protected function prepare_for_validation()
    {
        $variants = $this->input('variants') ?? [];

        foreach ($variants as $index => $variant) {
            if (!is_array($variant)) {
                continue;
            }

            foreach (['base_price', 'base_sale_price', 'base_cost_of_goods'] as $field) {
                if (array_key_exists($field, $variant) && !empty($variant[$field])) {
                    $variants[$index][$field] = Money::to_minor($variant[$field]);
                }
            }
        }

        if (!empty($variants)) {
            $this->merge(['variants' => $variants]);
        }
    }

    public function rules()
    {
        return [
            //product
            'title' => 'required|string|max:500',
            'slug' => 'string|nullable|max:500',
            'status' => 'string|nullable|in:' . implode(',', ProductStatus::get_constant_values()),
            'ribbon' => 'string|nullable|max:100',
            'currency_id' => 'integer|nullable',
            'brand_id' => 'integer|nullable',
            'short_description' => 'string|nullable',
            'description' => 'string|nullable',
            'additional_info' => 'array|nullable', // JSON string, can be validated later
            'additional_info.*.title' => 'required|string',
            'additional_info.*.description' => 'required|string',
            'seo_title' => 'string|nullable|max:500',
            'seo_description' => 'string|nullable',
            'seo_keywords' => 'array|nullable',
            'seo_keywords.*' => 'string',
            'og_title' => 'string|nullable|max:500',
            'og_description' => 'string|nullable',
            'og_image' => 'integer|nullable',
            'schema_id' => 'integer|nullable',
            'llm_instructions' => 'string|nullable',
            'has_variants' => 'boolean|nullable',

            //media
            'media' => 'array|nullable',
            'media.*' => 'integer',

            //categories
            'categories' => 'array|nullable',
            'categories.*' => 'integer',

            //tags
            'tags' => 'array|nullable',
            'tags.*' => 'integer',

            //collections
            'collections' => 'array|nullable',
            'collections.*' => 'integer',

            //attributes
            'attributes' => 'array|nullable',
            'attributes.*.id' => 'integer',
            'attributes.*.values' => 'array',
            'attributes.*.values.*' => 'integer',

            //variations
            'variants' => 'required|array|min:1',

            'variants.*.attribute_values' => 'required_if:has_variants,true|array',
            'variants.*.attribute_values.*' => 'required_if:has_variants,true|integer',

            'variants.*.media' => 'integer|nullable',
            'variants.*.sku' => 'string|nullable|max:100',
            'variants.*.barcode' => 'string|nullable|max:100',

            'variants.*.base_price' => 'required|number|min:0',
            'variants.*.show_unit_price' => 'boolean|nullable',
            'variants.*.base_unit' => 'string|nullable|max:10|in:' . implode(',', Unit::get_constant_values()),
            'variants.*.base_unit_amount' => 'number|min:0|nullable',
            'variants.*.total_unit' => 'string|nullable|max:10|in:' . implode(',', Unit::get_constant_values()),
            'variants.*.total_unit_amount' => 'number|min:0|nullable',
            'variants.*.base_sale_price' => 'number|min:0|nullable',
            'variants.*.base_cost_of_goods' => 'number|min:0|nullable',

            'variants.*.weight' => 'numeric|nullable',
            'variants.*.weight_unit' => 'nullable|string|max:10|in:' . implode(',', WeightUnit::get_constant_values()),

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
            // product
            'title' => Sanitizer::TEXT,
            'slug' => Sanitizer::TEXT,
            'status' => Sanitizer::TEXT,
            'ribbon' => Sanitizer::TEXT,
            'currency_id' => Sanitizer::INT,
            'brand_id' => Sanitizer::INT,
            'short_description' => Sanitizer::TEXT,
            'description' => Sanitizer::TEXT,
            'additional_info' => Sanitizer::ARRAY,
            'seo_title' => Sanitizer::TEXT,
            'seo_description' => Sanitizer::TEXT,
            'seo_keywords' => Sanitizer::ARRAY,
            'seo_keywords.*' => Sanitizer::TEXT,
            'og_title' => Sanitizer::TEXT,
            'og_description' => Sanitizer::TEXT,
            'og_image' => Sanitizer::INT,
            'schema_id' => Sanitizer::INT,
            'llm_instructions' => Sanitizer::TEXT,
            'has_variants' => Sanitizer::BOOL,

            // relations
            'media' => Sanitizer::ARRAY,
            'media.*' => Sanitizer::INT,
            'categories' => Sanitizer::ARRAY,
            'categories.*' => Sanitizer::INT,
            'tags' => Sanitizer::ARRAY,
            'tags.*' => Sanitizer::INT,
            'collections' => Sanitizer::ARRAY,
            'collections.*' => Sanitizer::INT,
            'attributes' => Sanitizer::ARRAY,
            'attributes.*.id' => Sanitizer::INT,
            'attributes.*.values' => Sanitizer::ARRAY,
            'attributes.*.values.*' => Sanitizer::INT,

            // variants
            'variants' => Sanitizer::ARRAY,
            'variants.*.media' => Sanitizer::INT,
            'variants.*.sku' => Sanitizer::TEXT,
            'variants.*.barcode' => Sanitizer::TEXT,
            'variants.*.base_price' => Sanitizer::INT,
            'variants.*.show_unit_price' => Sanitizer::BOOL,
            'variants.*.base_unit' => Sanitizer::TEXT,
            'variants.*.base_unit_amount' => Sanitizer::INT,
            'variants.*.total_unit' => Sanitizer::TEXT,
            'variants.*.total_unit_amount' => Sanitizer::INT,
            'variants.*.base_sale_price' => Sanitizer::INT,
            'variants.*.base_cost_of_goods' => Sanitizer::INT,
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
            'variants.*.attribute_values' => Sanitizer::ARRAY,
            'variants.*.attribute_values.*' => Sanitizer::INT,
        ];
    }
}
