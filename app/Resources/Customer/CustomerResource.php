<?php

namespace Kirki\Ecommerce\App\Resources\Customer;

use Kirki\Ecommerce\Resource;
use Kirki\Ecommerce\Supports\MediaAttachment;

class CustomerResource extends Resource
{
    /**
     * Convert the customer resource to an array.
     *
     * @return array The customer data as an associative array.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'photo' => MediaAttachment::make($this->photo),
            'shipping_address' => $this->shipping_address,
            'is_billing_same_as_shipping' => $this->is_billing_same_as_shipping,
            'billing_address' => $this->billing_address,
            'tags' => $this->tags ?? [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
