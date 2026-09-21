<?php

namespace Kirki\Ecommerce\App\DTO\Tag;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for creating a product tag.
 *
 * @since 1.0.0
 */
class CreateTagDTO extends DTO
{
    /** @var string */
    public $name;

    /** @var string|null */
    public $slug;

    /** @var string|null */
    public $description;
}
