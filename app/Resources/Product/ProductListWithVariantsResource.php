<?php

namespace Kirki\Ecommerce\App\Resources\Product;

use Kirki\Ecommerce\App\Resources\Variant\VariantResource;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

class ProductListWithVariantsResource extends Resource
{
    /**
     * Convert the product resource to an array.
     *
     * @return array The product data as an associative array.
     */
    public function to_array()
    {
        $inventory = 0;
        $min_price = $this->variants->first()->base_price;
        $min_base_sale_price = $this->variants->first()->base_sale_price;

        foreach ($this->variants->all() as $variant) {
            $inventory += $variant->track_inventory ? $variant->available_quantity : 0;
            $min_price = min($min_price, $variant->base_price);
            $min_base_sale_price = min($min_base_sale_price, $variant->base_sale_price);
        }

        $display_currency = Money::resolve_display_currency();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'image' => MediaAttachment::make($this->media->first()->ID ?? null)['url'] ?? null,
            'sku' => $this->sku,
            'inventory' => $inventory,
            'base_price' => Money::prepare_amount_from_minor($min_price),
            'base_price_money_object' => Money::prepare_amount_object_from_minor($min_price),
            'display_price' => Money::prepare_amount_from_minor($min_price, null, $display_currency),
            'display_price_money_object' => Money::prepare_amount_object_from_minor($min_price, null, $display_currency),
            'base_sale_price' => !is_null($min_base_sale_price) ? Money::prepare_amount_from_minor($min_base_sale_price) : null,
            'base_sale_price_money_object' => !is_null($min_base_sale_price) ? Money::prepare_amount_object_from_minor($min_base_sale_price) : null,
            'display_sale_price' => !is_null($min_base_sale_price) ? Money::prepare_amount_from_minor($min_base_sale_price, null, $display_currency) : null,
            'display_sale_price_money_object' => !is_null($min_base_sale_price) ? Money::prepare_amount_object_from_minor($min_base_sale_price, null, $display_currency) : null,
            'status' => $this->status,
            'has_variants' => $this->has_variants,
            'attributes' => !empty($this->attributes) ? $this->format_attributes($this->attributes->to_array(), $this->attribute_values->to_array()) : [],
            'variants' => VariantResource::collection($this->variants),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    protected function format_attributes($attributes, $attribute_values)
    {
        $attribute_values_map = [];

        foreach ($attribute_values as $attribute_value) {
            $attribute_values_map[$attribute_value['attribute_id']][] = [
                'id' => $attribute_value['id'],
                'value' => $attribute_value['value'],
                'color' => $attribute_value['color'],
            ];
        }

        foreach ($this->variants as $variant) {
            foreach ($variant->attribute_values as $attribute_value) {
                $attribute_id = $attribute_value->attribute_id;
                $existing_ids = array_column($attribute_values_map[$attribute_id] ?? [], 'id');

                if (in_array($attribute_value->id, $existing_ids, true)) {
                    continue;
                }

                $attribute_values_map[$attribute_id][] = [
                    'id' => $attribute_value->id,
                    'value' => $attribute_value->value,
                    'color' => $attribute_value->color,
                ];
            }
        }

        $attribute_map = [];

        foreach ($attributes as $attribute) {
            $attribute_map[] = [
                'id' => $attribute['id'],
                'name' => $attribute['name'],
                'values' => $attribute_values_map[$attribute['id']] ?? [],
            ];
        }

        return $attribute_map;
    }
}
