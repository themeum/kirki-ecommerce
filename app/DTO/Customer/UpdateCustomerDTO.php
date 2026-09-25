<?php

namespace Kirki\Ecommerce\App\DTO\Customer;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for updating a customer.
 *
 * @since 1.0.0
 */
class UpdateCustomerDTO extends DTO
{
    /** @inheritDoc */
    protected static $base_fields = [];

    /** @var int */
    public $id;

    /** @var string */
    public $first_name;

    /** @var string|null */
    public $last_name;

    /** @var int|null */
    public $photo;

    /** @var string */
    public $email;

    /** @var string|null */
    public $phone;

    /** @var bool */
    public $accepts_marketing = 0;

    /** @var string|null */
    public $notes;

    /** @var array */
    public $tags = [];

    /** @var string|null */
    public $language = 'en';

    /** @var \Kirki\Ecommerce\App\DTO\Address\UpdateAddressDTO[] */
    public $addresses = [];
}
