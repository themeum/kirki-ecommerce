<?php

namespace Kirki\Ecommerce\App\DTO\Customer;

use Kirki\Ecommerce\Framework\DTO;

class CreateCustomerDTO extends DTO
{
    /** @var int|null */
    public $user_id = null;

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

    /** @var int|null */
    public $created_by = null;

    /** @var int|null */
    public $updated_by = null;
}
