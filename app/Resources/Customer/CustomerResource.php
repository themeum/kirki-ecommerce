<?php

namespace Kirki\Ecommerce\App\Resources\Customer;

use Kirki\Ecommerce\App\Resources\Address\AddressResource;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

/**
 * API resource for a customer with addresses and tags.
 *
 * @since 1.0.0
 */
class CustomerResource extends Resource
{
    /**
     * Convert the customer resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The customer data, including addresses and tags.
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
            'addresses' => AddressResource::collection($this->addresses ?? []),
            'accepts_marketing' => (bool) $this->accepts_marketing,
            'notes' => $this->notes,
            'language' => $this->language,
            'tags' => $this->tags ?? [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
