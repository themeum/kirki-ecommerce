<?php

namespace Kirki\Ecommerce\App\DTO\AttributeValue;

use Kirki\Ecommerce\Framework\DTO;

class CreateAttributeValueDTO extends DTO
{
    public $attribute_id;
    public $value;
    public $color;
}
