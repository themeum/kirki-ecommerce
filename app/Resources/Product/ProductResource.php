<?php

namespace Kirki\Ecommerce\App\Resources\Product;

use Kirki\Ecommerce\App\Resources\Variant\VariantResource;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

class ProductResource extends Resource
{
    /**
     * Convert the product resource to an array.
     *
     * @return array The product data as an associative array.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'status' => $this->status,
            'ribbon' => $this->ribbon,

            'currency' => !$this->currency_id ? null : [
                'id' => $this->currency_id,
                'code' => $this->currency->code,
                'name' => $this->currency->name,
                'symbol' => $this->currency->symbol,
            ],

            'brand' => !$this->brand_id ? null : [
                'id' => $this->brand_id,
                'name' => $this->brand->name,
                'logo' => MediaAttachment::make($this->brand->logo)
            ],

            'short_description' => $this->short_description,
            'description' => $this->description,
            'additional_info' => $this->additional_info,
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'seo_keywords' => $this->seo_keywords,
            'og_title' => $this->og_title,
            'og_description' => $this->og_description,
            'og_image' => MediaAttachment::make($this->og_image),
            'schema_id' => $this->schema_id,
            'llm_instructions' => $this->llm_instructions,
            'has_variants' => $this->has_variants,

            'categories' => $this->categories->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'parent_id' => $item->parent_id,
                    'level' => $item->level,
                ];
            }),
            'tags' => $this->tags->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                ];
            }),
            'collections' => $this->collections->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                ];
            }),

            'attributes' => !empty($this->attributes) ? $this->format_attributes($this->attributes->to_array(), $this->attribute_values->to_array()) : [],
            'variants' => VariantResource::collection($this->variants),
            'media' => MediaAttachment::make_many($this->media->pluck('ID')->all()),

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
