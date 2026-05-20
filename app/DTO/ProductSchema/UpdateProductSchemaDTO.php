<?php

namespace Kirki\Ecommerce\App\DTO\ProductSchema;

use Kirki\Ecommerce\DTO;

class UpdateProductSchemaDTO extends DTO
{
    public $id;
    public $name;
    public $is_default;
    public $schema;
}
