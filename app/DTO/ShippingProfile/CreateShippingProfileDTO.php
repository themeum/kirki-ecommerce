<?php

namespace Kirki\Ecommerce\App\DTO\ShippingProfile;

use Kirki\Ecommerce\Framework\DTO;

class CreateShippingProfileDTO extends DTO
{
    /** @var string */
    public $name;

    /** @var bool */
    public $is_default;
}
