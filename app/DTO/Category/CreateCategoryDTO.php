<?php

namespace Kirki\Ecommerce\App\DTO\Category;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for creating a product category.
 *
 * @since 1.0.0
 */
class CreateCategoryDTO extends DTO
{
    /** @inheritDoc */
    protected static $base_fields = [];

    /** @var int|null */
    public $parent_id;

    /** @var string */
    public $name;

    /** @var string|null */
    public $slug;

    /** @var string|null */
    public $description;

    /** @var int|null */
    public $image;

    /** @var int */
    public $level = 1;

    /** @var int */
    public $ordering = 0;

    /** @var bool */
    public $is_active = 1;

    /** @var bool */
    public $is_deletable = 1;
}
