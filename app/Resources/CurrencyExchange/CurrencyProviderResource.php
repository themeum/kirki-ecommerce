<?php

namespace Kirki\Ecommerce\App\Resources\CurrencyExchange;

use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a currency exchange rate provider.
 *
 * @since 1.0.0
 */
class CurrencyProviderResource extends Resource
{
    /**
     * Convert the exchange rate provider to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The provider ID, name, icon and description.
     */
    public function to_array()
    {
        return [
            'id' => $this->get_id(),
            'name' => $this->get_name(),
            'icon' => $this->get_icon(),
            'description' => $this->get_description(),
        ];
    }
}
