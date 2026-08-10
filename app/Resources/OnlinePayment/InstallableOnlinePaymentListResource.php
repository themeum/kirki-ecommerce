<?php

namespace Kirki\Ecommerce\App\Resources\OnlinePayment;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\Framework\Resource;

class InstallableOnlinePaymentListResource extends Resource
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
            'is_installed' => Payment::get_provider($this->id()) ? true : false,
            'is_available' => $this->available(),
        ];
    }
}
