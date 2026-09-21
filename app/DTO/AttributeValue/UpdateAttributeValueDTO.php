<?php

namespace Kirki\Ecommerce\App\DTO\AttributeValue;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for updating an attribute value.
 *
 * @since 1.0.0
 */
class UpdateAttributeValueDTO extends DTO
{
    /** @var int */
    public $id;

    /** @var string|null */
    public $value;

    /** @var string|null */
    public $color;

    /** @var int|null */
    public $media;
}
