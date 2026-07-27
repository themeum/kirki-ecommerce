<?php

namespace Kirki\Ecommerce\App\Resources\PaymentMethod;

use Kirki\Ecommerce\Framework\Resource;

class PaymentMethodListResource extends Resource
{
    /**
     * Convert the payment method resource to an array.
     *
     * @return array The payment method data as an associative array.
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
        ];
    }
}
