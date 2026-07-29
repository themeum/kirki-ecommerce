<?php

namespace Kirki\Ecommerce\App\Currency\DTO;

use Kirki\Ecommerce\Framework\DTO;

class APIUsageDTO extends DTO
{
    /**
     * @var int|null
     */
    public $total;

    /**
     * @var int|null
     */
    public $used;

    /**
     * @var int|null
     */
    public $remaining;

    /**
     * @var string|null
     */
    public $reset_at;
}
