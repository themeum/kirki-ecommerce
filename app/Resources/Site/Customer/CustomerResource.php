<?php

namespace Kirki\Ecommerce\App\Resources\Site\Customer;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

/**
 * API resource for a customer as shown to the customer on the storefront.
 *
 * Staff-only fields such as the admin notes and tags are never included.
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
     * @return array<string, mixed> The customer-facing customer data.
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
            'accepts_marketing' => (bool) $this->accepts_marketing,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
