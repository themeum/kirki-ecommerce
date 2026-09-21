<?php

namespace Kirki\Ecommerce\App\DTO\Collection;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for creating a product collection.
 *
 * @since 1.0.0
 */
class CreateCollectionDTO extends DTO
{
    /** @inheritDoc */
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

    /** @var bool */
    public $is_active = 1;

    /** @var int|null */
    public $ordering = 0;
}
