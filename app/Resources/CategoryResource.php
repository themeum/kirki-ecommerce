<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\Resource;
use Kirki\Ecommerce\Supports\MediaAttachment;

class CategoryResource extends Resource
{
    /**
     * Convert the category resource to an array.
     *
     * @return array The category data as an associative array.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'image' => MediaAttachment::make($this->image),
            'count' => (int) $this->products_count,
            'level' => $this->level,
            'ordering' => $this->ordering,
            'is_active' => $this->is_active,
            'is_deletable' => $this->is_deletable,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
