<?php

namespace Kirki\Ecommerce\App\DTO\Category;

use Kirki\Ecommerce\Framework\DTO;

class UpdateCategoryDTO extends DTO
{
    protected static $base_fields = [];

    /** @var int */
    public $id;

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

    /** @var string */
    public $is_active = 1;

    /** @var string */
    public $is_deletable = 1;
}
