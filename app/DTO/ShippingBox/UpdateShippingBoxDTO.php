<?php

namespace Kirki\Ecommerce\App\DTO\ShippingBox;

use Kirki\Ecommerce\DTO;

class UpdateShippingBoxDTO extends DTO
{
    /** @var int */
    public $id;

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
