<?php

namespace Kirki\Ecommerce\App\Resources\Collection;

use Kirki\Ecommerce\App\Resources\Product\ProductListWithVariantsResource;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

/**
 * API resource for a product collection.
 *
 * @since 1.0.0
 */
class CollectionResource extends Resource
{
    /**
     * Convert the collection resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The collection data, including its product count and attached products.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'banner' => MediaAttachment::make($this->banner),
            'count' => (int) $this->products_count,
            'products' => !empty($this->products) ? ProductListWithVariantsResource::collection($this->products) : [],
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'seo_keywords' => $this->seo_keywords,
            'is_active' => $this->is_active,
            'ordering' => $this->ordering,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
