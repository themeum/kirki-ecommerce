<?php

namespace Kirki\Ecommerce\App\Resources\OfflinePayment;

use Kirki\Ecommerce\Framework\Resource;

class OfflinePaymentListResource extends Resource
{
    /**
     * Convert the offline payment resource to an array.
     *
     * @return array The offline payment data as an associative array.
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
