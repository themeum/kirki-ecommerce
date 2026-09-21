<?php

namespace Kirki\Ecommerce\App\Resources\Customer;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

/**
 * API resource for the basic identity details of a customer.
 *
 * @since 1.0.0
 */
class CustomerInfoResource extends Resource
{
    /**
     * Convert the customer resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The customer name, contact details and photo.
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
        ];
    }
}
