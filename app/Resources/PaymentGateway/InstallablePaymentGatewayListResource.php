<?php

namespace Kirki\Ecommerce\App\Resources\PaymentGateway;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\Framework\Resource;

class InstallablePaymentGatewayListResource extends Resource
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
            'is_installed' => Payment::get_gateway($this->id()) ? true : false,
        ];
    }
}
