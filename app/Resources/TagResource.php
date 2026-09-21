<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

/**
 * API resource for a product tag.
 *
 * @since 1.0.0
 */
class TagResource extends Resource
{
    /**
     * Convert the tag resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The tag data, including its product count.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'count' => $this->products_count ?? 0,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
