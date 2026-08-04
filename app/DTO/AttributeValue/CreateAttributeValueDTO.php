<?php

namespace Kirki\Ecommerce\App\DTO\AttributeValue;

use Kirki\Ecommerce\Framework\DTO;

class CreateAttributeValueDTO extends DTO
{
    /**
     * @var int
     */
    public $attribute_id;

    /**
     * @var string
     */
    public $value;

    /*
     * @var string|null
     */
    public $color;

    /*
     * @var int|null
     */
    public $media;
}
