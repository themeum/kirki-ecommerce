<?php

namespace Kirki\Ecommerce\App\DTO\AttributeValue;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for creating and recoloring several values of one attribute at once.
 *
 * @since 1.0.0
 */
class BatchAttributeValuesDTO extends DTO
{
    /** @var int */
    public $attribute_id;

    /** @var array<int, array<string, mixed>> Rows to create (`value`, optional `color`). */
    public $create = [];

    /** @var array<int, array<string, mixed>> Rows to recolor (`id`, `color`). */
    public $update = [];
}
