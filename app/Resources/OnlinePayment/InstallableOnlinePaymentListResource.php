<?php

namespace Kirki\Ecommerce\App\Resources\OnlinePayment;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a catalog entry of an online payment gateway that can be installed.
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
     * @return array<string, mixed> The gateway ID, name, icon, description, version and installed flag.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'icon' => $this->icon_url,
            'description' => $this->description,
            'version' => $this->version,
            'is_installed' => (bool) $this->is_installed,
        ];
    }
}
