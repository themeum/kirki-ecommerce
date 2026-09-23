<?php

namespace Kirki\Ecommerce\App\DTO\Brand;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for updating a product brand.
 *
 * @since 1.0.0
 */
class UpdateBrandDTO extends DTO
{
    /** @var int */
    public $id;

    /** @var string */
    public $name;

    /** @var string|null */
    public $slug;

    /** @var string|null */
    public $description;

    /** @var int|null */
    public $logo;

    /** @var string|null */
    public $website_url;

    /** @var bool */
    public $is_active;
}
