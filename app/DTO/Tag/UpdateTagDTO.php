<?php

namespace Kirki\Ecommerce\App\DTO\Tag;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for updating a product tag.
 *
 * @since 1.0.0
 */
class UpdateTagDTO extends DTO
{
    /** @var string */
    public $id;

    /** @var string */
    public $name;

    /** @var string|null */
    public $slug;

    /** @var string|null */
    public $description;
}
