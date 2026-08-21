<?php

namespace Kirki\Ecommerce\App\DTO\TaxProfile;

use Kirki\Ecommerce\Framework\DTO;

class UpdateTaxProfileDTO extends DTO
{
    /** @var int */
    public $id;

    /** @var string */
    public $name;

    /** @var bool */
    public $is_default = false;
}
