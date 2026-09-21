<?php

namespace Kirki\Ecommerce\App\DTO\ShippingProfile;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for creating a shipping profile.
 *
 * @since 1.0.0
 */
class CreateShippingProfileDTO extends DTO
{
    /** @var string */
    public $name;

    /** @var bool */
    public $is_default = false;
}
