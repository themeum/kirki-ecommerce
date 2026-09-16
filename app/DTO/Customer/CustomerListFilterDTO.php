<?php

namespace Kirki\Ecommerce\App\DTO\Customer;

use Kirki\Ecommerce\App\DTO\ListFilterDTO;

class CustomerListFilterDTO extends ListFilterDTO
{
    /** @var string|null */
    public $country;

    /** @var string|null */
    public $city;
}
