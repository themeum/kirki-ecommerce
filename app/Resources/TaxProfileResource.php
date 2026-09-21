<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a tax profile.
 *
 * @since 1.0.0
 */
class TaxProfileResource extends Resource
{
    /**
     * Convert the tax profile resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The tax profile data.
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
