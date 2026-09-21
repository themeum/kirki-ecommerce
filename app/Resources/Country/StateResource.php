<?php

namespace Kirki\Ecommerce\App\Resources\Country;

use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a country state or region.
 *
 * @since 1.0.0
 */
class StateResource extends Resource
{
    /**
     * Convert the state resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The state ID and name.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
        ];
    }
}
