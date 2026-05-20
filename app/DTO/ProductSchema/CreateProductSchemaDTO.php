<?php

namespace Kirki\Ecommerce\App\DTO\ProductSchema;

use Kirki\Ecommerce\DTO;

class CreateProductSchemaDTO extends DTO
{
    public $name;
    public $is_default;
    public $schema;
}
