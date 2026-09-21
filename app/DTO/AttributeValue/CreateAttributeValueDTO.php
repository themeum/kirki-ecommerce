<?php

namespace Kirki\Ecommerce\App\DTO\AttributeValue;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for creating a value (with optional color or media) of a product attribute.
 *
 * @since 1.0.0
 */
class CreateAttributeValueDTO extends DTO
{
    /** @var int */
    public $attribute_id;

    /** @var string */
    public $value;

    /** @var string|null */
    public $color;

    /** @var int|null */
    public $media;
}
