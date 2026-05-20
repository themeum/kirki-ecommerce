<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\Resource;
use Kirki\Ecommerce\Supports\MediaAttachment;

class TagResource extends Resource
{
    /**
     * Convert the tag resource to an array.
     *
     * @return array The tag data as an associative array.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'count' => $this->products_count,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
