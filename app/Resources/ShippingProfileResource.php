<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\Framework\Resource;

class ShippingProfileResource extends Resource
{
    /**
     * Convert the shipping profile resource to an array.
     *
     * @return array The shipping profile data as an associative array.
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
