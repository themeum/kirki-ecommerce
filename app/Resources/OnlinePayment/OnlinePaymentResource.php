<?php

namespace Kirki\Ecommerce\App\Resources\OnlinePayment;

use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a single online payment gateway with its settings and webhooks.
 *
 * @since 1.0.0
 */
class OnlinePaymentResource extends Resource
{
    /**
     * Convert the online payment gateway to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The gateway data, including settings, admin fields and webhook details.
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
