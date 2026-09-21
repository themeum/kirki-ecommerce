<?php

namespace Kirki\Ecommerce\App\DTO\Attribute;

use Kirki\Ecommerce\App\DTO\ListFilterDTO;

/**
 * Filters for listing product attributes, adding the attribute type to the shared list filters.
 *
 * @since 1.0.0
 */
class AttributeListFilterDTO extends ListFilterDTO
{
    /** @var string|null */
    public $type; // list, color
}
