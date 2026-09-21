<?php

namespace Kirki\Ecommerce\App\DTO\Account;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for updating a user's profile name.
 *
 * @since 1.0.0
 */
class UpdateProfilePayloadDTO extends DTO
{
    /** @var int */
    public $user_id;

    /** @var string */
    public $first_name;

    /** @var string|null */
    public $last_name;
}
