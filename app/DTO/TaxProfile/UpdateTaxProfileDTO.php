<?php

namespace Kirki\Ecommerce\App\DTO\TaxProfile;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for updating a tax profile.
 *
 * @since 1.0.0
 */
class UpdateTaxProfileDTO extends DTO
{
    /** @var int */
    public $id;

    /** @var string */
    public $name;

    /** @var bool */
    public $is_default = false;
}
