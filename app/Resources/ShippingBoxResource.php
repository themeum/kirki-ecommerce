<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a shipping box.
 *
 * @since 1.0.0
 */
class ShippingBoxResource extends Resource
{
    /**
     * Convert the shipping box resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The shipping box name, dimensions and default flag.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'width' => $this->width,
            'height' => $this->height,
            'length' => $this->length,
            'unit' => $this->unit,
            'is_default' => $this->is_default,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
