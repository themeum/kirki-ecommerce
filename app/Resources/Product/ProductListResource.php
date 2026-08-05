<?php

namespace Kirki\Ecommerce\App\Resources\Product;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Resources\Variant\VariantResource;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

class ProductListResource extends Resource
{
    /**
     * Convert the product resource to an array.
     *
     * @return array The product data as an associative array.
     */
    public function to_array()
    {
        $inventory = 0;
        $min_price = $this->variants->first()->price;
        $min_sale_price = $this->variants->first()->sale_price;

        foreach ($this->variants->all() as $variant) {
            $inventory += $variant->track_inventory ? $variant->available_quantity : 0;
            $min_price = min($min_price, $variant->price);
            $min_sale_price = min($min_sale_price, $variant->sale_price);
        }

        // TODO: remove attribute and variants when new API is ready for order creation

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'image' => MediaAttachment::make($this->media->first()->ID ?? null)['url'] ?? null,
            'sku' => $this->sku,
            'inventory' => $inventory,
            'price' => Money::from_minor($min_price)->getAmount(),
            'price_object' => Money::to_dto($min_price),
            'sale_price' => !is_null($min_sale_price) ? Money::from_minor($min_sale_price)->getAmount() : null,
            'sale_price_object' => !is_null($min_sale_price) ? Money::to_dto($min_sale_price) : null,
            'status' => $this->status,
            'has_variants' => (bool) $this->has_variants,
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
