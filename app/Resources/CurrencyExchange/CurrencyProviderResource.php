<?php

namespace Kirki\Ecommerce\App\Resources\CurrencyExchange;

use Kirki\Ecommerce\Framework\Resource;

class CurrencyProviderResource extends Resource
{
    /**
     * Convert the resource into an array.
     *
     * @return array
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
