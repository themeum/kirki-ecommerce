<?php

namespace Kirki\Ecommerce\App\DTO\Attribute;

use Kirki\Ecommerce\App\DTO\ListFilterDTO;

class AttributeListFilterDTO extends ListFilterDTO
{
    /** @var string|null */
    public $type; // list, color
}
