<?php

namespace Kirki\Ecommerce\App\DTO\ShippingProfile;

use Kirki\Ecommerce\Framework\DTO;

class UpdateShippingProfileDTO extends DTO
{
    /** @var int */
    public $id;

    /** @var string */
    public $name;

    /** @var bool */
    public $is_default;
}
