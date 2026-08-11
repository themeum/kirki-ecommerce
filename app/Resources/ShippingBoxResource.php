<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\Framework\Resource;

class ShippingBoxResource extends Resource
{
    /**
     * Convert the shipping box resource to an array.
     *
     * @return array The shipping box data as an associative array.
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
