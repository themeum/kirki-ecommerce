<?php

namespace Kirki\Ecommerce\App\DTO\Attribute;

use Kirki\Ecommerce\Framework\DTO;

class CreateAttributeDTO extends DTO
{
    /** @var string */
    public $name;

    /** @var string|null */
    public $slug;

    /** @var string|null */
    public $type = 'list';
}
