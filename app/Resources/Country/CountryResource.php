<?php

namespace Kirki\Ecommerce\App\Resources\Country;

use Kirki\Ecommerce\App\Supports\AddressRules;
use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a country with its states.
 *
 * @since 1.0.0
 */
class CountryResource extends Resource
{
    /**
     * Convert the country resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The country data, its states and address display rules.
     */
    public function to_array()
    {
        return [
            'name' => $this->name,
            'code' => $this->code,
            'group' => $this->group,
            'phone_code' => $this->phone_code,
            'currency' => $this->currency,
            'currency_name' => $this->currency_name,
            'currency_symbol' => $this->currency_symbol,
            'flag' => $this->flag,
            'states' => StateResource::collection($this->states),
            'address_rules' => AddressRules::for_display($this->code),
        ];
    }
}
