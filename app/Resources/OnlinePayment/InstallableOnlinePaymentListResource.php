<?php

namespace Kirki\Ecommerce\App\Resources\OnlinePayment;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for an online payment gateway that can be installed.
 *
 * @since 1.0.0
 */
class InstallableOnlinePaymentListResource extends Resource
{
    /**
     * Convert the online payment gateway to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The gateway ID, name, icon, and installed and availability flags.
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
