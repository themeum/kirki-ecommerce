<?php

namespace Kirki\Ecommerce\App\DTO\Collection;

use Kirki\Ecommerce\Framework\DTO;

class UpdateCollectionDTO extends DTO
{
    protected static $base_fields = [];

    /** @var int */
    public $id;

    /** @var string */
    public $title;

    /** @var string|null */
    public $slug;

    /** @var string|null */
    public $description;

    /** @var int|null */
    public $banner;

    /** @var string|null */
    public $seo_title;

    /** @var string|null */
    public $seo_description;

    /** @var string|null */
    public $seo_keywords;

    /** @var string */
    public $is_active;

    /** @var int|null */
    public $ordering;
}
