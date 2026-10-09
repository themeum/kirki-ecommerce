<?php

namespace Kirki\Ecommerce\App\DTO\ProductSchema;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for creating a product schema.
 *
 * @since 1.0.0
 */
class CreateProductSchemaDTO extends DTO
{
    /** @var string */
    public $name;
    /** @var bool|null */
    public $is_default;
    /** @var array|null */
    public $schema;
}
