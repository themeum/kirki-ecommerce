<?php

namespace Kirki\Ecommerce\App\DTO\TaxProfile;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for creating a tax profile.
 *
 * @since 1.0.0
 */
class CreateTaxProfileDTO extends DTO
{
    /** @var string */
    public $name;

    /** @var bool */
    public $is_default = false;
}
