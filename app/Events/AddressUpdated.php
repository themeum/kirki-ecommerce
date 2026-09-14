<?php

namespace Kirki\Ecommerce\App\Events;

use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

class AddressUpdated
{
    use Dispatchable;

    /**
     * The address instance.
     *
     * @var Address
     */
    public $address;

    public function __construct(Address $address)
    {
        $this->address = $address;
    }
}
