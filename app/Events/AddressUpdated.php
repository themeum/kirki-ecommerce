<?php

namespace Kirki\Ecommerce\App\Events;

use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

/**
 * Event dispatched after a customer address has been updated.
 *
 * @since 1.0.0
 */
class AddressUpdated
{
    use Dispatchable;

    /**
     * The address instance.
     *
     * @var Address
     */
    public $address;

    /**
     * Create the event for an updated address.
     *
     * @since 1.0.0
     *
     * @param Address $address The address that was updated.
     */
    public function __construct(Address $address)
    {
        $this->address = $address;
    }
}
