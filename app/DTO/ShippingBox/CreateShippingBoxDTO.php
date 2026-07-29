<?php

namespace Kirki\Ecommerce\App\DTO\ShippingBox;

use Kirki\Ecommerce\Framework\DTO;

class CreateShippingBoxDTO extends DTO
{
    /** @var string */
    public $name;

    /** @var string|null */
    public $description;

    /** @var float */
    public $width;

    /** @var float */
    public $height;

    /** @var float */
    public $length;

    /** @var string */
    public $unit;

    /** @var bool|null */
    public $is_default;
}
