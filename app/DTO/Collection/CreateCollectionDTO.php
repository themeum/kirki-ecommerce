<?php

namespace Kirki\Ecommerce\App\DTO\Collection;

use Kirki\Ecommerce\DTO;

class CreateCollectionDTO extends DTO
{
    protected static $base_fields = [];

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
    public $is_active = 1;

    /** @var int|null */
    public $ordering = 0;
}
