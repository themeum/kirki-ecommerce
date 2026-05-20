<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\Resource;
use Kirki\Ecommerce\Supports\MediaAttachment;

class BrandResource extends Resource
{
    /**
     * Convert the brand resource to an array.
     *
     * @return array The brand data as an associative array.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'logo' => MediaAttachment::make($this->logo),
            'count' => (int) $this->products_count,
            'website_url' => $this->website_url,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
