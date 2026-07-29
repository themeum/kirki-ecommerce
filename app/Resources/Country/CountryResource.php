<?php

namespace Kirki\Ecommerce\App\Resources\Country;

use Kirki\Ecommerce\Framework\Resource;

class CountryResource extends Resource
{
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
        ];
    }
}
