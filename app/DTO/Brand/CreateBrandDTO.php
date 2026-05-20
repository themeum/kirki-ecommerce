<?php

namespace Kirki\Ecommerce\App\DTO\Brand;

use Kirki\Ecommerce\DTO;

class CreateBrandDTO extends DTO
{
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

    /** @var string */
    public $is_active = 1;
}
