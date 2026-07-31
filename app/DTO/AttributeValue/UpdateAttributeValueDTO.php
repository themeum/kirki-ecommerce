<?php

namespace Kirki\Ecommerce\App\DTO\AttributeValue;

use Kirki\Ecommerce\Framework\DTO;

class UpdateAttributeValueDTO extends DTO
{
    /**
     * @var int
     */
    public $id;

    /**
     * @var string|null
     */
    public $value;

    /**
     * @var string|null
     */
    public $color;

    /**
     * @var int|null
     */
    public $media;
}
