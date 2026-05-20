<?php

namespace Kirki\Ecommerce\App\Resources\PaymentGateway;

use Kirki\Ecommerce\Resource;

class PaymentGatewayResource extends Resource
{
    /**
     * Convert the payment gateway resource to an array.
     *
     * @return array The payment gateway data as an associative array.
     */
    public function to_array()
    {
        return [
            'id' => $this->id(),
            'name' => $this->title(),
            'icon' => $this->icon(),
            'is_enabled' => $this->enabled(),
            'is_manual' => $this->is_manual(),
            'description' => $this->description(),
            'settings' => $this->settings(),
            'fields' => $this->admin_fields(),
            'webhook_url' => $this->webhook_url(),
            'webhook_events' => $this->webhook_events(),
        ];
    }
}
