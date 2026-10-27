<?php

namespace Kirki\Ecommerce\App\DTO\Attribute;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for creating a product attribute.
 *
 * @since 1.0.0
 */
class CreateAttributeDTO extends DTO
{
    /** @var string */
    public $name;

    /** @var string|null */
    public $slug;

    /** @var string|null */
    public $type = 'list';

    /** @var array<int, array<string, mixed>> Value rows (`value`, optional `color`) created with the attribute. */
    public $values = [];
}
