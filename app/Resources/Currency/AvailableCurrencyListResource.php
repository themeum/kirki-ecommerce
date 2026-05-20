<?php

namespace Kirki\Ecommerce\App\Resources\Currency;

use Kirki\Ecommerce\Resource;

class AvailableCurrencyListResource extends Resource
{
    /**
     * Convert the currency resource to an array.
     *
     * @return array The currency data as an associative array.
     */
    public function to_array()
    {
        return [
            'name' => $this->name,
            'code' => $this->code,
            'symbol' => $this->symbol,
        ];
    }
}
