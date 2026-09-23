<?php

namespace Kirki\Ecommerce\App\DTO\Customer;

use Kirki\Ecommerce\App\DTO\ListFilterDTO;

/**
 * Filters for listing customers, adding country and city to the shared list filters.
 *
 * @since 1.0.0
 */
class CustomerListFilterDTO extends ListFilterDTO
{
    /** @var string|null */
    public $country;

    /** @var string|null */
    public $city;
}
