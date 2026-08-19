<?php

namespace Kirki\Ecommerce\App\DTO\Account;

use Kirki\Ecommerce\Framework\DTO;

class UpdateProfilePayloadDTO extends DTO
{
    /** @var int */
    public $user_id;

    /** @var string */
    public $first_name;

    /** @var string|null */
    public $last_name;

    /** @var string|null */
    public $phone;

    /** @var string */
    public $display_name;
}
