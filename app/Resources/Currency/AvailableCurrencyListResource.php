<?php

namespace Kirki\Ecommerce\App\Resources\Currency;

use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a currency that can be added to the store.
 *
 * @since 1.0.0
 */
class AvailableCurrencyListResource extends Resource
{
    /**
     * Convert the currency resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The currency name, code and symbol.
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
