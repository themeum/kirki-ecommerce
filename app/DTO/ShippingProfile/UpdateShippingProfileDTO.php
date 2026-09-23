<?php

namespace Kirki\Ecommerce\App\DTO\ShippingProfile;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for updating a shipping profile.
 *
 * @since 1.0.0
 */
class UpdateShippingProfileDTO extends DTO
{
    /** @var int */
    public $id;

    /** @var string */
    public $name;

    /** @var bool */
    public $is_default = false;
}
