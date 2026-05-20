<?php

namespace Kirki\Ecommerce\App\DTO\Attribute;

use Kirki\Ecommerce\DTO;

class UpdateAttributeDTO extends DTO
{
    /** @var string */
    public $id;

    /** @var string */
    public $name;

    /** @var string|null */
    public $slug;

    /** @var string|null */
    public $type;
}
