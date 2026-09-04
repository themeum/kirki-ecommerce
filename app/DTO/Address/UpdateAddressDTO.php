<?php

namespace Kirki\Ecommerce\App\DTO\Address;

use Kirki\Ecommerce\Framework\DTO;

class UpdateAddressDTO extends DTO
{
    /** @var int */
    public $id;

    /** @var int */
    public $customer_id;

    /** @var string */
    public $first_name;

    /** @var string|null */
    public $last_name;

    /** @var string */
    public $address_line1;

    /** @var string|null */
    public $address_line2;

    /** @var string */
    public $city;

    /** @var string */
    public $state;

    /** @var string */
    public $country;

    /** @var string */
    public $postal_code;

    /** @var string|null */
    public $email;

    /** @var string|null */
    public $phone;

    /** @var string home, office, or others */
    public $type;
}
