<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\Resource;

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
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
