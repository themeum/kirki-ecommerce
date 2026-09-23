<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a shipping profile.
 *
 * @since 1.0.0
 */
class ShippingProfileResource extends Resource
{
    /**
     * Convert the shipping profile resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The shipping profile data.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'is_default' => (bool) $this->is_default,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
