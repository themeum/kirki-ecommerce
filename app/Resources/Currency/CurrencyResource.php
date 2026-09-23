<?php

namespace Kirki\Ecommerce\App\Resources\Currency;

use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a store currency and its exchange rate.
 *
 * @since 1.0.0
 */
class CurrencyResource extends Resource
{
    /**
     * Convert the currency resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The currency data.
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
