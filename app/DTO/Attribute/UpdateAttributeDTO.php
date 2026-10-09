<?php

namespace Kirki\Ecommerce\App\DTO\Attribute;

defined('ABSPATH') || exit;

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
