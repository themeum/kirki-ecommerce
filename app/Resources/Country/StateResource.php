<?php

namespace Kirki\Ecommerce\App\Resources\Country;

use Kirki\Ecommerce\Framework\Resource;

class StateResource extends Resource
{
    public function to_array()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
        ];
    }
}
