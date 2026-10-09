<?php

namespace Kirki\Ecommerce\App\Resources\PaymentMethod;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a payment method, offline or online, in list views.
 *
 * @since 1.0.0
 */
class PaymentMethodListResource extends Resource
{
    /**
     * Convert the payment method to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The method ID, name, icon, icon media, enabled state, offline flag and description.
     */
    public function to_array()
    {
        return [
            'id' => $this->id(),
            'name' => $this->title(),
            'icon' => $this->icon(),
            'icon_media' => $this->icon_media(),
            'is_enabled' => $this->enabled(),
            'is_offline' => $this->is_offline(),
            'description' => $this->description(),
        ];
    }
}
