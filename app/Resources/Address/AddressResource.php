<?php

namespace Kirki\Ecommerce\App\Resources\Address;

use Kirki\Ecommerce\Framework\Resource;

class AddressResource extends Resource
{
    /**
     * Convert the address resource to an array.
     *
     * @return array The address data as an associative array.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'type' => $this->type,
            'label' => $this->label,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'city' => $this->city,
            'state' => $this->state,
            'country' => $this->country,
            'postal_code' => $this->postal_code,
            'email' => $this->email,
            'phone' => $this->phone,
            'is_default_shipping' => (bool) $this->is_default_shipping,
            'is_default_billing' => (bool) $this->is_default_billing,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
