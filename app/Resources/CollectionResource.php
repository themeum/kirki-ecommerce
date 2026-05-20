<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\Resource;
use Kirki\Ecommerce\Supports\MediaAttachment;

class CollectionResource extends Resource
{
    /**
     * Convert the collection resource to an array.
     *
     * @return array The collection data as an associative array.
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
