<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

/**
 * API resource for a product brand.
 *
 * @since 1.0.0
 */
class BrandResource extends Resource
{
    /**
     * Convert the brand resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The brand data, including its product count.
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
