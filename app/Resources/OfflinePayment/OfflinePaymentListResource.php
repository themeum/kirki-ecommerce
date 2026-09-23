<?php

namespace Kirki\Ecommerce\App\Resources\OfflinePayment;

use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for an offline payment gateway in list views.
 *
 * @since 1.0.0
 */
class OfflinePaymentListResource extends Resource
{
    /**
     * Convert the offline payment gateway to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The gateway ID, name, icon, enabled state and description.
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
        ];
    }
}
