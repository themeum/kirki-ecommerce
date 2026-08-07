<?php

namespace Kirki\Ecommerce\App\Resources\OnlinePayment;

use Kirki\Ecommerce\Framework\Resource;

class OnlinePaymentResource extends Resource
{
    /**
     * Convert the online payment resource to an array.
     *
     * @return array The online payment data as an associative array.
     */
    public function to_array()
    {
        return [
            'id' => $this->id(),
            'name' => $this->title(),
            'icon' => $this->icon(),
            'is_enabled' => $this->enabled(),
            'is_offline' => $this->is_offline(),
            'description' => $this->description(),
            'settings' => (object) $this->settings(),
            'fields' => $this->admin_fields(),
            'webhook_url' => $this->webhook_url(),
            'webhook_events' => $this->webhook_events(),
        ];
    }
}
