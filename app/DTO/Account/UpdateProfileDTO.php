<?php

namespace Kirki\Ecommerce\App\DTO\Account;

use Kirki\Ecommerce\Framework\DTO;

class UpdateProfileDTO extends DTO
{
    /** @var string */
    public $first_name;

    /** @var string|null */
    public $last_name;

    /** @var string|null */
    public $phone;
}
