<?php

namespace Kirki\Ecommerce\App\DTO\ProductSchema;

use Kirki\Ecommerce\Framework\DTO;

class CreateProductSchemaDTO extends DTO
{
    public $name;
    public $is_default;
    public $schema;
}
