<?php

namespace Kirki\Ecommerce\App\DTO\Account;

use Kirki\Ecommerce\Framework\DTO;

class UpdateAddressPayloadDTO extends DTO
{
    /** @var int */
    public $user_id;

    /** @var string AddressType::SHIPPING or AddressType::BILLING */
    public $type;

    /** @var bool|null Required when type is billing; unused for shipping */
    public $is_billing_same_as_shipping;

    /** @var string|null */
    public $first_name;

    /** @var string|null */
    public $last_name;

    /** @var string|null */
    public $email;

    /** @var string|null */
    public $phone;

    /** @var string|null */
    public $address_line1;

    /** @var string|null */
    public $address_line2;

    /** @var string|null */
    public $city;

    /** @var string|null */
    public $state;

    /** @var string|null */
    public $postal_code;

    /** @var string|null */
    public $country;
}
