<?php

namespace Kirki\Ecommerce\App\DTO\Attribute;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for updating a product attribute.
 *
 * @since 1.0.0
 */
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
