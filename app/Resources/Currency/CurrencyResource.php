<?php

namespace Kirki\Ecommerce\App\Resources\Currency;

use Kirki\Ecommerce\Resource;

class CurrencyResource extends Resource
{
    /**
     * Convert the currency resource to an array.
     *
     * @return array The currency data as an associative array.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'symbol' => $this->symbol,
            'exchange_rate' => $this->exchange_rate,
            'is_base' => $this->is_base,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
